const Hearing = require('../models/Hearing');
const Case = require('../models/Case');
const User = require('../models/User');
const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Schedule a hearing
// @route   POST /api/hearings
// @access  Private (Court Officer)
exports.createHearing = asyncHandler(async (req, res, next) => {
  const { caseId, date, duration, type, location, notes } = req.body;
  const user = req.user;

  try {
    // Verify user is a court officer
    if (user.role !== 'court-officer') {
      return next(new ErrorResponse('Only court officers can schedule hearings', 403));
    }

    // Find the case
    const caseRecord = await Case.findById(caseId);
    if (!caseRecord) {
      return next(new ErrorResponse('Case not found', 404));
    }

    // Check if case is active
    

    // Validate date
    const hearingDate = new Date(date);
    if (hearingDate < new Date()) {
      return next(new ErrorResponse('Hearing date must be in the future', 400));
    }

    // Validate duration
    if (duration < 2 || duration > 180) {
      return next(new ErrorResponse('Hearing duration must be between 2 and 180 minutes', 400));
    }

    // Create hearing
    const newHearing = await Hearing.create({
      case: caseId,
      date,
      duration,
      type,
      location,
      notes,
      status: 'scheduled',
      createdBy: user._id
    });

    // Add initial attendees
    const hearingAttendees = [
      { user: caseRecord.litigant, role: 'litigant' },
      { user: caseRecord.advocate, role: 'advocate' }
    ];

    // If this is a virtual hearing, add the virtual link
    if (type === 'virtual') {
      // Generate a virtual meeting link (implement your video conferencing integration here)
      const virtualLink = `https://your-video-conferencing-platform.com/meeting/${newHearing._id}`;
      newHearing.location.virtualLink = virtualLink;
    }
    caseRecord.status = 'scheduled-hearing';
    caseRecord.hearings.push(newHearing._id);
    await caseRecord.save();
    console.log("the hearing of case are:", caseRecord);
    newHearing.attendees = hearingAttendees;
    await newHearing.save();

    // Create notifications for litigant and advocate
    const notificationData = {
      title: 'Hearing Scheduled',
      message: `A hearing has been scheduled for case "${caseRecord.title || 'your case'}" on ${new Date(date).toLocaleDateString()}`,
      relatedCase: caseId,
      type: 'hearing',
      hearingDetails: {
        date,
        type,
        location
      }
    };

    // Create notifications for all recipients
    const recipients = [
      caseRecord.litigant,
      ...(caseRecord.advocates || [])
    ].filter(Boolean);

    await Promise.all(recipients.map(recipientId => 
      Notification.create({
        ...notificationData,
        recipient: recipientId,
        sender: user._id
      }).catch(err => {
        console.error('Failed to create notification:', err);
      })
    ));

    res.status(201).json({
      success: true,
      data: newHearing
    });
  } catch (error) {
    next(new ErrorResponse(error.message, 500));
  }
});

// @desc    Allocate judge to hearing
// @route   PUT /api/hearings/:id/allocate-judge
// @access  Private (Judge)
exports.allocateJudge = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  // Verify user is a judge
  if (user.role !== 'judge') {
    return next(new ErrorResponse('Only judges can allocate themselves to hearings', 403));
  }

  const hearing = await Hearing.findById(id);
  if (!hearing) {
    return next(new ErrorResponse('Hearing not found', 404));
  }

  // Check if judge can be allocated
  if (hearing.status !== 'pending-judge') {
    return next(new ErrorResponse('Hearing is not awaiting judge allocation', 400));
  }

  // Add judge as attendee
  hearing.attendees.push({
    user: user._id,
    role: 'judge',
    status: 'confirmed'
  });

  // Update hearing status
  hearing.status = 'scheduled';
  await hearing.save();

  res.status(200).json({
    success: true,
    data: hearing
  });
});

// @desc    Get hearing details
// @route   GET /api/hearings/:id
// @access  Private
exports.getHearing = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  // If id is 'upcoming', handle it as a special case
  if (id === 'upcoming') {
    return getUpcomingHearings(req, res, next);
  }

  const hearing = await Hearing.findById(id)
    .populate('case')
    .populate('attendees.user');

  if (!hearing) {
    return next(new ErrorResponse('Hearing not found', 404));
  }

  // Check if user is authorized to view this hearing
  const userIsAttendee = hearing.attendees.some(attendee => 
    attendee.user.toString() === user._id.toString()
  );

  // Court officers can view all hearings
  if (user.role === 'court-officer' || userIsAttendee) {
    res.status(200).json(hearing);
  } else {
    return next(new ErrorResponse('Not authorized to view this hearing', 403));
  }
});

// @desc    Update hearing status
// @route   PUT /api/hearings/:id/status
// @access  Private (Court Officer)
exports.updateHearingStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const hearingId = req.params.id;
  const user = req.user;

  // Verify user is a court officer
  if (user.role !== 'court-officer') {
    return next(new ErrorResponse('Only court officers can update hearing status', 403));
  }

  // Find the hearing with populated case and participants
  const hearing = await Hearing.findById(hearingId)
    .populate({
      path: 'case',
      populate: [
        { path: 'litigant', select: 'name email' },
        { path: 'advocates', select: 'name email' }
      ]
    });
    
  if (!hearing) {
    return next(new ErrorResponse('Hearing not found', 404));
  }
  
  if (!hearing.case) {
    return next(new ErrorResponse('Case not found for this hearing', 404));
  }

  // Validate status transition
  const validTransitions = {
    'scheduled': ['in-progress', 'cancelled'],
    'in-progress': ['waiting-decision', 'adjourned', 'cancelled'],
    'waiting-decision': ['completed', 'adjourned', 'cancelled'],
    'adjourned': ['scheduled', 'cancelled'],
    'cancelled': []
  };

  if (!validTransitions[hearing.status]?.includes(status)) {
    return next(new ErrorResponse(`Invalid status transition from ${hearing.status} to ${status}`, 400));
  }
  
  // Update the hearing status
  hearing.status = status;
  await hearing.save();
  
  // Update case status based on hearing status
  if (status === 'completed') {
    // Only update the hearing status, not the case status
    // The case status will be updated separately when the final judgment is given
    await Case.findByIdAndUpdate(hearing.case._id, { 
      status: 'waiting-decision',
      $set: { 'timeline.$.completedAt': new Date() }
    });
  } else if (status === 'cancelled') {
    // If hearing is cancelled, update case status accordingly
    const updateData = { 
      status: 'cancelled',
      'timeline.$.cancelledAt': new Date()
    };
    
    // If this was the only hearing, close the case
    const hearingsCount = await Hearing.countDocuments({ case: hearing.case._id });
    if (hearingsCount === 1) {
      updateData.status = 'closed';
      updateData.closedAt = new Date();
      updateData.closedReason = 'Hearing cancelled';
    }
    
    await Case.findByIdAndUpdate(hearing.case._id, updateData);
  }

  // Create notifications for all case participants
  const recipients = [
    hearing.case.litigant?._id,
    ...(hearing.case.advocates?.map(advocate => advocate._id) || []),
    ...(hearing.case.courtOfficer ? [hearing.case.courtOfficer._id] : [])
  ].filter(Boolean);
  
  if (recipients.length > 0) {
    await Promise.all(recipients.map(recipientId => 
      Notification.create({
        title: 'Hearing Status Updated',
        message: `Hearing for case ${hearing.case.title || 'your case'} has been marked as ${status}`,
        type: 'hearing',
        recipient: recipientId,
        sender: user.id,
        relatedCase: hearing.case._id,
        relatedHearing: hearing._id
      }).catch(err => {
        console.error('Failed to create notification:', err);
      })
    ));
  }

  res.status(200).json({
    success: true,
    data: hearing
  });
});

// @desc    Get user's upcoming hearings
// @route   GET /api/hearings/upcoming
// @access  Private
exports.getUpcomingHearings = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const now = new Date();
  let hearings = [];
  console.log(user);
  if (user.role === 'court-officer') {
    hearings = await Hearing.find({
      createdBy: user.id,
    })
    .populate('case')
    .sort({ date: 1 });
  } else if (user.role === 'litigant' || user.role === 'advocate') {
    const cases = await Case.find({
      $or: [
        { litigant: user.id },
        { advocates: user.id }
      ]
    }).select('_id');

    const caseIds = cases.map(c => c._id);
    
    hearings = await Hearing.find({
      case: { $in: caseIds },
    })
    .populate('case')
    .sort({ date: 1 });
  }

  res.status(200).json({
    success: true,
    data: hearings
  });
});

// @desc    Update hearing details
// @route   PUT /api/hearings/:id
// @access  Private (Court Officer)
exports.updateHearing = asyncHandler(async (req, res, next) => {
  const { date, duration, type, location, notes } = req.body;
  const user = req.user;
  const hearingId = req.params.id;

  // Verify user is a court officer
  if (user.role !== 'court-officer') {
    return next(new ErrorResponse('Only court officers can update hearings', 403));
  }

  // Find the hearing
  const hearing = await Hearing.findById(hearingId);
  if (!hearing) {
    return next(new ErrorResponse('Hearing not found', 404));
  }
  // console.log("the hearing is ", hearing)
  // Validate date if provided
  if (date) {
    const hearingDate = new Date(date);
    if (hearingDate < new Date()) {
      return next(new ErrorResponse('Hearing date must be in the future', 400));
    }
  }

  // Validate duration if provided
  if (duration && (duration < 2 || duration > 180)) {
    return next(new ErrorResponse('Hearing duration must be between 2 and 180 minutes', 400));
  }

  // Update hearing details
  if (date) hearing.date = date;
  if (duration) hearing.duration = duration;
  if (type) hearing.type = type;
  if (location) hearing.location = location;
  if (notes) hearing.notes = notes;

  // If type is changed to virtual and there's no virtual link, generate one
  if (type === 'virtual' && !hearing.location.virtualLink) {
    const virtualLink = `https://your-video-conferencing-platform.com/meeting/${hearing._id}`;
    hearing.location.virtualLink = virtualLink;
  }
  
  // Save updated hearing
  await hearing.save();
  await hearing.populate('case');
  const notificationData = {
    title: 'Hearing Updated',
    message: `The hearing for case "${hearing.case.title}" has been updated`,
    relatedCase: hearing.case._id,
    type: 'hearing',
    hearingDetails: {
      date: hearing.date,
      type: hearing.type,
      location: hearing.location
    },
    
  }
  console.log("the hearing.case.advocate is ", hearing.case.advocate)
  console.log("the hearing.case.title is ", hearing.case.title)

  
  console.log(hearing);
  hearing.status = 'scheduled';
  await hearing.save();
  //for litigant
  await Notification.create({
    ...notificationData,
    recipient: hearing.case.litigant,
    sender: user._id
  })
  //for advocate
  await Notification.create({
    ...notificationData,
    recipient: hearing.case.advocates[0],
    sender: user._id
  })
  res.status(200).json({
    success: true,
    data: hearing
  });
});

// @desc    Delete a hearing
// @route   DELETE /api/hearings/:id
// @access  Private (Court Officer)
exports.deleteHearing = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const hearingId = req.params.id;

  // Verify user is a court officer
  if (user.role !== 'court-officer') {
    return next(new ErrorResponse('Only court officers can delete hearings', 403));
  }

  // Find the hearing
  const hearing = await Hearing.findById(hearingId);
  if (!hearing) {
    return next(new ErrorResponse('Hearing not found', 404));
  }

  // Delete the hearing
  await hearing.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

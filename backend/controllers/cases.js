const Case = require('../models/Case');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Hearing = require('../models/Hearing');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const mongoose = require('mongoose');

// @desc    Update advocate status
// @route   PUT /api/cases/:caseId/advocates/:advocateId/status
// @access  Private
exports.updateAdvocateStatus = asyncHandler(async (req, res, next) => {
  const { caseId, advocateId } = req.params;
  const { status } = req.body;

  // Validate status
  if (!['pending', 'accepted', 'rejected'].includes(status)) {
    return next(new ErrorResponse('Invalid status value', 400));
  }

  // Find the case
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    return next(new ErrorResponse('Case not found', 404));
  }

  // Find advocate index
  const advocateIndex = caseDoc.advocates.findIndex(advocate => advocate.toString() === advocateId);
  if (advocateIndex === -1) {
    return next(new ErrorResponse('Advocate not found in case', 404));
  }

  // Update advocate status
  caseDoc.advocates[advocateIndex].status = status;

  // If status is changing to active, scheduled-hearing, or in-progress
  if (['approved', 'scheduled-hearing', 'in-progress'].includes(caseDoc.status)) {
    // Check if there's at least one advocate assigned
    if (caseDoc.advocates.length === 0) {
      // If no advocate assigned, revert status to pending
      caseDoc.status = 'pending';
      throw new Error('Case cannot proceed without an advocate assigned');
    }
  }
  
  await caseDoc.save();

  res.status(200).json({
    success: true,
    data: caseDoc
  });
});

// @desc    Schedule a hearing for a case
// @route   POST /api/cases/:caseId/hearings
// @access  Private (Court officers only)
exports.scheduleHearing = asyncHandler(async (req, res, next) => {
  const { caseId } = req.params;

  const { date, type, location, notes } = req.body;

  // Validate case ID format
  if (!mongoose.Types.ObjectId.isValid(caseId)) {
    return next(new ErrorResponse('Invalid case ID format', 400));
  }

  // Only court officers can schedule hearings
  if (req.user.role !== 'court-officer') {
    return next(new ErrorResponse('Not authorized to schedule hearings', 403));
  }

  // Find the case
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    return next(new ErrorResponse('Case not found', 404));
  }

  // Check if case is approved
  if (caseDoc.status !== 'approved') {
    return next(new ErrorResponse('Cannot schedule hearing for unapproved case', 400));
  }

  // Create hearing
  const hearing = await Hearing.create({
    case: id,
    date,
    type,
    location,
    notes,
    attendees: [
      // Add litigant
      {
        user: caseDoc.litigant,
        role: 'litigant'
      },
      // Add advocate
      {
        user: caseDoc.advocates[0],
        role: 'advocate'
      }
    ],
    createdBy: req.user.id
  });

  // Update case status and next hearing date
  caseDoc.status = 'scheduled-hearing';
  caseDoc.nextHearingDate = date;
  await caseDoc.save();

  // Create notifications for litigant and advocate
  const notifications = await Promise.all([
    Notification.create({
      title: 'Hearing Scheduled',
      message: `Your case "${caseDoc.title}" has a scheduled hearing on ${new Date(date).toLocaleString()}`,
      recipient: caseDoc.litigant,
      sender: req.user.id,
      type: 'hearing-scheduled',
      relatedCase: id,
      relatedHearing: hearing._id,
      isActionRequired: true
    }),
    Notification.create({
      title: 'Hearing Scheduled',
      message: `Your case "${caseDoc.title}" has a scheduled hearing on ${new Date(date).toLocaleString()}`,
      recipient: caseDoc.advocates[0],
      sender: req.user.id,
      type: 'hearing-scheduled',
      relatedCase: id,
      relatedHearing: hearing._id,
      isActionRequired: true
    })
  ]);

  res.status(201).json({
    success: true,
    data: hearing
  });
});

// @desc    Get all cases
// @route   GET /api/cases
// @access  Private
exports.getCases = async (req, res, next) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'litigant') {
      // Litigants can only access their own cases
      query.litigant = req.user.id;
    } else if (req.user.role === 'advocate') {
      // Advocates can access cases they're assigned to
      query.advocates = req.user.id;
    }
    // Court officers can see all cases
    
    // Add filters from query params
    if (req.query.status) {
      // Handle comma-separated status values
      if (req.query.status.includes(',')) {
        const statusValues = req.query.status.split(',');
        query.status = { $in: statusValues };
      } else {
        query.status = req.query.status;
      }
    }
    
    if (req.query.court) {
      query.court = req.query.court;
    }
    
    if (req.query.caseType) {
      query.caseType = req.query.caseType;
    }
    
    const cases = await Case.find(query)
      .populate('litigant', 'name email phone')
      .populate('advocates', 'name email specialization')
      .sort({ filingDate: -1 });
    
    res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single case
// @route   GET /api/cases/:id
// @access  Private
exports.getCase = asyncHandler(async (req, res, next) => {
  // Check if the ID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse('Invalid case ID format', 400));
  }

  const caseDoc = await Case.findById(req.params.id)
    .populate('litigant', 'name email phone')
    .populate('advocates', 'name email')
    .populate('documents')
    .populate('hearings')
    .populate({
      path: 'notes',
      populate: {
        path: 'addedBy',
        select: 'name role'
      }
    });
  if (!caseDoc) {
    return next(new ErrorResponse('Case not found', 404));
  }

  // Check if user is authorized to view this case
  if (
    req.user.role !== 'court-officer' &&
    caseDoc.litigant._id.toString() !== req.user.id &&
    !caseDoc.advocates.some(advocate => advocate._id.toString() === req.user.id)
  ) {
    return next(new ErrorResponse('Not authorized to access this case', 403));
  }

  res.status(200).json({
    success: true,
    data: caseDoc
  });
});

// Generate unique case number
const generateCaseNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = 'NE';
  
  // Find the latest case number for the current year
  const latestCase = await Case.findOne(
    { caseNumber: new RegExp(`^${prefix}${year}`) },
    { caseNumber: 1 },
    { sort: { caseNumber: -1 } }
  );

  let sequence = 1;
  if (latestCase) {
    // Extract the sequence number from the latest case number
    const lastSequence = parseInt(latestCase.caseNumber.slice(-5));
    sequence = lastSequence + 1;
  }

  // Format the sequence number with leading zeros
  const formattedSequence = sequence.toString().padStart(5, '0');
  return `${prefix}${year}${formattedSequence}`;
};

// @desc    Create new case
// @route   POST /api/cases
// @access  Private (Litigants only)
exports.createCase = async (req, res, next) => {
  try {
    // Only litigants can create cases
    if (req.user.role !== 'litigant') {
      return res.status(403).json({
        success: false,
        message: 'Only litigants can file new cases'
      });
    }
    
    const { title, description, court, caseType, opposingParty } = req.body;
    
    // Generate unique case number
    const caseNumber = await generateCaseNumber();
    
    // Create new case
    const newCase = await Case.create({
      title,
      description,
      court,
      caseType,
      opposingParty,
      caseNumber,
      litigant: req.user._id,
      status: 'pending-approval',
      filingDate: new Date()
    });

    await newCase.save();
    
    // Create notification for court officers
    const courtOfficers = await User.find({ role: 'court-officer' });
    
    const notificationPromises = courtOfficers.map(officer => {
      return Notification.create({
        title: 'New Case Filed',
        message: `A new case "${newCase.title}" has been filed and requires approval.`,
        recipient: officer._id,
        sender: req.user.id,
        type: 'case-update',
        relatedCase: newCase._id,
        isActionRequired: true,
        actionUrl: `/dashboard/pending-cases/${newCase._id}`
      });
    });
    
    await Promise.all(notificationPromises);
    
    res.status(201).json({
      success: true,
      data: newCase
    });
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating case', 
      error: error.message 
    });
  }
};

// @desc    Get pending cases
// @route   GET /api/cases/pending
// @access  Private
exports.scheduleHearing = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { date, type, location, notes } = req.body;

  // Only court officers can schedule hearings
  if (req.user.role !== 'court-officer') {
    return next(new ErrorResponse('Not authorized to schedule hearings', 403));
  }

  // Find the case
  
  const caseDoc = await Case.findById(id);
  if (!caseDoc) {
    return next(new ErrorResponse('Case not found', 404));
  }

  // Check if case is approved
  if (caseDoc.status !== 'approved') {
    return next(new ErrorResponse('Cannot schedule hearing for unapproved case', 400));
  }

  // Create hearing
  const hearing = await Hearing.create({
    case: id,
    date,
    type,
    location,
    notes,
    attendees: [
      // Add litigant
      {
        user: caseDoc.litigant,
        role: 'litigant'
      },
      // Add advocate
      {
        user: caseDoc.advocates[0],
        role: 'advocate'
      }
    ],
    createdBy: req.user.id
  });

  // Update case status and next hearing date
  caseDoc.status = 'scheduled-hearing';
  caseDoc.nextHearingDate = date;
  await caseDoc.save();

  // Create notifications for litigant and advocate
  const notifications = await Promise.all([
    Notification.create({
      title: 'Hearing Scheduled',
      message: `Your case "${caseDoc.title}" has a scheduled hearing on ${new Date(date).toLocaleString()}`,
      recipient: caseDoc.litigant,
      sender: req.user.id,
      type: 'hearing-scheduled',
      relatedCase: id,
      relatedHearing: hearing._id,
      isActionRequired: true
    }),
    Notification.create({
      title: 'Hearing Scheduled',
      message: `Your case "${caseDoc.title}" has a scheduled hearing on ${new Date(date).toLocaleString()}`,
      recipient: caseDoc.advocates[0],
      sender: req.user.id,
      type: 'hearing-scheduled',
      relatedCase: id,
      relatedHearing: hearing._id,
      isActionRequired: true
    })
  ]);

  res.status(201).json({
    success: true,
    data: hearing
  });
});

exports.getPendingCases = asyncHandler(async (req, res, next) => {
  const user = req.user;

  // For court officers, show all pending cases
  if (user.role === 'court-officer') {
    const cases = await Case.find({ status: { $in: ['approved'] } })
      .populate('litigant', 'name email')
      .populate('advocates', 'name email')
      .populate('opposingParty', 'name email');
    
    return res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });
  }

  // For other users, show only their pending cases
  const cases = await Case.find({
    $or: [
      { litigant: user._id },
      { 'advocates._id': user._id }
    ],
    status: { $in: ['pending-judge', 'pending-hearing', 'pending'] }
  })
    .populate('litigant', 'name email')
    .populate('advocates', 'name email')
    .populate('opposingParty', 'name email');

  res.status(200).json({
    success: true,
    count: cases.length,
    data: cases
  });
});

// @desc    Update case
// @route   PUT /api/cases/:id
// @access  Private
exports.updateCase = async (req, res, next) => {
  try {
    let caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Check user authorization
    if (req.user.role === 'litigant') {
      // Litigants can only update their own cases in certain states
      if (caseItem.litigant.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this case'
        });
      }
      
      // Litigants can add notes to their cases in any state
      // For other updates, the case must be in pending-approval state
      const isOnlyAddingNotes = Object.keys(req.body).length === 1 && 
                              req.body.notes && 
                              (!req.body.title && !req.body.description && !req.body.caseType && !req.body.opposingParty);
      
      if (caseItem.status !== 'pending-approval' && !isOnlyAddingNotes) {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify case details after it has been approved. You can only add notes.'
        });
      }
      
      // Limit fields litigants can update
      const litigantUpdatableFields = ['title', 'description', 'caseType', 'opposingParty', 'notes'];
      Object.keys(req.body).forEach(key => {
        if (!litigantUpdatableFields.includes(key)) {
          delete req.body[key];
        }
      });
      
      // Handle notes addition
      if (req.body.notes) {
        let notesToAdd = [];
        
        // Convert to array if it's a single note
        const notesArray = Array.isArray(req.body.notes) ? req.body.notes : [req.body.notes];
        
        // Process each note
        notesArray.forEach(note => {
          // If note is an object, extract content, otherwise use as is
          const noteContent = typeof note === 'object' ? note.content || JSON.stringify(note) : String(note);
          
          notesToAdd.push({
            content: noteContent,
            addedBy: req.user.id,
            role: req.user.role,
            addedAt: new Date()
          });
        });
        
        // Initialize notes array if it doesn't exist
        if (!caseItem.notes) caseItem.notes = [];
        
        // Add new notes
        caseItem.notes.push(...notesToAdd);
        
        // Remove notes from req.body to prevent validation issues
        delete req.body.notes;
      }
    } else if (req.user.role === 'advocate') {
      // Advocates can only update cases they're assigned to
      if (!caseItem.advocates.some(adv => adv.toString() === req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this case'
        });
      }
      
      // Handle notes addition for advocates
      if (req.body.notes) {
        let notesToAdd = [];
        
        // Convert to array if it's a single note
        const notesArray = Array.isArray(req.body.notes) ? req.body.notes : [req.body.notes];
        
        // Process each note
        notesArray.forEach(note => {
          // If note is an object, extract content, otherwise use as is
          const noteContent = typeof note === 'object' ? note.content || JSON.stringify(note) : String(note);
          
          notesToAdd.push({
            content: noteContent,
            addedBy: req.user.id,
            role: req.user.role,
            addedAt: new Date()
          });
        });
        
        // Initialize notes array if it doesn't exist
        if (!caseItem.notes) caseItem.notes = [];
        
        // Add new notes
        caseItem.notes.push(...notesToAdd);
        
        // Remove notes from req.body to prevent validation issues
        delete req.body.notes;
      }
      
      // Limit fields advocates can update
      const advocateUpdatableFields = ['notes'];
      Object.keys(req.body).forEach(key => {
        if (!advocateUpdatableFields.includes(key)) {
          delete req.body[key];
        }
      });
    }
    // Court officers can update all fields
    
    // If we have notes, save them first
    if (caseItem.notes && caseItem.notes.length > 0) {
      await caseItem.save();
    }
    
    // Update other fields if any
    if (Object.keys(req.body).length > 0) {
      caseItem = await Case.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
    }
    
    // If case status is being updated, create notifications
    if (req.body.status && req.body.status !== caseItem.status) {
      // Create notification for litigant
      await Notification.create({
        title: 'Case Status Updated',
        message: `Your case "${caseItem.title}" status has been updated to ${req.body.status}`,
        recipient: caseItem.litigant,
        sender: req.user.id,
        type: 'case-update',
        relatedCase: caseItem._id
      });
    }
    
    res.status(200).json({
      success: true,
      data: caseItem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete case
// @route   DELETE /api/cases/:id
// @access  Private (Court officers and litigants for their own cases)
exports.deleteCase = asyncHandler(async (req, res, next) => {
  const caseItem = await Case.findById(req.params.id);

  if (!caseItem) {
    return next(new ErrorResponse('Case not found', 404));
  }

  // Court officers can delete any case
  if (req.user.role === 'court-officer') {
    await caseItem.deleteOne();
    return res.status(200).json({
      success: true,
      data: {}
    });
  }
  
  // Litigants can only delete their own cases in certain states
  if (req.user.role === 'litigant') {
    // Check if the user is the litigant for this case
    if (caseItem.litigant.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this case', 403));
    }
    
    // Litigants can only delete cases in pending-approval or rejected states, NOT approved
    const deletableStatuses = ['pending-approval', 'rejected', 'payment-requested'];
    if (!deletableStatuses.includes(caseItem.status)) {
      return next(new ErrorResponse('Cannot delete a case that has been approved, is in progress, or has hearings scheduled', 400));
    }
    
    // Check if the case has any hearings or documents
   
    
    // Delete the case
    await caseItem.deleteOne();
    
    return res.status(200).json({
      success: true,
      data: {}
    });
  }

  // If not court officer or litigant with proper permissions
  return next(new ErrorResponse('Not authorized to delete this case', 403));
});

// @desc    Assign advocate to case
// @route   PUT /api/cases/:id/advocates
// @access  Private (Court officers only)
exports.assignAdvocate = asyncHandler(async (req, res, next) => {
  const caseItem = await Case.findById(req.params.id);

  if (!caseItem) {
    return next(new ErrorResponse('Case not found', 404));
  }

  // Only court officers can assign advocates
  if (req.user.role !== 'court-officer') {
    return next(new ErrorResponse('Not authorized to assign advocates', 403));
  }

  // Check if advocate exists and is actually an advocate
  const advocate = await User.findOne({ 
    _id: req.body.advocateId,
    role: 'advocate'
  });

  if (!advocate) {
    return next(new ErrorResponse('Advocate not found', 404));
  }

  // Add advocate to case if not already assigned
  if (!caseItem.advocates.includes(req.body.advocateId)) {
    caseItem.advocates.push(req.body.advocateId);
    await caseItem.save();

    // Create notification for advocate
    await Notification.create({
      title: 'New Case Assignment',
      message: `You have been assigned to case "${caseItem.title}"`,
      recipient: req.body.advocateId,
      sender: req.user.id,
      type: 'case-assignment',
      relatedCase: caseItem._id
    });
  }

  res.status(200).json({
    success: true,
    data: caseItem
  });
});

// @desc    Remove advocate from case
// @route   DELETE /api/cases/:id/advocates/:advocateId
// @access  Private (Court officers only)
exports.removeAdvocate = asyncHandler(async (req, res, next) => {
  const caseItem = await Case.findById(req.params.id);

  if (!caseItem) {
    return next(new ErrorResponse('Case not found', 404));
  }

  // Only court officers can remove advocates
  if (req.user.role !== 'court-officer') {
    return next(new ErrorResponse('Not authorized to remove advocates', 403));
  }

  // Remove advocate from case
  caseItem.advocates = caseItem.advocates.filter(
    advocate => advocate.toString() !== req.params.advocateId
  );
  await caseItem.save();

  // Create notification for advocate
  await Notification.create({
    title: 'Case Assignment Removed',
    message: `You have been removed from case "${caseItem.title}"`,
    recipient: req.params.advocateId,
    sender: req.user.id,
    type: 'case-update',
    relatedCase: caseItem._id
  });

  res.status(200).json({
    success: true,
    data: caseItem
  });
});

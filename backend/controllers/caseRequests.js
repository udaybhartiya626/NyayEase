const CaseRequest = require('../models/CaseRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Case = require('../models/Case');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create a new case request
// @route   POST /api/case-requests
// @access  Private (Litigants only)
exports.createCaseRequest = asyncHandler(async (req, res, next) => {
  // Only litigants can create case requests
  if (req.user.role !== 'litigant') {
    return next(new ErrorResponse('Only litigants can create case requests', 403));
  }

  // Set litigant ID from authenticated user
  req.body.litigant = req.user._id;

  // Check if advocate exists and is actually an advocate
  const advocate = await User.findOne({
    _id: req.body.advocate,
    role: 'advocate'
  });

  if (!advocate) {
    return next(new ErrorResponse('Advocate not found', 404));
  }

  // If existingCaseId is provided, verify it exists and belongs to the litigant
  if (req.body.existingCaseId) {
    const existingCase = await Case.findOne({
      _id: req.body.existingCaseId,
      litigant: req.user._id
    });

    if (!existingCase) {
      return next(new ErrorResponse('Case not found or not authorized', 404));
    }

    // Use the existing case's title and details
    req.body.caseTitle = existingCase.title;
    req.body.caseDescription = existingCase.description;
    req.body.caseType = existingCase.caseType;
    req.body.court = existingCase.court;
    req.body.caseId = existingCase._id;
  } else {
    // Check if there's already an approved case with the same title
    const existingApprovedCase = await Case.findOne({
      title: req.body.caseTitle,
      litigant: req.user._id,
      status: 'approved'
    });

    if (existingApprovedCase) {
      return next(new ErrorResponse('You already have an approved case with this title', 400));
    }
  }

  // Check if litigant has already sent a request for the same case to this advocate
  const existingRequest = await CaseRequest.findOne({
    litigant: req.user._id,
    advocate: req.body.advocate,
    caseTitle: req.body.caseTitle,
  });

  if (existingRequest) {
    return next(new ErrorResponse('You have already sent a request for this case to this advocate', 400));
  }

  // Create the case request
  const caseRequest = await CaseRequest.create(req.body);

  // Create notification for advocate
  await Notification.create({
    title: 'New Case Request',
    message: `You have received a new case request: "${caseRequest.caseTitle}"`,
    recipient: advocate._id,
    sender: req.user._id,
    type: 'case-request',
    relatedCaseRequest: caseRequest._id,
    isActionRequired: true,
    actionUrl: `/dashboard/requests/${caseRequest._id}`
  });

  res.status(201).json({
    success: true,
    data: caseRequest
  });
});

// @desc    Get all case requests for the current user
// @route   GET /api/case-requests
// @access  Private
exports.getCaseRequests = asyncHandler(async (req, res, next) => {
  try {
    let query = {};
    // console.log("----------",req);
    // Filter based on user role
    if (req.user.role === 'litigant') {
      // Litigants see requests they've sent
      query.litigant = req.user._id;
    } else if (req.user.role === 'advocate') {
      // Advocates see requests sent to them
      query.advocate = req.user._id;
    } else {
      
      return next(new ErrorResponse('Unauthorized to view case requests', 403));
    }

    // Get all case requests
    const caseRequests = await CaseRequest.find(query)
      .populate('litigant', 'name email')
      .populate('advocate', 'name email specialization')
      .sort({ createdAt: -1 });

    // For each case request, find and attach the associated case
    const caseRequestsWithCases = await Promise.all(caseRequests.map(async (request) => {
      const requestObj = request.toObject();
      
      // Find the associated case by title and litigant
      const associatedCase = await Case.findOne({
        title: request.caseTitle,
        litigant: request.litigant._id
      });

      if (associatedCase) {
        requestObj.associatedCase = associatedCase;
      }

      return requestObj;
    }));

    // For litigants, filter out requests for cases that are already approved
    if (req.user.role === 'litigant') {
      const filteredRequests = caseRequestsWithCases.filter(request => {
        // If there's an associated case, check its status
        if (request.associatedCase) {
          return request.associatedCase.status !== 'approved';
        }
        return true;
      });

      return res.status(200).json({
        success: true,
        count: filteredRequests.length,
        data: filteredRequests
      });
    }

    // For advocates, return all requests with their associated cases
    res.status(200).json({
      success: true,
      count: caseRequestsWithCases.length,
      data: caseRequestsWithCases
    });
  } catch (error) {
    console.error('Error in getCaseRequests:', error);
    return next(new ErrorResponse('Error retrieving case requests', 500));
  }
});

// @desc    Get single case request
// @route   GET /api/case-requests/:id
// @access  Private
exports.getCaseRequest = asyncHandler(async (req, res, next) => {
  try {
    const caseRequest = await CaseRequest.findById(req.params.id)
      .populate('litigant', 'name email phone')
      .populate('advocate', 'name email specialization barCouncilNumber');

    if (!caseRequest) {
      return next(new ErrorResponse('Case request not found', 404));
    }
    console.log(req.user)
    // Check if user is authorized to view this request
    if (
      caseRequest.litigant._id.toString() !== req.user.id &&
      caseRequest.advocate._id.toString() !== req.user.id
    ) {
      return next(new ErrorResponse('Not authorized to access this case request', 403));
    }

    // Find the associated case by title and litigant
    const associatedCase = await Case.findOne({
      title: caseRequest.caseTitle,
      litigant: caseRequest.litigant._id
    });

    if (associatedCase) {
      caseRequest.associatedCase = associatedCase;
    }

    res.status(200).json({
      success: true,
      data: caseRequest
    });
  } catch (error) {
    console.error('Error in getCaseRequest:', error);
    return next(new ErrorResponse('Error retrieving case request', 500));
  }
});

// @desc    Update case request status (accept/reject)
// @route   PUT /api/case-requests/:id/respond
// @access  Private (Advocates only)
exports.respondToCaseRequest = asyncHandler(async (req, res, next) => {
  const { status, responseMessage, paymentAmount } = req.body;

  if (!status || !['accepted', 'rejected', 'payment-requested'].includes(status)) {
    return next(new ErrorResponse('Please provide a valid status (accepted, rejected, or payment-requested)', 400));
  }

  let caseRequest = await CaseRequest.findById(req.params.id)
    .populate('advocate', '_id role')
    .populate('litigant', '_id name email');

  if (!caseRequest) {
    return next(new ErrorResponse('Case request not found', 404));
  }

  // Check if user is the advocate for this request
  if (!caseRequest.advocate || caseRequest.advocate._id.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized to respond to this case request', 403));
  }

  // Check if request is already processed
  if (caseRequest.status !== 'pending' && caseRequest.status !== 'payment-requested') {
    return next(new ErrorResponse(`Case request has already been ${caseRequest.status}`, 400));
  }

  // Handle payment request
  if (status === 'payment-requested') {
    if (!paymentAmount) {
      return next(new ErrorResponse('Payment amount is required', 400));
    }

    // Update case request status
    caseRequest.status = 'payment-requested';
    caseRequest.paymentAmount = req.body.paymentAmount;
    caseRequest.paymentStatus = 'pending';
    caseRequest.responseMessage = responseMessage || '';
    caseRequest.updatedAt = Date.now();
    await caseRequest.save();

    // Create notifications for payment request
    console.log(caseRequest)
    const notifications = await Promise.all([
      Notification.create({
        title: 'Payment Request',
        message: `Advocate has requested a payment of ₹${req.body.paymentAmount} for your case "${caseRequest.caseTitle}". Please review and approve the payment.`,
        recipient: caseRequest.litigant,
        sender: req.user._id,
        type: 'payment',
        relatedCase: caseRequest.caseId,
        relatedCaseRequest: caseRequest._id,
        isActionRequired: true,
        paymentDetails: {
          amount: req.body.paymentAmount,
          status: 'pending'
        }
      }),
      Notification.create({
        title: 'Payment Requested',
        message: `You have requested a payment of ₹${req.body.paymentAmount} for case "${caseRequest.caseTitle}". Waiting for litigant approval.`,
        recipient: req.user._id,
        sender: caseRequest.litigant,
        type: 'payment',
        relatedCase: caseRequest.caseId,
        relatedCaseRequest: caseRequest._id,
        isActionRequired: false,
        paymentDetails: {
          amount: req.body.paymentAmount,
          status: 'pending'
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        caseRequest,
        payment: {
          amount: req.body.paymentAmount,
          status: 'pending',
          date: null
        }
      }
    });
  }

  // Handle case acceptance
  if (status === 'accepted') {
    const existingCase = await Case.findOne({
      title: caseRequest.caseTitle,
      litigant: caseRequest.litigant
    });

    if (existingCase) {
      // Update case with payment request status
      existingCase.status = 'payment-requested';
      existingCase.paymentStatus = 'pending';
      existingCase.paymentAmount = req.body.paymentAmount;
      
      // Find or add advocate with accepted status
      const advocateIndex = existingCase.advocates.findIndex(
        advocate => advocate._id.toString() === caseRequest.advocate._id.toString()
      );
      
      if (advocateIndex === -1) {
        // Add new advocate with accepted status
        existingCase.advocates.push({
          _id: caseRequest.advocate._id,
          status: 'accepted'
        });
      } else {
        // Update existing advocate status to accepted
        existingCase.advocates[advocateIndex].status = 'accepted';
      }
      await existingCase.save();

      // Create payment notification for litigant
      await Notification.create({
        title: 'Payment Request',
        message: `Advocate has requested a payment of ₹${req.body.paymentAmount} for your case "${caseRequest.caseTitle}". Please review and approve the payment.`,
        recipient: caseRequest.litigant,
        sender: req.user._id,
        type: 'payment',
        relatedCase: existingCase._id,
        relatedCaseRequest: caseRequest._id,
        isActionRequired: true,
        paymentDetails: {
          amount: req.body.paymentAmount,
          status: 'pending'
        }
      });

      // Update case request status
      caseRequest.status = 'accepted';
      caseRequest.responseMessage = responseMessage || '';
      caseRequest.updatedAt = Date.now();
      await caseRequest.save();

      // Create notification for litigant about payment request
      

      // Create notification for advocate about payment request
      await Notification.create({
        title: 'Payment Requested',
        message: `You have requested a payment of ₹${req.body.paymentAmount} for case "${existingCase.title}". Waiting for litigant approval.`,
        recipient: req.user._id,
        sender: caseRequest.litigant,
        type: 'case-update',
        relatedCase: existingCase.caseId,
        relatedCaseRequest: caseRequest._id,
        isActionRequired: false,
        paymentDetails: {
          amount: req.body.paymentAmount,
          status: 'pending'
        }
      });

      // Create notification for advocate about payment
      

      return res.status(200).json({
        success: true,
        data: {
          caseRequest,
          case: existingCase,
          payment: {
            amount: caseRequest.paymentAmount,
            status: 'completed',
            date: existingCase.paymentDate
          }
        }
      });
    }
  }

  if (status === 'rejected') {
    // Find the existing case
    const existingCase = await Case.findOne({
      title: caseRequest.caseTitle,
      litigant: caseRequest.litigant
    });
    caseRequest.status = 'rejected';
    caseRequest.save();
    if (existingCase) {
      // Update the case status and add the advocate
      existingCase.status = 'rejected';
      if (!existingCase.advocates.includes(caseRequest.advocate._id)) {
        console.log("doing ");
        existingCase.advocates.push(caseRequest.advocate._id);
      }
      await existingCase.save();

      // Create notification for litigant about the case update
      await Notification.create({
        title: 'Case Status Updated',
        message: `Your case "${existingCase.title}" has been rejected by the advocate.`,
        recipient: caseRequest.litigant,
        sender: req.user._id,
        type: 'case-update',
        relatedCase: existingCase.caseId,
        relatedCaseRequest: existingCase._id,
        actionUrl: `/dashboard/cases/${existingCase._id}`
      });

      return res.status(200).json({
        success: true,
        data: {
          caseRequest,
          case: existingCase
        }
      });
    }
  }

  // If no existing case found, just return the updated request
  res.status(200).json({
    success: true,
    data: caseRequest
  });
});

// @desc    Delete case request
// @route   DELETE /api/case-requests/:id
// @access  Private (Litigants only, and only if pending or rejected)
exports.deleteCaseRequest = asyncHandler(async (req, res, next) => {
  const caseRequest = await CaseRequest.findById(req.params.id);

  if (!caseRequest) {
    return next(new ErrorResponse('Case request not found', 404));
  }

  // Check if user is the litigant who created this request
  if (caseRequest.litigant.toString() !== req.user._id) {
    return next(new ErrorResponse('Not authorized to delete this case request', 403));
  }

  // Check if request is still pending or rejected
  if (caseRequest.status !== 'pending' && caseRequest.status !== 'rejected') {
    return next(new ErrorResponse(`Cannot delete a case request that has been ${caseRequest.status}`, 400));
  }

  await caseRequest.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Simulate payment for a case request
// @route   POST /api/case-requests/:id/simulate-payment
// @access  Private (Litigants only)
exports.simulatePayment = asyncHandler(async (req, res, next) => {
  const caseRequest = await CaseRequest.findById(req.params.id)
    .populate('advocate', '_id role')
    .populate('litigant', '_id name email');

  if (!caseRequest) {
    return next(new ErrorResponse('Case request not found', 404));
  }

  // Check if user is the litigant
  if (caseRequest.litigant._id.toString() !== req.user._id.toString()) {
    return next(new ErrorResponse('Not authorized to make payment for this request', 403));
  }

  // Check if payment is requested
  if (caseRequest.status !== 'payment-requested') {
    return next(new ErrorResponse('No payment request pending for this case', 400));
  }

  // Simulate payment processing
  const paymentStatus = 'completed';
  const paymentDate = new Date();

  // Update case request with payment info
  caseRequest.paymentStatus = paymentStatus;
  caseRequest.paymentDate = paymentDate;
  await caseRequest.save();

  // Find the existing case
  const existingCase = await Case.findOne({
    title: caseRequest.caseTitle,
    litigant: caseRequest.litigant
  });

  if (existingCase) {
    // Update case with payment information
    existingCase.status = 'approved';
    existingCase.paymentStatus = paymentStatus;
    existingCase.paymentAmount = caseRequest.paymentAmount;
    existingCase.paymentDate = paymentDate;
    
    if (!existingCase.advocates.includes(caseRequest.advocate._id)) {
      existingCase.advocates.push(caseRequest.advocate._id);
    }
    await existingCase.save();

    // Create notification for litigant about payment
    await Notification.create({
      title: 'Payment Processed',
      message: `Payment of ₹${caseRequest.paymentAmount} has been processed for your case "${existingCase.title}".`,
      recipient: caseRequest.litigant,
      sender: req.user._id,
      type: 'case-update',
      relatedCase: existingCase._id
    });

    // Create notification for advocate about payment
    await Notification.create({
      title: 'Payment Received',
      message: `Payment of ₹${caseRequest.paymentAmount} has been received for case "${existingCase.title}".`,
      recipient: caseRequest.advocate._id,
      sender: caseRequest.litigant._id,
      type: 'case-update',
      relatedCase: existingCase._id
    });

    return res.status(200).json({
      success: true,
      data: {
        caseRequest,
        case: existingCase,
        payment: {
          amount: caseRequest.paymentAmount,
          status: paymentStatus,
          date: paymentDate
        }
      }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      caseRequest,
      payment: {
        amount: caseRequest.paymentAmount,
        status: paymentStatus,
        date: paymentDate
      }
    }
  });
}); 
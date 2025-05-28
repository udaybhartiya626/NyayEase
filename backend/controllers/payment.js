const Payment = require('../models/Payment');
const Case = require('../models/Case');
const CaseRequest = require('../models/CaseRequest');
const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.makePayment = asyncHandler(async (req, res, next) => {
  const { notificationId } = req.body;
  const user = req.user;
  // console.log("the user is ", req.body);
  try {
    // Find the notification
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      console.error(`Notification with ID ${notificationId} not found`);
      return next(new ErrorResponse('Notification not found', 404));
    }
    console.log("-payment-------------------")
    // Verify that this is a payment notification and belongs to the user
    if (notification.type !== 'payment' || notification.recipient.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to make this payment'
      });
    }

    // Verify user role
    if (user.role !== 'litigant') {
      return res.status(403).json({
        success: false,
        message: 'Only litigants can make payments'
      });
    }
    console.log("----payment process----------------")

    // Simulate payment process
    const caseRequest = await CaseRequest.findById(notification.relatedCaseRequest._id);
    const payment = await Payment.create({
      userId: user._id,
      caseId: caseRequest.caseId,
      amount: notification.paymentDetails.amount,
      method: 'simulated',
      reference: `SIM-${Date.now()}`,
      status: 'completed'
    });
    console.log("------- case req-------------")

    // Find and update the case request
    
    console.log("--------------------", caseRequest)

    if (caseRequest) {
      // Update case request status to accepted
      caseRequest.status = 'accepted';
      caseRequest.paymentStatus = 'completed';
      // caseRequest.paymentAmount = notification.paymentDetails.amount;
      caseRequest.paymentMethod = 'simulated';
      caseRequest.paymentReference = payment.reference;
      await caseRequest.save();

      // Update the case status to active
      const caseItem = await Case.findById(caseRequest.caseId);
      console.log("the case item is ", caseItem)
      if (caseItem) {
        caseItem.status = 'approved';
        caseItem.paymentStatus = 'completed';
        caseItem.paymentAmount = notification.paymentDetails.amount;
        caseItem.paymentMethod = 'simulated';
        caseItem.paymentReference = payment.reference;
        
        await caseItem.save();

        // Create notification for advocate
        await Notification.create({
          recipient: caseRequest.advocate,
          type: 'payment-completed',
          title: 'Payment Received',
          message: `Payment of ₹${notification.paymentDetails.amount} has been received for case ${caseItem.title}. Case is now active.`,
          relatedCase: caseItem._id,
          paymentDetails: {
            amount: notification.paymentDetails.amount,
            method: 'simulated',
            status: 'completed',
            
          }
        });
        

        // Create notification for litigant
        await Notification.create({
          recipient: caseRequest.litigant,
          type: 'payment-completed',
          title: 'Payment Received',
          message: `Your payment of ₹${notification.paymentDetails.amount} has been proceed for case ${caseItem.title}.`,
          relatedCase: caseItem._id,
          paymentDetails: {
            amount: notification.paymentDetails.amount,
            method: 'simulated',
            status: 'completed',
            
          }
        })
      }
    }
    // Mark original notification as read and update its type if it exists
    if (notification) {
      // Instead of deleting, we'll update the notification to mark it as processed
      notification.isRead = true;
      notification.type = 'payment-completed';
      notification.isActionRequired = false;
      notification.title = 'Payment Processed';
      notification.message = `Your payment of ₹${notification.paymentDetails.amount} has been processed successfully.`;
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment initiated successfully',
      payment
    });
  } catch (error) {
    return next(error);
  }
});

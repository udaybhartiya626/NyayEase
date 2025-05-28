const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add notification title'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Please add notification message']
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['case-update', 'payment', 'hearing', 'document', 'system', 'other', 'case-request', 'case-request-response', 'payment-completed', 'hearing-scheduled', 'hearing-reminder', 'hearing-update'],
    required: true
  },
  relatedCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  },
  relatedHearing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hearing'
  },
  relatedDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  relatedCaseRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CaseRequest'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isActionRequired: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String,
    default: ''
  },
  paymentDetails: {
    type: {
      amount: {
        type: Number,
        required: false
      },
      method: {
        type: String,
        enum: ['bank-transfer', 'upi', 'other', 'simulated'],
        required: false
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        required: false
      },
      reference: {
        type: String,
        required: false
      }
    },
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', NotificationSchema); 
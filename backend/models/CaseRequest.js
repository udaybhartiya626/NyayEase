const mongoose = require('mongoose');

const CaseRequestSchema = new mongoose.Schema({
  litigant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  advocate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  caseTitle: {
    type: String,
    required: [true, 'Please provide a case title'],
    trim: true,
    maxlength: [100, 'Case title cannot be more than 100 characters']
  },
  caseDescription: {
    type: String,
    required: [true, 'Please provide a case description'],
    maxlength: [5000, 'Case description cannot be more than 5000 characters']
  },
  caseType: {
    type: String,
    required: [true, 'Please specify the case type'],
    enum: [
      'civil',
      'criminal',
      'family',
      'property',
      'corporate',
      'taxation',
      'labor',
      'consumer',
      'other'
    ]
  },
  court: {
    type: String,
    required: [true, 'Please specify the court'],
    enum: [
      'district',
      'high',
      'supreme',
      'consumer',
      'family',
      'other'
    ]
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'payment-requested'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  responseMessage: {
    type: String,
    maxlength: [1000, 'Response message cannot be more than 1000 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CaseRequest', CaseRequestSchema); 
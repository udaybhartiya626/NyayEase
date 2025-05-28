const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a case title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  caseNumber: {
    type: String,
    unique: true,
    // Will be generated on case creation
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    minlength: [50, 'Description should be at least 50 characters']
  },
  caseType: {
    type: String,
    required: [true, 'Please specify case type'],
    enum: ['civil', 'criminal', 'family', 'property', 'corporate', 'tax', 'other']
  },
  court: {
    type: String,
    required: [true, 'Please specify the court'],
    enum: ['district', 'high', 'supreme']
  },
  status: {
    type: String,
    enum: [
      'pending-approval', 
      'payment-requested',
      'approved', 
      'rejected', 
      'in-progress', 
      'scheduled-hearing', 
      'adjourned', 
      'resolved', 
      'closed',
    ],
    default: 'pending-approval'
  },
  litigant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  advocates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignedJudge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  opposingParty: {
    name: String,
    advocateName: String,
    contactInfo: String
  },
  hearings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hearing'
  }],
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  filingDate: {
    type: Date,
    default: Date.now
  },
  nextHearingDate: Date,
  updatedAt: {
    type: Date,
    default: Date.now
  },
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Resolution and closure tracking
  closeReason: {
    type: String,
    default: ''
  },
  closedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  resolution: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for case status history
CaseSchema.virtual('statusHistory', {
  ref: 'CaseStatusHistory',
  localField: '_id',
  foreignField: 'case',
  justOne: false
});

// Generate case number before saving
CaseSchema.pre('save', async function(next) {
  if (!this.caseNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.caseNumber = `NE${year}${(count + 1).toString().padStart(6, '0')}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Middleware to validate case status transitions
CaseSchema.pre('save', function(next) {
  const caseDoc = this;
  
  // If status is changing to active, scheduled-hearing, or in-progress
  if (['approved', 'scheduled-hearing', 'in-progress'].includes(caseDoc.status)) {
    // Check if there's at least one advocate assigned
    if (caseDoc.advocates.length === 0) {
      // If no advocate assigned, revert status to pending
      caseDoc.status = 'pending';
      throw new Error('Case cannot proceed without an advocate assigned');
    }
  }
  
  next();
});

module.exports = mongoose.model('Case', CaseSchema); 
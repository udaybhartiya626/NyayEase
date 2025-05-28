const mongoose = require('mongoose');

const HearingSchema = new mongoose.Schema({
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please add hearing date and time']
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,  // in minutes
    default: 60,
    min: [1, 'Duration must be at least 1 minute']
  },
  type: {
    type: String,
    enum: ['physical', 'virtual'],
    required: [true, 'Please specify hearing type']
  },
  location: {
    courtRoom: String,
    address: String,
    virtualLink: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'waiting-decision', 'completed', 'adjourned', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['judge', 'litigant', 'advocate', 'witness', 'other']
    },
    status: {
      type: String,
      enum: ['invited', 'confirmed', 'attended', 'absent'],
      default: 'invited'
    }
  }],
  notes: {
    type: String,
    default: ''
  },
  outcome: {
    type: String,
    default: ''
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  nextSteps: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate endTime before saving if date or duration changes
HearingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (this.isModified('date') || this.isModified('duration')) {
    const endTime = new Date(this.date);
    endTime.setMinutes(endTime.getMinutes() + (this.duration || 60));
    this.endTime = endTime;
  }
  
  next();
});

// Indexes for better query performance
HearingSchema.index({ case: 1 });
HearingSchema.index({ date: 1 });
HearingSchema.index({ endTime: 1 });
HearingSchema.index({ status: 1, date: 1 });

module.exports = mongoose.model('Hearing', HearingSchema);
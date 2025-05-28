const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  advocate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  litigant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Prevent duplicate ratings
RatingSchema.index({ case: 1, litigant: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);

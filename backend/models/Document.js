const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add document name'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    required: true
  },
  filePath: {
    type: String,
    required: [true, 'Please provide document file path']
  },
  fileSize: {
    type: Number,
    required: [true, 'Please provide document file size']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', DocumentSchema); 
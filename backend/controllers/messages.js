const Message = require('../models/Message');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { recipientId, subject, content } = req.body;

  const message = await Message.create({
    sender: req.user.id,
    recipient: recipientId,
    subject,
    content
  });

  res.status(201).json({
    success: true,
    data: message
  });
});

// @desc    Get user's messages
// @route   GET /api/messages
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
  const messages = await Message.find({
    $or: [
      { sender: req.user.id },
      { recipient: req.user.id }
    ]
  })
  .populate('sender', 'name')
  .populate('recipient', 'name')
  .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return next(new ErrorResponse('Message not found', 404));
  }

  // Check if user is the recipient
  if (message.recipient.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to mark this message as read', 403));
  }

  message.read = true;
  await message.save();

  res.status(200).json({
    success: true,
    data: message
  });
}); 
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendMessage,
  getMessages,
  markAsRead
} = require('../controllers/messages');

router.use(protect);

router.route('/')
  .get(getMessages)
  .post(sendMessage);

router.put('/:id/read', markAsRead);

module.exports = router; 
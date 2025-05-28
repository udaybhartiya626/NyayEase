const express = require('express');
const router = express.Router();
const { makePayment } = require('../controllers/payment');
const { protect } = require('../middleware/auth');

// @route   POST /api/payment
// @desc    Make payment
// @access  Private
router.post('/', protect, makePayment);

module.exports = router;

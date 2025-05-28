const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { addRating, getAdvocateRatings, getUserCaseRating } = require('../controllers/ratings');

// Add rating (Litigant only)
router.post('/', protect, addRating);

// Get ratings for an advocate (Public)
router.get('/advocate/:id', getAdvocateRatings);

// Get user's rating for a case (Litigant only)
router.get('/case/:caseId', protect, getUserCaseRating);

module.exports = router;

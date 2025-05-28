const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { 
  createHearing, 
  allocateJudge, 
  getHearing, 
  getUpcomingHearings, 
  updateHearing, 
  deleteHearing,
  updateHearingStatus 
} = require('../controllers/hearings');

const router = express.Router();

// Schedule a hearing
router.post('/', protect, authorize('court-officer'), createHearing);

// Allocate judge to hearing
router.put('/:id/allocate-judge', protect, authorize('judge'), allocateJudge);

// Get user's upcoming hearings
router.get('/upcoming', protect, getUpcomingHearings);

// Get hearing details
router.get('/:id', protect, getHearing);

// Update hearing (court officer only)
router.put('/:id', protect, authorize('court-officer'), updateHearing);

// Delete hearing (court officer only)
router.delete('/:id', protect, authorize('court-officer'), deleteHearing);

// Update hearing status (court officer only)
router.put('/:id/status', protect, authorize('court-officer'), updateHearingStatus);

module.exports = router;
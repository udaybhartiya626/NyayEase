const express = require('express');
const {
  createCaseRequest,
  getCaseRequests,
  getCaseRequest,
  respondToCaseRequest,
  deleteCaseRequest,
  simulatePayment
} = require('../controllers/caseRequests');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes for litigants
router.post('/', authorize('litigant'), createCaseRequest);
router.get('/', getCaseRequests);
router.get('/:id', getCaseRequest);
router.delete('/:id', authorize('litigant'), deleteCaseRequest);
router.post('/:id/simulate-payment', authorize('litigant'), simulatePayment);

// Routes for advocates
router.put('/:id/respond', authorize('advocate'), respondToCaseRequest);

module.exports = router; 
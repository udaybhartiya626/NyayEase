const express = require('express');
const {
  getCases,
  getCase,
  createCase,
  updateCase,
  deleteCase,
  assignAdvocate,
  removeAdvocate,
  getPendingCases,
  updateAdvocateStatus,
  scheduleHearing
} = require('../controllers/cases');
const { protect, authorize } = require('../middleware/auth');

// Include document routes
const documentRouter = require('./documents');

const router = express.Router();

// Re-route into document router
router.use('/:caseId/documents', documentRouter);

router.route('/')
  .get(protect, getCases)
  .post(protect, authorize('litigant'), createCase);

router.route('/court/:id')
  .get(protect, authorize('court-officer'), getCase)
  .put(protect, authorize('court-officer'), updateCase);

router.get('/pending', protect, getPendingCases);

router.route('/:id')
  .get(protect, getCase)
  .put(protect, updateCase)
  .delete(protect, deleteCase);

router.route('/:id/advocates')
  .put(protect, assignAdvocate);

router.route('/:id/advocates/:advocateId')
  .delete(protect, removeAdvocate);

// Hearing routes
router.route('/:id/hearings')
  .post(protect, authorize('court-officer'), scheduleHearing);

module.exports = router; 
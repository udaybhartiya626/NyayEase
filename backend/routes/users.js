const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  deleteUser,
  searchAdvocates
} = require('../controllers/users');

// Public routes
router.get('/advocates', (req, res, next) => searchAdvocates(req, res, next));

// Protected routes
router.get('/profile', protect, (req, res, next) => getUserProfile(req, res, next));
router.put('/profile', protect, (req, res, next) => updateUserProfile(req, res, next));

// Admin only routes
router.get('/', protect, authorize('admin'), (req, res, next) => getAllUsers(req, res, next));
router.get('/:id', protect, authorize('admin'), (req, res, next) => getUserById(req, res, next));
router.delete('/:id', protect, authorize('admin'), (req, res, next) => deleteUser(req, res, next));

module.exports = router; 
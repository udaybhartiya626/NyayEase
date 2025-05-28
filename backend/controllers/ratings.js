const Rating = require('../models/Rating');
const Case = require('../models/Case');
const User = require('../models/User');

// @desc    Add rating for an advocate (Litigant only)
// @route   POST /api/ratings
// @access  Private (Litigant only)
const addRating = async (req, res, next) => {
  try {
    console.log('Received rating request:', req.body);
    const { caseId, advocate, rating, review } = req.body;
    const userId = req.user.id;
    console.log('User ID:', userId, 'Advocate ID:', advocate, 'Case ID:', caseId);

    // Check if case exists and is completed
    const caseItem = await Case.findById(caseId);
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        error: 'Case not found'
      });
    }

    // Check if case is completed
    if (caseItem.status !== 'resolved' && caseItem.status !== 'closed') {
      return res.status(400).json({
        success: false,
        error: 'Rating is only allowed for completed cases'
      });
    }

    // Check if user is the litigant of the case
    if (caseItem.litigant.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the litigant of this case can rate the advocate'
      });
    }

    // Check if rating already exists for this case
    const existingRating = await Rating.findOne({
      case: caseId,
      litigant: userId
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        error: 'You have already rated this advocate for this case'
      });
    }

    // Verify the advocate is assigned to the case
    if (!caseItem.advocates || !caseItem.advocates.some(a => a._id.toString() === advocate)) {
      return res.status(400).json({
        success: false,
        error: 'The specified advocate is not assigned to this case'
      });
    }

    // Create new rating
    const newRating = await Rating.create({
      case: caseId,
      advocate: advocate,
      litigant: userId,
      rating,
      review
    });
    console.log('Created new rating:', newRating);

    // Update advocate's average rating
    console.log('Updating average rating for advocate:', advocate);
    const updateResult = await updateAdvocateRating(advocate);
    console.log('Update result:', updateResult);

    // Refresh the case to get updated data
    await Case.findById(caseId).populate('advocates');

    res.status(201).json({
      success: true,
      data: newRating
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get ratings for an advocate
// @route   GET /api/ratings/advocate/:id
// @access  Public
const getAdvocateRatings = async (req, res, next) => {
  try {
    const ratings = await Rating.find({ advocate: req.params.id })
      .populate('litigant', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: ratings.length,
      data: ratings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's rating for a case (Litigant only)
// @route   GET /api/ratings/case/:caseId
// @access  Private (Litigant only)
const getUserCaseRating = async (req, res, next) => {
  try {
    const rating = await Rating.findOne({
      case: req.params.caseId,
      litigant: req.user.id
    });

    res.status(200).json({
      success: true,
      data: rating || null
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to update advocate's average rating
const updateAdvocateRating = async (advocateId) => {
  try {
    const mongoose = require('mongoose');
    console.log('Updating rating for advocate ID:', advocateId);
    
    // Check if advocateId is valid
    if (!mongoose.Types.ObjectId.isValid(advocateId)) {
      console.error('Invalid advocate ID:', advocateId);
      return { success: false, error: 'Invalid advocate ID' };
    }
    
    const advocateObjectId = new mongoose.Types.ObjectId(advocateId);
    
    console.log('Running aggregation for advocate:', advocateObjectId);
    const result = await Rating.aggregate([
      {
        $match: { advocate: advocateObjectId }
      },
      {
        $group: {
          _id: '$advocate',
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('Aggregation result:', JSON.stringify(result, null, 2));

    if (result.length > 0) {
      console.log('Updating advocate with new rating:', {
        averageRating: result[0].averageRating,
        ratingCount: result[0].count
      });
      
      const updateResult = await User.findByIdAndUpdate(
        advocateId,
        {
          averageRating: parseFloat(result[0].averageRating.toFixed(1)),
          ratingCount: result[0].count
        },
        { new: true }
      );
      
      console.log('Update result from DB:', updateResult);
      return { success: true, data: updateResult };
    } else {
      console.log('No ratings found for advocate:', advocateId);
      return { success: false, message: 'No ratings found' };
    }
  } catch (error) {
    console.error('Error in updateAdvocateRating:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  addRating,
  getAdvocateRatings,
  getUserCaseRating
};

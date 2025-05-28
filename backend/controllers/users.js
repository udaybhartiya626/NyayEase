const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin (Court Officers)
exports.getUsers = async (req, res, next) => {
  try {
    // Allow filtering by role
    let query = {};
    
    if (req.query.role) {
      query.role = req.query.role;
    }
    
    const users = await User.find(query).select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res, next) => {
  try {
    // Fields to update
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: {
        street: req.body.address?.street,
        city: req.body.address?.city,
        state: req.body.address?.state,
        postalCode: req.body.address?.postalCode,
        country: req.body.address?.country || 'India'
      },
      bio: req.body.bio || ''
    };
    
    // Add role-specific fields
    if (req.user.role === 'advocate') {
      fieldsToUpdate.specialization = req.body.specialization;
      fieldsToUpdate.experience = req.body.experience;
      fieldsToUpdate.barCouncilId = req.body.barCouncilNumber;
    } else if (req.user.role === 'court-officer') {
      fieldsToUpdate.designation = req.body.designation;
      fieldsToUpdate.courtAssigned = req.body.courtAssigned;
    }
    
    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => {
      if (key === 'address') {
        Object.keys(fieldsToUpdate.address).forEach(addrKey => {
          if (fieldsToUpdate.address[addrKey] === undefined) {
            delete fieldsToUpdate.address[addrKey];
          }
        });
        if (Object.keys(fieldsToUpdate.address).length === 0) {
          delete fieldsToUpdate.address;
        }
      } else if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });
    
    // Log the fields being updated for debugging
    console.log('Updating user profile with fields:', fieldsToUpdate);
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user is requesting their own profile or is a court officer
    if (req.user.id !== req.params.id && req.user.role !== 'court-officer') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user profile'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
  try {
    // Check if user is updating their own profile
    if (req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user profile'
      });
    }
    
    // Fields to update
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address
    };
    
    // Add role-specific fields
    if (req.user.role === 'advocate') {
      fieldsToUpdate.specialization = req.body.specialization;
      fieldsToUpdate.experience = req.body.experience;
    }
    
    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private
exports.deleteUser = async (req, res, next) => {
  try {
    // Check if user is deleting their own account
    if (req.user.id !== req.params.id && req.user.role !== 'court-officer') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this user'
      });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get advocates by specialization
// @route   GET /api/users/advocates
// @access  Private
exports.getAdvocates = async (req, res, next) => {
  try {
    let query = { role: 'advocate' };
    
    // Filter by specialization if provided
    if (req.query.specialization) {
      query.specialization = { $in: [req.query.specialization] };
    }
    
    // Filter by experience if provided
    if (req.query.experience) {
      query.experience = { $gte: Number(req.query.experience) };
    }
    
    const advocates = await User.find(query).select('-password');
    
    res.status(200).json({
      success: true,
      count: advocates.length,
      data: advocates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search advocates
// @route   GET /api/users/advocates
// @access  Public
exports.searchAdvocates = async (req, res, next) => {
  try {
    const { searchQuery, specialization, experience } = req.query;
    
    // Build query
    const query = { role: 'advocate' };
    
    // Add search by name if provided
    if (searchQuery) {
      query.name = { $regex: searchQuery, $options: 'i' };
    }
    
    // Add specialization filter if provided
    if (specialization) {
      query.specialization = { $in: [specialization] };
    }
    
    // Add experience filter if provided
    if (experience) {
      query.experience = { $gte: parseInt(experience) };
    }
    
    // Execute query
    const advocates = await User.find(query)
      .select('name email specialization experience bio barCouncilId averageRating ratingCount')
      .sort({ averageRating: -1, experience: -1 });
    
    res.status(200).json({
      success: true,
      count: advocates.length,
      data: advocates
    });
  } catch (error) {
    next(error);
  }
}; 
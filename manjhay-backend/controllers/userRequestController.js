const UserRequest = require('../models/UserRequest');
const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinary');

// @desc    Create new user request
// @route   POST /api/user-requests
// @access  Private
exports.createUserRequest = async (req, res) => {
  try {
    console.log('=== USER REQUEST CREATION STARTED ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');

    const { description, contact, userId } = req.body;

    // Validate required fields
    if (!description || !contact || !userId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: description, contact, userId'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Product image is required'
      });
    }

    // Get user details
    const user = await User.findById(userId).select('name email phone');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Upload image to Cloudinary
    let imageUrl;
    try {
      console.log('Starting Cloudinary upload for user request...');
      
      if (req.file.buffer) {
        imageUrl = await uploadToCloudinary(req.file.buffer, 'manjhay/user-requests');
      } else if (req.file.path) {
        imageUrl = await uploadToCloudinary(req.file.path, 'manjhay/user-requests');
      } else {
        throw new Error('No file buffer or path available');
      }
      
      console.log('Cloudinary upload successful:', imageUrl);
    } catch (uploadError) {
      console.error('Cloudinary upload failed:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload product image'
      });
    }

    // Create user request
    const userRequest = await UserRequest.create({
      userId,
      imageUrl: imageUrl.secure_url || imageUrl,
      description,
      contact,
      status: 'pending'
    });

    console.log('User request created successfully:', userRequest._id);

    res.status(201).json({
      success: true,
      message: 'Product request submitted successfully! We will contact you soon.',
      data: userRequest
    });

  } catch (error) {
    console.error('User request creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit product request'
    });
  }
};

// @desc    Get all user requests (admin)
// @route   GET /api/user-requests
// @access  Private/Admin
exports.getUserRequests = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Build query
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const userRequests = await UserRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone');

    res.json({
      success: true,
      count: userRequests.length,
      data: userRequests
    });
  } catch (error) {
    console.error('Get user requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user requests'
    });
  }
};

// @desc    Get single user request
// @route   GET /api/user-requests/:id
// @access  Private/Admin
exports.getUserRequest = async (req, res) => {
  try {
    const userRequest = await UserRequest.findById(req.params.id)
      .populate('userId', 'name email phone');

    if (!userRequest) {
      return res.status(404).json({
        success: false,
        message: 'User request not found'
      });
    }

    res.json({
      success: true,
      data: userRequest
    });
  } catch (error) {
    console.error('Get user request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user request'
    });
  }
};

// @desc    Update user request status
// @route   PATCH /api/user-requests/:id
// @access  Private/Admin
exports.updateUserRequest = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'contacted', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, contacted, or completed'
      });
    }

    const userRequest = await UserRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone');

    if (!userRequest) {
      return res.status(404).json({
        success: false,
        message: 'User request not found'
      });
    }

    res.json({
      success: true,
      message: `User request status updated to ${status}`,
      data: userRequest
    });
  } catch (error) {
    console.error('Update user request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user request'
    });
  }
};

// @desc    Get user request stats
// @route   GET /api/user-requests/stats
// @access  Private/Admin
exports.getUserRequestStats = async (req, res) => {
  try {
    const totalRequests = await UserRequest.countDocuments();
    const pendingRequests = await UserRequest.countDocuments({ status: 'pending' });
    const contactedRequests = await UserRequest.countDocuments({ status: 'contacted' });
    const completedRequests = await UserRequest.countDocuments({ status: 'completed' });

    // Get recent requests (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRequests = await UserRequest.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      data: {
        totalRequests,
        pendingRequests,
        contactedRequests,
        completedRequests,
        recentRequests
      }
    });
  } catch (error) {
    console.error('Get user request stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user request stats'
    });
  }
};
const express = require('express');
const multer = require('multer');
const router = express.Router();
const UserRequest = require('../models/UserRequest');
const Notification = require('../models/Notification');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { protect, adminProtect } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/user-requests
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { description, contact, userId } = req.body;
    
    if (!description || !contact || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'Image is required' 
      });
    }
    
    // Upload image to cloud storage
    let imageUrl;
    try {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'manjhay/user-requests');
      imageUrl = uploadResult.secure_url;
    } catch (uploadError) {
      console.error('Image upload error:', uploadError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to upload image' 
      });
    }
    
    // Create user request
    const userRequest = new UserRequest({
      userId,
      imageUrl,
      description,
      contact,
      status: 'pending'
    });
    
    await userRequest.save();
    
    // Create notification for user
    const notification = new Notification({
      userId,
      title: 'Product Request Received',
      message: 'Your product request has been received. The admin will contact you soon.',
      isRead: false
    });
    
    await notification.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Request received successfully',
      requestId: userRequest._id 
    });
    
  } catch (error) {
    console.error('Error creating user request:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit request' 
    });
  }
});

// GET /api/user-requests (admin only)
router.get('/', adminProtect, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const requests = await UserRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone');

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch requests' 
    });
  }
});

// GET /api/user-requests/stats (admin only)
router.get('/stats', adminProtect, async (req, res) => {
  try {
    const totalRequests = await UserRequest.countDocuments();
    const pendingRequests = await UserRequest.countDocuments({ status: 'pending' });
    const contactedRequests = await UserRequest.countDocuments({ status: 'contacted' });
    const completedRequests = await UserRequest.countDocuments({ status: 'completed' });

    res.json({
      success: true,
      data: {
        totalRequests,
        pendingRequests,
        contactedRequests,
        completedRequests
      }
    });
  } catch (error) {
    console.error('Error fetching user request stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch request stats' 
    });
  }
});

// PATCH /api/user-requests/:id (admin only)
router.patch('/:id', adminProtect, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'contacted', 'completed'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status' 
      });
    }

    const request = await UserRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'name email phone');
    
    if (!request) {
      return res.status(404).json({ 
        success: false,
        error: 'Request not found' 
      });
    }
    
    res.json({
      success: true,
      data: request,
      message: `Request status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating user request:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update request' 
    });
  }
});

module.exports = router;
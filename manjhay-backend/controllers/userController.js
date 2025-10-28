const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get all users (admin only)
// @route   GET /api/users/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};
    
    // Filter by role if provided
    if (req.query.role) {
      query.role = req.query.role;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Search by name or email if search query provided
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      },
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user (admin only)
// @route   GET /api/users/admin/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user statistics
    const userStats = await getUserStatsData(req.params.id);

    res.json({
      success: true,
      data: {
        user,
        stats: userStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (admin only)
// @route   PATCH /api/users/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: active, suspended, or inactive'
      });
    }

    // Prevent admin from suspending themselves
    if (req.params.id === req.user.id && status === 'suspended') {
      return res.status(400).json({
        success: false,
        message: 'You cannot suspend your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (admin only)
// @route   PATCH /api/users/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be: user or admin'
      });
    }

    // Prevent admin from removing their own admin role
    if (req.params.id === req.user.id && role === 'user') {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove your own admin role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics (admin only)
// @route   GET /api/users/admin/users/stats
// @access  Private/Admin
exports.getUserStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    const inactiveUsers = await User.countDocuments({ status: 'inactive' });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });
    
    // Users registered in the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: weekAgo }
    });

    // Users registered in the last 30 days
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: monthAgo }
    });

    // User growth data for charts (last 6 months)
    const monthlyGrowth = await getMonthlyUserGrowth();

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        inactiveUsers,
        adminUsers,
        regularUsers,
        newUsersThisWeek,
        newUsersThisMonth,
        monthlyGrowth
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/users/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has orders
    const userOrders = await Order.countDocuments({ 'user.userId': req.params.id });
    
    if (userOrders > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with existing orders. Suspend the account instead.'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user orders (admin only)
// @route   GET /api/users/admin/users/:id/orders
// @access  Private/Admin
exports.getUserOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const orders = await Order.find({ 'user.userId': req.params.id })
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Order.countDocuments({ 'user.userId': req.params.id });

    // Calculate user order statistics
    const totalSpent = await Order.aggregate([
      { $match: { 'user.userId': req.params.id, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const orderStats = {
      totalOrders: total,
      completedOrders: await Order.countDocuments({ 
        'user.userId': req.params.id, 
        status: 'delivered' 
      }),
      pendingOrders: await Order.countDocuments({ 
        'user.userId': req.params.id, 
        status: { $in: ['pending', 'verified', 'contacted', 'shipped'] } 
      }),
      totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0
    };

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone
        },
        orders,
        stats: orderStats,
        pagination: {
          page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user activity (admin only)
// @route   GET /api/users/admin/users/:id/activity
// @access  Private/Admin
exports.getUserActivity = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get recent orders
    const recentOrders = await Order.find({ 'user.userId': req.params.id })
      .select('_id totalAmount status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get user registration date
    const registrationDate = user.createdAt;

    // Calculate days since registration
    const daysSinceRegistration = Math.floor(
      (new Date() - registrationDate) / (1000 * 60 * 60 * 24)
    );

    // Get favorite categories (based on orders)
    const favoriteCategories = await Order.aggregate([
      { $match: { 'user.userId': req.params.id } },
      { $unwind: '$items' },
      { $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      { $group: {
          _id: '$productDetails.category',
          count: { $sum: 1 },
          totalSpent: { $sum: { $multiply: ['$items.quantity', '$items.priceAtOrder'] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    const activityData = {
      registrationDate,
      daysSinceRegistration,
      lastLogin: user.lastLogin || registrationDate,
      recentOrders,
      favoriteCategories,
      totalLogins: user.loginCount || 0
    };

    res.json({
      success: true,
      data: activityData
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get monthly user growth
const getMonthlyUserGrowth = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const monthlyData = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  // Format the data for charts
  return monthlyData.map(item => ({
    month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
    users: item.count
  }));
};

// Helper function to get user statistics
const getUserStatsData = async (userId) => {
  const totalOrders = await Order.countDocuments({ 'user.userId': userId });
  const completedOrders = await Order.countDocuments({ 
    'user.userId': userId, 
    status: 'delivered' 
  });
  const pendingOrders = await Order.countDocuments({ 
    'user.userId': userId, 
    status: { $in: ['pending', 'verified', 'contacted', 'shipped'] } 
  });
  
  const totalSpentResult = await Order.aggregate([
    { $match: { 'user.userId': userId, status: 'delivered' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  const averageOrderValue = totalOrders > 0 ? 
    (totalSpentResult.length > 0 ? totalSpentResult[0].total : 0) / totalOrders : 0;

  return {
    totalOrders,
    completedOrders,
    pendingOrders,
    cancelledOrders: await Order.countDocuments({ 
      'user.userId': userId, 
      status: 'cancelled' 
    }),
    totalSpent: totalSpentResult.length > 0 ? totalSpentResult[0].total : 0,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    firstOrder: await Order.findOne({ 'user.userId': userId }).sort({ createdAt: 1 }).select('createdAt'),
    lastOrder: await Order.findOne({ 'user.userId': userId }).sort({ createdAt: -1 }).select('createdAt')
  };
};

// @desc    Bulk update user status (admin only)
// @route   PATCH /api/users/admin/users/bulk/status
// @access  Private/Admin
exports.bulkUpdateUserStatus = async (req, res, next) => {
  try {
    const { userIds, status } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: active, suspended, or inactive'
      });
    }

    // Remove current admin from the list to prevent self-suspension
    const filteredUserIds = userIds.filter(id => id !== req.user.id);

    const result = await User.updateMany(
      { _id: { $in: filteredUserIds } },
      { status }
    );

    res.json({
      success: true,
      message: `Updated status to ${status} for ${result.modifiedCount} users`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export users data (admin only)
// @route   GET /api/users/admin/users/export
// @access  Private/Admin
exports.exportUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    // Format data for CSV/Excel export
    const exportData = users.map(user => ({
      'User ID': user._id,
      'Name': user.name,
      'Email': user.email,
      'Phone': user.phone,
      'Role': user.role,
      'Status': user.status,
      'Registration Date': user.createdAt.toISOString().split('T')[0],
      'Last Login': user.lastLogin ? user.lastLogin.toISOString().split('T')[0] : 'Never',
      'Login Count': user.loginCount || 0
    }));

    res.json({
      success: true,
      data: exportData,
      message: `Exported ${exportData.length} users`
    });
  } catch (error) {
    next(error);
  }
};
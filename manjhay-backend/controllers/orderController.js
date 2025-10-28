const Order = require('../models/Order');
const Product = require('../models/Product');
const cloudinary = require('../utils/cloudinary');
const NotificationService = require('../services/notificationService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    console.log('=== ORDER CREATION STARTED ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? `Buffer length: ${req.file.buffer.length}` : 'No buffer'
    } : 'No file');

    const { deliveryAddress, region, landmark, totalAmount } = req.body;

    // Parse items from JSON string (frontend sends as JSON string)
    let items;
    try {
      items = JSON.parse(req.body.items);
      console.log('Parsed items:', items);
    } catch (parseError) {
      console.error('Failed to parse items:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Invalid items format. Please try again.'
      });
    }

    // Validate required fields
    if (!items || !deliveryAddress || !region || !landmark) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required: items, deliveryAddress, region, landmark'
      });
    }

    if (!req.file) {
      console.log('No payment proof file provided');
      return res.status(400).json({
        success: false,
        message: 'Payment proof screenshot is required'
      });
    }

    // Calculate total amount and verify products
    let calculatedTotalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      console.log('Processing item:', item);
      
      // Try different possible ID fields
      const productId = item.productId || item.product || item._id;
      console.log('Looking for product with ID:', productId);
      
      const product = await Product.findById(productId);
      
      if (!product) {
        console.log('Product not found with any ID:', { productId, item });
        return res.status(404).json({
          success: false,
          message: `Product not found: ${productId}`
        });
      }

      console.log('Found product:', product.name);

      // Check inventory
      if (product.inventory.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.inventory.quantity}`
        });
      }

      calculatedTotalAmount += product.price * item.quantity;
      
      // Create order item with ALL required fields including selectedSize
      const orderItem = {
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        priceAtOrder: product.price,
        selectedSize: item.selectedSize || 'One Size', // Ensure selectedSize is included
        image: product.image
      };
      
      console.log('Created order item:', orderItem);
      orderItems.push(orderItem);
    }

    // Use provided totalAmount or calculated amount
    const finalTotalAmount = totalAmount ? parseFloat(totalAmount) : calculatedTotalAmount;
    console.log('Final total amount:', finalTotalAmount);

    // Upload payment proof to Cloudinary using buffer
    let paymentProofImage;
    try {
      console.log('Starting Cloudinary upload from buffer...');
      
      if (req.file.buffer) {
        // Use buffer upload for memory storage
        paymentProofImage = await cloudinary.uploadImageFromBuffer(req.file.buffer, 'manjhay/payments');
      } else if (req.file.path) {
        // Use path upload for disk storage
        paymentProofImage = await cloudinary.uploadImage(req.file.path, 'manjhay/payments');
      } else {
        throw new Error('No file buffer or path available');
      }
      
      console.log('Cloudinary upload successful:', paymentProofImage.secure_url);
    } catch (uploadError) {
      console.error('Cloudinary upload failed:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload payment proof. Please try again with a different image.'
      });
    }

    // Create new order
    const orderData = {
      user: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        address: deliveryAddress,
        region,
        landmark
      },
      items: orderItems,
      totalAmount: finalTotalAmount,
      paymentProof: {
        public_id: paymentProofImage.public_id,
        url: paymentProofImage.secure_url
      },
      status: 'pending',
      paymentStatus: 'pending_verification'
    };

    console.log('Creating order with data:', orderData);
    const order = await Order.create(orderData);
    console.log('Order created successfully:', order._id);

    // Update product inventory
    for (const item of items) {
      const productId = item.productId || item.product || item._id;
      await Product.findByIdAndUpdate(
        productId,
        { $inc: { 'inventory.quantity': -item.quantity } }
      );
      console.log(`Updated inventory for product ${productId}, reduced by ${item.quantity}`);
    }

    // NOTIFICATION INTEGRATION
    try {
      console.log('🔔 [ORDER] Starting notification process...');
      
      // Create user notification
      const userNotification = await NotificationService.createUserNotification(
        req.user._id, 
        'order_received', 
        order._id
      );
      console.log('✅ [ORDER] User notification created:', userNotification ? userNotification._id : 'No notification');

      // Create admin notifications
      const adminNotifications = await NotificationService.createAdminNotification(
        'new_order', 
        order._id, 
        req.user.name
      );
      console.log('✅ [ORDER] Admin notifications created:', adminNotifications ? adminNotifications.length : 0);

      // WebSocket real-time notifications
      if (global.wsService) {
        console.log('📡 [ORDER] WebSocket service available, sending real-time notifications');
        
        // Send to user
        if (userNotification) {
          console.log(`📤 [ORDER] Sending user notification to: ${req.user._id}`);
          global.wsService.sendNotification(req.user._id.toString(), userNotification);
        }
        
        // Send to admins
        if (adminNotifications && adminNotifications.length > 0) {
          console.log(`📤 [ORDER] Sending ${adminNotifications.length} admin notifications`);
          adminNotifications.forEach(notification => {
            if (notification && notification.adminId) {
              global.wsService.sendNotification(notification.adminId.toString(), notification);
            }
          });
        }
        
        console.log('✅ [ORDER] All WebSocket notifications sent');
      } else {
        console.log('⚠️ [ORDER] WebSocket service not available, skipping real-time notifications');
      }
      
    } catch (notificationError) {
      console.error('❌ [ORDER] Notification error:', notificationError);
      // Don't fail the order if notifications fail
    }

    // SUCCESS RESPONSE
    res.status(201).json({
      success: true,
      message: 'Order created successfully! Our team will verify your payment and contact you soon.',
      data: {
        _id: order._id,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentProof: order.paymentProof,
        deliveryAddress: order.user.address,
        region: order.user.region,
        landmark: order.user.landmark,
        items: order.items,
        createdAt: order.createdAt,
        user: order.user
      }
    });

  } catch (error) {
    console.error('=== ORDER CREATION ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Send specific error messages based on error type
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      console.log('Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + validationErrors.join(', ')
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate order detected'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Filter by status
    let query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }

    const orders = await Order.find(query)
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      pagination: {
        page,
        pages: Math.ceil(total / limit)
      },
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private/Admin
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name image category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = order.status;
    order.status = status;
    
    if (adminNotes) order.adminNotes = adminNotes;

    await order.save();

    // NOTIFICATION INTEGRATION: Send status update notifications
    try {
      console.log(`🔔 [ORDER STATUS] Updating status to: ${status}`);
      
      let userNotificationType;
      let adminNotificationType;

      switch (status) {
        case 'verified':
          userNotificationType = 'order_verified';
          break;
        case 'contacted':
          userNotificationType = 'admin_contact';
          break;
        case 'shipped':
          userNotificationType = 'order_shipped';
          break;
        case 'delivered':
          userNotificationType = 'order_delivered';
          break;
        case 'cancelled':
          userNotificationType = 'order_cancelled';
          break;
      }

      if (userNotificationType) {
        const userNotification = await NotificationService.createUserNotification(
          order.user.userId, 
          userNotificationType, 
          order._id,
          adminNotes
        );

        // WebSocket notification to user
        if (global.wsService && userNotification) {
          console.log(`📤 [ORDER STATUS] Sending ${userNotificationType} to user: ${order.user.userId}`);
          global.wsService.sendNotification(order.user.userId.toString(), userNotification);
        }
      }

    } catch (notificationError) {
      console.error('❌ [ORDER STATUS] Notification error:', notificationError);
      // Don't fail the status update if notifications fail
    }

    res.json({
      success: true,
      data: order,
      message: `Order status updated from ${oldStatus} to ${status}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add contact history to order
// @route   POST /api/orders/:id/contact
// @access  Private/Admin
exports.addContactHistory = async (req, res, next) => {
  try {
    const { notes, type } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.contactHistory.push({
      admin: req.user.username,
      notes,
      type
    });

    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Contact customer about shipping cost
// @route   POST /api/orders/:id/contact-shipping
// @access  Private/Admin
exports.contactCustomerShipping = async (req, res, next) => {
  try {
    const { notes, contactMethod } = req.body;

    console.log('📞 Contact customer request:', {
      orderId: req.params.id,
      notes,
      contactMethod,
      adminUser: req.user
    });

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Order must be verified before contacting about shipping'
      });
    }

    // Get admin name from authenticated user
    const adminName = req.user.username || req.user.name || 'Admin';
    console.log(`👤 Using admin name: ${adminName}`);

    // Add contact history for shipping discussion
    order.contactHistory.push({
      admin: adminName,
      notes: `Contacted customer about shipping cost and delivery arrangement. ${notes || ''}`,
      type: contactMethod || 'call',
      purpose: 'shipping_cost'
    });

    // Update status to contacted
    order.status = 'contacted';

    await order.save();

    // NOTIFICATION INTEGRATION: Notify user about admin contact
    try {
      await NotificationService.createUserNotification(
        order.user.userId,
        'admin_contact',
        order._id
      );

      // WebSocket notification
      if (global.wsService) {
        const userNotification = await NotificationService.createUserNotification(
          order.user.userId,
          'admin_contact',
          order._id
        );
        global.wsService.sendNotification(order.user.userId.toString(), userNotification);
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    res.json({
      success: true,
      message: 'Customer contacted about shipping cost successfully',
      data: order
    });
  } catch (error) {
    console.error('❌ Error in contactCustomerShipping:', error);
    next(error);
  }
};

// @desc    Finalize shipping cost
// @route   PATCH /api/orders/:id/finalize-shipping
// @access  Private/Admin
exports.finalizeShippingCost = async (req, res, next) => {
  try {
    const { shippingCost, estimatedDelivery, deliveryNotes } = req.body;

    console.log('💰 Finalizing shipping cost:', {
      orderId: req.params.id,
      shippingCost,
      estimatedDelivery,
      deliveryNotes
    });

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Set shipping cost and arrangement details
    order.shippingCost = shippingCost;
    order.shippingArrangement = {
      costFinalized: true,
      costFinalizedAt: new Date(),
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      deliveryNotes: deliveryNotes || ''
    };

    // Add contact history
    order.contactHistory.push({
      admin: req.user.username || req.user.name || 'Admin',
      notes: `Shipping cost finalized: GH₵${shippingCost}. ${deliveryNotes || 'Delivery arrangement completed.'}`,
      type: 'call',
      purpose: 'delivery_arrangement'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Shipping cost finalized successfully',
      data: order
    });
  } catch (error) {
    console.error('❌ Error finalizing shipping cost:', error);
    next(error);
  }
};

// @desc    Verify payment and update order status
// @route   PATCH /api/orders/:id/verify-payment
// @access  Private/Admin
exports.verifyPayment = async (req, res, next) => {
  try {
    const { verified, rejectionReason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (verified) {
      order.status = 'verified';
      order.paymentStatus = 'verified';
      
      // NOTIFICATION INTEGRATION: Payment verified
      try {
        const userNotification = await NotificationService.createUserNotification(
          order.user.userId,
          'payment_verified',
          order._id
        );

        // WebSocket notification
        if (global.wsService && userNotification) {
          global.wsService.sendNotification(order.user.userId.toString(), userNotification);
        }
      } catch (notificationError) {
        console.error('Notification error:', notificationError);
      }

    } else {
      order.status = 'cancelled';
      order.paymentStatus = 'rejected';
      
      // NOTIFICATION INTEGRATION: Payment rejected
      try {
        const userNotification = await NotificationService.createUserNotification(
          order.user.userId,
          'payment_rejected',
          order._id,
          rejectionReason
        );

        // WebSocket notification
        if (global.wsService && userNotification) {
          global.wsService.sendNotification(order.user.userId.toString(), userNotification);
        }
      } catch (notificationError) {
        console.error('Notification error:', notificationError);
      }
    }

    await order.save();

    res.json({
      success: true,
      message: verified ? 'Payment verified successfully' : 'Payment rejected',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's orders
// @route   GET /api/orders/user/my-orders
// @access  Private
exports.getUserOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const orders = await Order.find({ 'user.userId': req.user._id })
      .populate('items.product', 'name image category')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Order.countDocuments({ 'user.userId': req.user._id });

    res.json({
      success: true,
      count: orders.length,
      pagination: {
        page,
        pages: Math.ceil(total / limit)
      },
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order for user
// @route   GET /api/orders/user/:id
// @access  Private
exports.getUserOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      'user.userId': req.user._id
    }).populate('items.product', 'name image category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PATCH /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      'user.userId': req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow cancellation for pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order can only be cancelled while pending verification'
      });
    }

    // Restore product inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { 'inventory.quantity': item.quantity } }
      );
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/admin/stats
// @access  Private/Admin
exports.getOrderStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const verifiedOrders = await Order.countDocuments({ status: 'verified' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        verifiedOrders,
        shippedOrders,
        deliveredOrders,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
      }
    });
  } catch (error) {
    next(error);
  }
};
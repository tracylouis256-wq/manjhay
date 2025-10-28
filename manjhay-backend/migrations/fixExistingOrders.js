const mongoose = require('mongoose');
const Order = require('../models/Order');
require('dotenv').config();

const fixExistingOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all orders that need payment status fixes
    const orders = await Order.find({});

    let fixedCount = 0;

    for (const order of orders) {
      let needsFix = false;
      const update = {};

      // Fix logic based on order status
      if (order.status === 'cancelled' && order.paymentStatus !== 'rejected') {
        update.paymentStatus = 'rejected';
        needsFix = true;
      } else if (order.status !== 'pending' && order.status !== 'cancelled' && order.paymentStatus === 'pending_verification') {
        update.paymentStatus = 'verified';
        needsFix = true;
      } else if (order.status === 'verified' && order.paymentStatus !== 'verified') {
        update.paymentStatus = 'verified';
        needsFix = true;
      }

      if (needsFix) {
        await Order.findByIdAndUpdate(order._id, update);
        fixedCount++;
        console.log(`✅ Fixed order ${order._id}: ${order.status} -> paymentStatus: ${update.paymentStatus}`);
      }
    }

    console.log(`🎉 Migration completed! Fixed ${fixedCount} orders out of ${orders.length} total orders.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

fixExistingOrders();
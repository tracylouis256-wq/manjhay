const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  priceAtOrder: {
    type: Number,
    required: true
  },
  selectedSize: {
    type: String,
    required: true,
    default: 'One Size',
    enum: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', 'One Size']
  },
  image: {
    public_id: String,
    url: String
  }
});

const contactHistorySchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  admin: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['call', 'sms', 'whatsapp', 'email'],
    required: true
  },
  purpose: {
    type: String,
    enum: ['shipping_cost', 'delivery_arrangement', 'payment_verification', 'general'],
    default: 'general'
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    region: {
      type: String,
      required: true,
      enum: [
        'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 
        'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong-Ahafo',
        'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North'
      ]
    },
    landmark: {
      type: String,
      required: true,
      trim: true
    }
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  finalAmount: {
    type: Number,
    min: 0
  },
  paymentProof: {
    public_id: String,
    url: String
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'contacted', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending_verification', 'verified', 'rejected'],
    default: 'pending_verification'
  },
  adminNotes: {
    type: String,
    maxlength: 500
  },
  contactHistory: [contactHistorySchema],
  momoDetails: {
    name: {
      type: String,
      default: 'Nsorh Emmanuel'
    },
    number: {
      type: String,
      default: '0257965652'
    },
    network: {
      type: String,
      default: 'MTN'
    }
  },
  shippingArrangement: {
    costFinalized: {
      type: Boolean,
      default: false
    },
    costFinalizedAt: Date,
    estimatedDelivery: Date,
    deliveryNotes: String
  }
}, {
  timestamps: true
});

orderSchema.pre('save', function(next) {
  if (this.isModified('shippingCost') || this.isModified('totalAmount')) {
    this.finalAmount = this.totalAmount + (this.shippingCost || 0);
  }

  if (this.isModified('status')) {
    if (this.status === 'verified' && this.paymentStatus !== 'verified') {
      this.paymentStatus = 'verified';
      console.log(`🔄 Auto-synced payment status to 'verified' for order ${this._id}`);
    } else if (this.status === 'cancelled' && this.paymentStatus !== 'rejected') {
      this.paymentStatus = 'rejected';
      console.log(`🔄 Auto-synced payment status to 'rejected' for order ${this._id}`);
    } else if (['contacted', 'shipped', 'delivered'].includes(this.status) && this.paymentStatus === 'pending_verification') {
      this.paymentStatus = 'verified';
      console.log(`🔄 Auto-synced payment status to 'verified' for progressed order ${this._id}`);
    }
  }

  next();
});

orderSchema.post('find', function(docs) {
  if (Array.isArray(docs)) {
    docs.forEach(doc => {
      if (doc && doc.status && doc.paymentStatus) {
        autoFixPaymentStatus(doc);
      }
    });
  }
});

orderSchema.post('findOne', function(doc) {
  if (doc && doc.status && doc.paymentStatus) {
    autoFixPaymentStatus(doc);
  }
});

function autoFixPaymentStatus(order) {
  const needsFix = (
    (order.status !== 'pending' && order.status !== 'cancelled' && order.paymentStatus === 'pending_verification') ||
    (order.status === 'verified' && order.paymentStatus !== 'verified') ||
    (order.status === 'cancelled' && order.paymentStatus !== 'rejected')
  );

  if (needsFix) {
    const oldPaymentStatus = order.paymentStatus;
    
    if (order.status === 'cancelled') {
      order.paymentStatus = 'rejected';
    } else if (order.status !== 'pending') {
      order.paymentStatus = 'verified';
    }

    order.save().then(() => {
      console.log(`🔄 Auto-fixed payment status from '${oldPaymentStatus}' to '${order.paymentStatus}' for order ${order._id}`);
    }).catch(err => {
      console.error(`❌ Failed to auto-fix payment status for order ${order._id}:`, err);
    });
  }
}

orderSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.status === 'verified' && this._update.status === 'verified') {
    const Product = mongoose.model('Product');
    
    for (const item of doc.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { 'inventory.quantity': -item.quantity } }
      );
    }
  }
});

module.exports = mongoose.model('Order', orderSchema);
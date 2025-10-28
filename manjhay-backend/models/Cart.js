const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  },
  itemCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update total amount and item count before save
cartSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  this.itemCount = this.items.reduce((count, item) => {
    return count + item.quantity;
  }, 0);
  
  next();
});

// Static method to get or create cart for user
cartSchema.statics.getUserCart = async function(userId) {
  let cart = await this.findOne({ user: userId }).populate('items.product');
  
  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }
  
  return cart;
};

// Instance method to add item to cart
cartSchema.methods.addItem = function(product, quantity, price, size, color) {
  const existingItemIndex = this.items.findIndex(
    item => item.product.toString() === product._id.toString() && 
    item.size === size && 
    item.color === color
  );

  if (existingItemIndex > -1) {
    // Update quantity if item already exists
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product: product._id,
      quantity,
      price,
      size,
      color
    });
  }

  return this.save();
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId);
  return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (item) {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    }
    item.quantity = quantity;
  }
  return this.save();
};

// Instance method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.totalAmount = 0;
  this.itemCount = 0;
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);

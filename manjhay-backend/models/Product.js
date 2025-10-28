const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide product description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: [0, 'Price cannot be negative']
  },
  image: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  category: {
    type: String,
    required: [true, 'Please provide product category'],
    enum: ['casual', 'formal', 'sports', 'beach', 'traditional']
  },
  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    sku: {
      type: String,
      unique: true,
      required: true
    }
  },
  inStock: {
    type: Boolean,
    default: true
  },
  // ✅ FIXED: Add sizeVariants to match frontend
  sizeVariants: [{
    size: {
      type: String,
      required: true,
      enum: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45']
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  }],
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// ✅ FIXED: Auto-calculate inStock and total quantity from sizeVariants
productSchema.pre('save', function(next) {
  if (this.sizeVariants && this.sizeVariants.length > 0) {
    // Calculate total stock from sizeVariants
    const totalStock = this.sizeVariants.reduce((total, variant) => total + (variant.stock || 0), 0);
    this.inventory.quantity = totalStock;
    this.inStock = totalStock > 0;
  } else {
    // Fallback to inventory quantity
    this.inStock = this.inventory.quantity > 0;
  }
  next();
});

// Method to check if a specific size is available
productSchema.methods.isSizeAvailable = function(size) {
  if (!this.sizeVariants || this.sizeVariants.length === 0) {
    return this.inventory.quantity > 0; // Fallback to total quantity
  }
  const sizeVariant = this.sizeVariants.find(s => s.size === size);
  return sizeVariant && sizeVariant.stock > 0;
};

// Method to get available sizes
productSchema.methods.getAvailableSizes = function() {
  if (!this.sizeVariants || this.sizeVariants.length === 0) {
    return []; // No size variants defined
  }
  return this.sizeVariants.filter(s => s.stock > 0).map(s => s.size);
};

module.exports = mongoose.model('Product', productSchema);
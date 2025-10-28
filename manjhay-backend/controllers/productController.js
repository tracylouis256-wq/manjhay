const Product = require('../models/Product');
const cloudinary = require('../utils/cloudinary');

// Helper function to generate SKU
function generateSKU() {
  const prefix = 'MJ';
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Helper function to extract public_id from Cloudinary URL
function extractPublicIdFromUrl(url) {
  try {
    const matches = url.match(/upload\/(?:v\d+\/)?([^\.]+)/);
    return matches ? matches[1] : `cloudinary-${Date.now()}`;
  } catch (error) {
    return `cloudinary-${Date.now()}`;
  }
}

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    // Filtering
    let query = {};
    
    // Search by name
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }
    
    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filter by featured
    if (req.query.featured) {
      query.featured = req.query.featured === 'true';
    }
    
    // Filter by inStock
    if (req.query.inStock) {
      query.inStock = req.query.inStock === 'true';
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;

    // Execute query
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    // Get total for pagination
    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      count: products.length,
      pagination: {
        page,
        pages: Math.ceil(total / limit)
      },
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product (handles both file upload and Cloudinary URL)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    console.log('=== CREATE PRODUCT REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? `File: ${req.file.originalname}` : 'No file');
    
    // Check if user has admin role
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    let imageData = {};

    // Handle both file upload and Cloudinary URL
    if (req.file) {
      // Upload image to Cloudinary from file
      console.log('Uploading image to Cloudinary from file...');
      try {
        const imageResult = await cloudinary.uploadImage(req.file.path, 'manjhay/products');
        imageData = {
          public_id: imageResult.public_id,
          url: imageResult.secure_url
        };
        console.log('Cloudinary upload successful:', imageResult.secure_url);
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to Cloudinary'
        });
      }
    } else if (req.body.image) {
      // Use Cloudinary URL from frontend
      console.log('Using Cloudinary URL from frontend:', req.body.image);
      const publicId = extractPublicIdFromUrl(req.body.image);
      imageData = {
        public_id: publicId,
        url: req.body.image
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Product image is required'
      });
    }

    // Prepare product data
    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      category: req.body.category,
      featured: req.body.featured === 'true' || req.body.featured === true,
      inventory: {
        quantity: parseInt(req.body.quantity) || 0,
        lowStockThreshold: parseInt(req.body.lowStockThreshold) || 10,
        sku: req.body.sku || generateSKU(),
        weight: req.body.weight || req.body.size || '40'
      },
      image: imageData
    };

    console.log('Final product data:', productData);

    // Create product
    const product = await Product.create(productData);
    console.log('Product created successfully:', product._id);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Product creation error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists. Please use a different SKU.'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages.join(', ')}`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating product'
    });
  }
};

// @desc    Create product with Cloudinary URL (for frontend direct upload)
// @route   POST /api/products/cloudinary
// @access  Private/Admin
exports.createProductWithCloudinary = async (req, res, next) => {
  try {
    console.log('=== CREATE PRODUCT WITH CLOUDINARY REQUEST ===');
    console.log('Request body:', req.body);
    
    // Check if user has admin role
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    if (!req.body.image) {
      return res.status(400).json({
        success: false,
        message: 'Product image URL is required'
      });
    }

    // Prepare product data
    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      category: req.body.category,
      featured: req.body.featured === 'true' || req.body.featured === true,
      inventory: {
        quantity: parseInt(req.body.quantity) || 0,
        lowStockThreshold: parseInt(req.body.lowStockThreshold) || 10,
        sku: req.body.sku || generateSKU(),
        weight: req.body.size || '40'
      },
      image: {
        public_id: extractPublicIdFromUrl(req.body.image),
        url: req.body.image
      }
    };

    console.log('Final product data:', productData);

    // Create product
    const product = await Product.create(productData);
    console.log('Product created successfully with Cloudinary URL:', product._id);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Product creation error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists. Please use a different SKU.'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages.join(', ')}`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating product'
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    console.log('=== UPDATE PRODUCT REQUEST ===');
    console.log('Product ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? `File: ${req.file.originalname}` : 'No file');

    // Check if user has admin role
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const updateData = { ...req.body };

    // Handle image update
    if (req.file) {
      console.log('Updating product image from file...');
      
      // Delete old image from Cloudinary
      if (product.image.public_id) {
        try {
          await cloudinary.deleteImage(product.image.public_id);
          console.log('Old image deleted from Cloudinary');
        } catch (deleteError) {
          console.error('Error deleting old image:', deleteError);
        }
      }

      // Upload new image
      try {
        const imageResult = await cloudinary.uploadImage(req.file.path, 'manjhay/products');
        updateData.image = {
          public_id: imageResult.public_id,
          url: imageResult.secure_url
        };
        console.log('New image uploaded to Cloudinary');
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload new image'
        });
      }
    } else if (req.body.image && typeof req.body.image === 'object' && req.body.image.url) {
      // ✅ FIXED: Handle image object from frontend (for Cloudinary URLs)
      console.log('Updating product image with Cloudinary object:', req.body.image);
      updateData.image = {
        public_id: req.body.image.public_id,
        url: req.body.image.url // This should be a string!
      };
    } else if (req.body.image && typeof req.body.image === 'string') {
      // Handle direct URL string
      console.log('Updating product image with URL string:', req.body.image);
      updateData.image = {
        public_id: extractPublicIdFromUrl(req.body.image),
        url: req.body.image
      };
    }

    // Parse numeric fields
    if (req.body.price) updateData.price = parseFloat(req.body.price);
    
    // Handle inventory updates
    if (req.body.inventory) {
      updateData.inventory = {
        ...product.inventory.toObject(),
        ...req.body.inventory
      };
    }

    // Handle sizeVariants if provided
    if (req.body.sizeVariants) {
      updateData.sizeVariants = req.body.sizeVariants;
    }

    // Handle featured field
    if (req.body.featured !== undefined) {
      updateData.featured = req.body.featured === 'true' || req.body.featured === true;
    }

    console.log('Final update data:', updateData);

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    console.log('Product updated successfully');

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Product update error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages.join(', ')}`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating product'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    // Check if user has admin role
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete image from Cloudinary
    if (product.image.public_id && !product.image.public_id.startsWith('cloudinary-')) {
      try {
        await cloudinary.deleteImage(product.image.public_id);
        console.log('Product image deleted from Cloudinary');
      } catch (deleteError) {
        console.error('Error deleting image from Cloudinary:', deleteError);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    console.log('Product deleted successfully:', req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
};
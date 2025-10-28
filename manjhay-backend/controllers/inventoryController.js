const Product = require('../models/Product');

// @desc    Get low stock alerts
// @route   GET /api/inventory/alerts
// @access  Private/Admin
exports.getLowStockAlerts = async (req, res, next) => {
  try {
    const lowStockProducts = await Product.find({
      $expr: {
        $lte: [
          '$inventory.quantity',
          '$inventory.lowStockThreshold'
        ]
      }
    }).sort({ 'inventory.quantity': 1 });

    res.json({
      success: true,
      count: lowStockProducts.length,
      data: lowStockProducts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product quantity
// @route   PATCH /api/inventory/:id/quantity
// @access  Private/Admin
exports.updateQuantity = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.inventory.quantity = quantity;
    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats
// @access  Private/Admin
exports.getInventoryStats = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const outOfStock = await Product.countDocuments({ inStock: false });
    const lowStock = await Product.countDocuments({
      $expr: {
        $lte: [
          '$inventory.quantity',
          '$inventory.lowStockThreshold'
        ]
      }
    });
    const totalValue = await Product.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$price', '$inventory.quantity'] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        outOfStock,
        lowStock,
        inStock: totalProducts - outOfStock,
        totalValue: totalValue[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
};
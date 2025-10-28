// routes/products.js
const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductWithCloudinary
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload'); // Destructure the upload

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, upload.single('image'), createProduct); // For file uploads

// New route for Cloudinary direct uploads
router.route('/cloudinary')
  .post(protect, createProductWithCloudinary); // For Cloudinary URLs

router.route('/:id')
  .get(getProduct)
  .put(protect, upload.single('image'), updateProduct)
  .delete(protect, deleteProduct);

module.exports = router;
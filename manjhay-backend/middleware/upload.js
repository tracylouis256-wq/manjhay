const multer = require('multer');
const path = require('path');

// Use disk storage to work with your current cloudinary setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, `payment-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  console.log('File validation:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    extname: path.extname(file.originalname).toLowerCase(),
    isValid: mimetype && extname
  });

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, PNG, and WebP images are allowed!'));
  }
}

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Please use "paymentProof" as the field name.'
      });
    }
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

module.exports = { upload, handleUploadError };
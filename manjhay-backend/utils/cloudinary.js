const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image to Cloudinary from file path (for disk storage)
exports.uploadImage = async (filePath, folder = 'manjhay') => {
  try {
    console.log('Uploading image from path:', filePath);
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      quality: 'auto',
      fetch_format: 'auto'
    });
    console.log('Cloudinary upload successful:', result.secure_url);
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Cloudinary upload error: ${error.message}`);
  }
};

// Upload image from buffer (for memory storage)
exports.uploadImageFromBuffer = async (fileBuffer, folder = 'manjhay') => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      reject(new Error('No file buffer provided'));
      return;
    }

    console.log('Uploading image from buffer, size:', fileBuffer.length);
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        quality: 'auto',
        fetch_format: 'auto',
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload stream error:', error);
          reject(new Error(`Cloudinary upload error: ${error.message}`));
        } else {
          console.log('Cloudinary upload from buffer successful:', result.secure_url);
          resolve(result);
        }
      }
    );

    // Handle stream errors
    uploadStream.on('error', (error) => {
      console.error('Upload stream error:', error);
      reject(new Error(`Upload stream error: ${error.message}`));
    });

    // Write the buffer to the stream
    uploadStream.end(fileBuffer);
  });
};

// Delete image from Cloudinary
exports.deleteImage = async (publicId) => {
  try {
    console.log('Deleting image from Cloudinary:', publicId);
    await cloudinary.uploader.destroy(publicId);
    console.log('Image deleted successfully');
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Cloudinary delete error: ${error.message}`);
  }
};
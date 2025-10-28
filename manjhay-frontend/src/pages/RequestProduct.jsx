import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Upload, ArrowLeft, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const RequestProduct = () => {
  const [formData, setFormData] = useState({
    image: null,
    description: '',
    contact: ''
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (PNG, JPG, JPEG)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setFormData(prev => ({ ...prev, image: file }));
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.image || !formData.description.trim() || !formData.contact.trim()) {
      setError('All fields are required');
      return;
    }

    if (!user) {
      setError('Please log in to request a product');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('image', formData.image);
      submitData.append('description', formData.description);
      submitData.append('contact', formData.contact);
      submitData.append('userId', user.id);

      const response = await fetch('/api/user-requests', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Request Submitted!
            </h2>
            <p className="text-gray-600 mb-6">
              ✅ Your request has been received! The admin will contact you soon.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center bg-[#f97316] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#ea580c] transition-colors"
            >
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/products"
            className="inline-flex items-center text-[#f97316] hover:text-[#ea580c] mb-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Request Custom Product
          </h1>
          <p className="text-gray-600 mt-2">
            Can't find what you're looking for? Upload an image of the product you want and we'll get back to you!
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Image *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#f97316] transition-colors">
                <div className="space-y-1 text-center">
                  {previewUrl ? (
                    <div className="mb-4">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="mx-auto h-32 w-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl('');
                          setFormData(prev => ({ ...prev, image: null }));
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-500"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload size={48} className="mx-auto text-gray-400" />
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label
                          htmlFor="image-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-[#f97316] hover:text-[#ea580c] focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="image-upload"
                            name="image"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Product Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-colors"
                placeholder="Describe the product you're looking for... (color, size, style, etc.)"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            {/* Contact Info */}
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Information *
              </label>
              <input
                type="text"
                id="contact"
                name="contact"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-colors"
                placeholder="Your email or phone number"
                value={formData.contact}
                onChange={handleInputChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll use this to contact you about your request
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f97316] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-white bg-[#f97316] hover:bg-[#ea580c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f97316] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Submitting...</span>
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestProduct;
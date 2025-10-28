import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Phone, MapPin, MessageCircle, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    deliveryAddress: '',
    region: '',
    landmark: ''
  });
  const [paymentProof, setPaymentProof] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ghanaRegions = [
    'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 
    'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong-Ahafo',
    'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North'
  ];

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (JPEG, PNG, WebP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError('File size must be less than 5MB');
        return;
      }
      
      // Clean up previous preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      setPaymentProof(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const removeFile = () => {
    setPaymentProof(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    setError('');
  };

  // Prepare cart items with proper structure for backend
  const prepareCartItems = () => {
    return cartItems.map(item => ({
      productId: item._id, // Use productId field explicitly
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      selectedSize: item.selectedSize || 'One Size', // Ensure selectedSize is always included
      image: item.image?.url || '',
      _id: item._id // Include _id as fallback
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!paymentProof) {
      setError('Please upload your payment proof screenshot');
      return;
    }

    if (!formData.deliveryAddress || !formData.region || !formData.landmark) {
      setError('Please fill in all delivery information');
      return;
    }

    // Validate user phone
    if (!user?.phone) {
      setError('Phone number is required for delivery. Please update your profile.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = new FormData();
      
      // Append order data with properly formatted items
      const preparedItems = prepareCartItems();
      orderData.append('items', JSON.stringify(preparedItems));
      orderData.append('totalAmount', getCartTotal().toFixed(2));
      orderData.append('deliveryAddress', formData.deliveryAddress);
      orderData.append('region', formData.region);
      orderData.append('landmark', formData.landmark);
      
      // Don't append userId, userEmail, userPhone - they come from auth middleware
      // orderData.append('userId', user?.id || '');
      // orderData.append('userEmail', user?.email || '');
      // orderData.append('userPhone', user?.phone || '');
      
      // Append the file - make sure the field name matches the multer configuration
      orderData.append('paymentProof', paymentProof);

      console.log('Sending order data...');
      console.log('Cart items:', preparedItems);

      const response = await axios.post('/api/orders', orderData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 second timeout
      });

      console.log('Order response:', response.data);

      if (response.data.success) {
        clearCart();
        navigate('/order-confirmation', { 
          state: { 
            order: response.data.data,
            message: 'Order placed successfully! We will contact you shortly to arrange shipping.'
          }
        });
      } else {
        throw new Error(response.data.message || 'Order creation failed');
      }
    } catch (error) {
      console.error('Order creation failed:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.data?.message) {
        // Handle specific validation errors
        if (error.response.data.message.includes('selectedSize')) {
          setError('Size selection is required for all products. Please ensure all items have a selected size.');
        } else if (error.response.data.message.includes('Product not found')) {
          setError('One of the products in your cart is no longer available. Please refresh your cart and try again.');
        } else {
          setError(error.response.data.message);
        }
      } else if (error.code === 'ECONNABORTED') {
        setError('Request timeout. Please check your internet connection and try again.');
      } else if (error.response?.status === 413) {
        setError('File too large. Please upload a smaller image (max 5MB).');
      } else if (error.response?.status === 400) {
        setError('Invalid request. Please check your information and try again.');
      } else if (!error.response) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Order creation failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate total with safety check
  const totalAmount = getCartTotal ? getCartTotal().toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to your cart before checking out.</p>
            <button
              onClick={() => navigate('/products')}
              className="bg-[#f97316] text-white py-2 px-6 rounded-lg font-semibold hover:bg-[#ea580c] transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={`${item._id}-${item.selectedSize}`} className="flex justify-between items-center border-b pb-4 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.image?.url || '/placeholder-image.jpg'}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                          {item.selectedSize && ` • Size: ${item.selectedSize}`}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">GH₵{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>GH₵{totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Delivery & Payment</h2>

              {/* Important Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <MessageCircle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-1">
                      Important: Shipping Cost Arrangement
                    </h3>
                    <p className="text-yellow-700 text-sm">
                      After payment verification, our admin will contact you via phone call or WhatsApp 
                      to discuss and agree on the shipping cost based on your location. 
                      Please ensure your phone number is correct and accessible.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Delivery Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="deliveryAddress"
                      required
                      value={formData.deliveryAddress}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-colors"
                      placeholder="Enter your complete delivery address"
                    />
                  </div>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region *
                  </label>
                  <select
                    name="region"
                    required
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-colors"
                  >
                    <option value="">Select your region</option>
                    {ghanaRegions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                {/* Landmark */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Landmark *
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    required
                    value={formData.landmark}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-colors"
                    placeholder="e.g., Near the main market, Behind the church, etc."
                  />
                </div>

                {/* Contact Information Display */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">We will contact you at:</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone size={16} />
                    <span>{user?.phone || 'Not provided'}</span>
                  </div>
                  {!user?.phone && (
                    <p className="text-xs text-red-500 mt-1">
                      Phone number is required. Please update your profile.
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Please ensure this number is active for shipping cost discussion
                  </p>
                </div>

                {/* Payment Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Payment Instructions</h3>
                  <div className="space-y-2 text-sm text-blue-700">
                    <p><strong>Send payment to:</strong></p>
                    <p>Name: <strong>Nsorh Emmanuel</strong></p>
                    <p>Number: <strong>0257965652</strong> (MTN)</p>
                    <p>Amount: <strong>GH₵{totalAmount}</strong></p>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Take a screenshot of your successful payment and upload it below
                  </p>
                </div>

                {/* Payment Proof Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Proof Screenshot *
                  </label>
                  
                  {previewUrl ? (
                    <div className="border-2 border-green-200 border-dashed rounded-lg p-4 bg-green-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-green-700 font-medium">File uploaded successfully</span>
                        <button
                          type="button"
                          onClick={removeFile}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <img
                        src={previewUrl}
                        alt="Payment proof preview"
                        className="w-full max-w-xs mx-auto rounded-lg shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#f97316] transition-colors">
                      <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                      <p className="text-sm text-gray-600 mb-2">
                        Upload your payment screenshot (JPEG, PNG, WebP)
                      </p>
                      <p className="text-xs text-gray-500 mb-4">Max file size: 5MB</p>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                        id="paymentProof"
                      />
                      <label
                        htmlFor="paymentProof"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#f97316] hover:bg-[#ea580c] cursor-pointer transition-colors"
                      >
                        Choose File
                      </label>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !paymentProof || !user?.phone}
                  className="w-full bg-[#f97316] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Order...
                    </div>
                  ) : (
                    'Complete Order'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
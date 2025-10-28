import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Phone, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const OrderConfirmation = () => {
  const location = useLocation();
  const order = location.state?.order;
  const { user } = useAuth();

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
          <Link to="/" className="text-primary-600 hover:text-primary-700">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const deliveryAddress = order.deliveryAddress || order.user?.address || 'Not provided';
  const region = order.region || order.user?.region || 'Not specified';
  const landmark = order.landmark || order.user?.landmark || 'Not specified';
  const userPhone = user?.phone || order.userPhone || order.user?.phone || 'Not provided';
  const userEmail = user?.email || order.userEmail || order.user?.email || 'Not provided';
  const userName = user?.name || order.user?.name || 'Customer';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <CheckCircle size={64} className="text-green-500" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Order Placed Successfully!
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            Thank you for your order, <strong>{userName}</strong>. Your order ID is: <strong>{order._id}</strong>
          </p>

          {/* Shipping Cost Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-3">
              <MessageCircle className="text-yellow-600 mt-0.5 flex-shrink-0" size={24} />
              <div className="text-left">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Next Step: Shipping Cost Discussion
                </h3>
                <p className="text-yellow-700 mb-3">
                  Our admin will contact you within 24 hours via phone call or WhatsApp 
                  to discuss the shipping cost based on your location in <strong>{region}</strong>.
                </p>
                <div className="flex items-center space-x-2 text-yellow-700">
                  <Phone size={16} />
                  <span>We will contact: <strong>{userPhone}</strong></span>
                </div>
                <p className="text-sm text-yellow-600 mt-2">
                  Please keep your phone accessible for this important discussion.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Total Amount Paid:</strong> GH₵{order.totalAmount?.toFixed(2) || '0.00'}</p>
              <p><strong>Delivery Address:</strong> {deliveryAddress}</p>
              <p><strong>Region:</strong> {region}</p>
              <p><strong>Landmark:</strong> {landmark}</p>
              <p><strong>Contact Phone:</strong> {userPhone}</p>
              <p><strong>Contact Email:</strong> {userEmail}</p>
              <p><strong>Order Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                </span>
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-800 mb-3">What Happens Next?</h3>
            <ol className="text-left text-blue-700 space-y-2 text-sm">
              <li>1. We verify your payment (usually within 2-4 hours)</li>
              <li>2. Admin contacts you to discuss shipping cost</li>
              <li>3. We arrange delivery after shipping cost agreement</li>
              <li>4. Your order is shipped to your address</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Continue Shopping
            </Link>
            {/* FIXED: Navigate directly to orders tab */}
            <Link
              to="/profile"
              state={{ activeTab: 'orders' }}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
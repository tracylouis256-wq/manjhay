import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  Truck, 
  Package, 
  MapPin, 
  Phone, 
  Mail,
  CreditCard,
  Printer,
  Home,
  FileText
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animatedSteps, setAnimatedSteps] = useState([]);

  // Order status progression - MATCHING YOUR BACKEND STATUSES
  const orderStatuses = [
    { 
      key: 'pending', 
      label: 'Order Placed', 
      description: 'Your order has been received and payment is being verified',
      icon: ShoppingBag,
    },
    { 
      key: 'verified', 
      label: 'Payment Verified', 
      description: 'Your payment has been verified successfully',
      icon: CheckCircle,
    },
    { 
      key: 'contacted', 
      label: 'Contacted', 
      description: 'We have contacted you about shipping arrangements',
      icon: Phone,
    },
    { 
      key: 'shipped', 
      label: 'Shipped', 
      description: 'Your order has been shipped and is on the way',
      icon: Truck,
    },
    { 
      key: 'delivered', 
      label: 'Delivered', 
      description: 'Order has been delivered successfully',
      icon: CheckCircle,
    }
  ];

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`/api/orders/user/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Order API Response:', response.data);
      const orderData = response.data.data;
      setOrder(orderData);
      
    } catch (error) {
      console.error('Error fetching order details:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to load order details');
      navigate('/profile?tab=orders');
    } finally {
      setLoading(false);
    }
  };

  // Animation for completed steps
  useEffect(() => {
    if (order?.status) {
      const currentStatusIndex = orderStatuses.findIndex(status => status.key === order.status);
      const timer = setTimeout(() => {
        setAnimatedSteps(orderStatuses.slice(0, currentStatusIndex + 1).map(s => s.key));
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [order?.status]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'verified': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentStatusIndex = () => {
    return orderStatuses.findIndex(status => status.key === order?.status);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodDisplay = () => {
    return 'Mobile Money';
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleContactSupport = () => {
    toast.info('Support contact feature coming soon');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/profile?tab=orders')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals properly
  const subtotal = order.totalAmount || 0;
  const shippingCost = order.shippingCost || 0;
  const total = order.finalAmount || (subtotal + shippingCost);

  const currentStatusIndex = getCurrentStatusIndex();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/profile?tab=orders')}
            className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Orders
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600">Order #{order._id?.slice(-8).toUpperCase() || 'N/A'}</p>
              <p className="text-gray-500 text-sm">Placed on {formatDate(order.createdAt)}</p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <button
                onClick={() => navigate('/')}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Home size={16} className="mr-2" />
                Continue Shopping
              </button>
              
              <button
                onClick={() => navigate(`/invoice/${orderId}`)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileText size={16} className="mr-2" />
                View Invoice
              </button>
              
              <button
                onClick={handlePrintInvoice}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Printer size={16} className="mr-2" />
                Print Invoice
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Progress & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Progress Tracking - HORIZONTAL */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Tracking</h2>
              
              {/* Horizontal Progress Timeline */}
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 md:mx-8">
                  <div 
                    className="bg-green-500 h-0.5 transition-all duration-1000 ease-in-out"
                    style={{ 
                      width: `${(currentStatusIndex / (orderStatuses.length - 1)) * 100}%` 
                    }}
                  ></div>
                </div>

                {/* Status Steps - Horizontal Layout */}
                <div className="grid grid-cols-5 gap-2 md:gap-4 relative z-10">
                  {orderStatuses.map((status, index) => {
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const isAnimated = animatedSteps.includes(status.key);
                    const StatusIcon = status.icon;

                    return (
                      <div key={status.key} className="flex flex-col items-center text-center">
                        {/* Status Dot with Ripple */}
                        <div className="relative mb-2">
                          <div className={`relative w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                            isCompleted 
                              ? 'bg-green-500 border-green-500 text-white scale-110' 
                              : isCurrent
                              ? 'bg-white border-green-500 text-green-500 scale-105'
                              : 'bg-white border-gray-300 text-gray-400'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle size={16} className="transition-all duration-300" />
                            ) : (
                              <StatusIcon size={16} className="transition-all duration-300" />
                            )}
                            
                            {/* Ripple Effect for Completed Steps */}
                            {isAnimated && isCompleted && (
                              <>
                                <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>
                                <div className="absolute inset-0 rounded-full bg-green-500 animate-pulse"></div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status Label */}
                        <div className="flex flex-col items-center">
                          <span className={`text-xs font-medium transition-all duration-500 ${
                            isCompleted ? 'text-green-700' : isCurrent ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {status.label}
                          </span>
                          
                          {/* Status Badges */}
                          <div className="mt-1">
                            {isCurrent && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-pulse">
                                Current
                              </span>
                            )}
                            {isCompleted && !isCurrent && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle size={10} className="mr-0.5" />
                                Done
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Status Descriptions - Show below on mobile, tooltip on desktop */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-2">
                  {orderStatuses.map((status, index) => {
                    const isCompleted = index <= currentStatusIndex;
                    return (
                      <div 
                        key={status.key}
                        className={`text-center p-3 rounded-lg transition-all duration-300 ${
                          isCompleted ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <p className={`text-sm font-medium mb-1 ${
                          isCompleted ? 'text-green-800' : 'text-gray-600'
                        }`}>
                          {status.label}
                        </p>
                        <p className={`text-xs ${
                          isCompleted ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {status.description}
                        </p>
                        {isCompleted && (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            ✓ Completed
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Status Summary */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <h3 className="font-semibold text-blue-900">Current Status</h3>
                    <p className="text-blue-700 text-sm">
                      {orderStatuses.find(s => s.key === order.status)?.description}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                  </span>
                </div>
                
                {order.shippingArrangement?.estimatedDelivery && (
                  <div className="mt-2 flex items-center text-blue-600 text-sm">
                    <Clock size={14} className="mr-1" />
                    Estimated delivery: {formatDate(order.shippingArrangement.estimatedDelivery)}
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={item._id || index} className="flex items-center space-x-4 py-4 border-b border-gray-100 last:border-b-0">
                    <img
                      src={item.product?.images?.[0]?.url || item.product?.image?.url || '/api/placeholder/80/80'}
                      alt={item.product?.name || 'Product image'}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product?.name || 'Product'}</h3>
                      <p className="text-gray-600 text-sm">Quantity: {item.quantity || 0}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        GH₵{((item.priceAtOrder || item.price || 0) * (item.quantity || 0)).toFixed(2)}
                      </p>
                      <p className="text-gray-600 text-sm">
                        GH₵{(item.priceAtOrder || item.price || 0).toFixed(2)} each
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    No items found in this order
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary & Shipping */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>GH₵{subtotal.toFixed(2)}</span>
                </div>
                
                {shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>GH₵{shippingCost.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>GH₵{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Status - UPDATED TO SHOW "COMPLETED" */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.paymentStatus === 'verified' 
                      ? 'bg-green-100 text-green-800'
                      : order.paymentStatus === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.paymentStatus === 'verified' ? 'Completed' : 
                     order.paymentStatus === 'rejected' ? 'Rejected' : 'Pending Verification'}
                  </span>
                </div>
                
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  <CreditCard size={16} className="mr-2" />
                  {getPaymentMethodDisplay()}
                </div>

                {/* Mobile Money Details */}
                <div className="mt-2 text-sm text-gray-600">
                  <p>Mobile: {order.momoDetails?.number || '0257965652'}</p>
                  <p>Network: {order.momoDetails?.network || 'MTN'}</p>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h2>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPin size={16} className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.user?.name || user?.name || 'Customer'}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {order.user?.address || 'Address not specified'}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {order.user?.region || 'Region not specified'}, Ghana
                    </p>
                    {order.user?.landmark && (
                      <p className="text-gray-600 text-sm">
                        Landmark: {order.user.landmark}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone size={16} className="text-gray-400 mr-3" />
                  <span className="text-gray-600">
                    {order.user?.phone || user?.phone || 'Phone not provided'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Mail size={16} className="text-gray-400 mr-3" />
                  <span className="text-gray-600">{order.user?.email || user?.email || 'Email not provided'}</span>
                </div>
              </div>

              {/* Contact History */}
              {order.contactHistory && order.contactHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-2">Contact History</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {order.contactHistory.map((contact, index) => (
                      <div key={index} className="text-xs text-gray-600 border-l-2 border-blue-500 pl-2">
                        <p className="font-medium">{contact.admin} - {contact.type}</p>
                        <p>{contact.notes}</p>
                        <p className="text-gray-400">{formatDate(contact.date)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Need Help? */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-blue-700 text-sm mb-4">
                Having issues with your order? Our support team is here to help.
              </p>
              <button 
                onClick={handleContactSupport}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Mail,
  Home,
  Building,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Sparkles,
  Shield,
  CheckCircle,
  Truck,
  Package,
  CreditCard,
  User,
  Clock,
  Menu,
  X
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const Invoice = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyInfo] = useState({
    name: 'ManJhay',
    tagline: 'Premium Fashion & Lifestyle',
    address: 'Accra, Ghana',
    phone: '+233 257 965 652',
    email: 'support@manjhay.com',
    website: 'www.manjhay.com'
  });

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
      
      const orderData = response.data.data;
      setOrder(orderData);
      
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load invoice');
      navigate('/profile?tab=orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `GH₵${(amount || 0).toFixed(2)}`;
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const handleDownloadPDF = async () => {
    toast.info('PDF download feature coming soon');
  };

  const handleEmailInvoice = () => {
    toast.info('Email invoice feature coming soon');
  };

  const calculateSubtotal = () => {
    return order?.items?.reduce((total, item) => total + ((item.priceAtOrder || 0) * (item.quantity || 0)), 0) || 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = order?.shippingCost || 0;
    return subtotal + shipping;
  };

  // ManJhay Logo Component
  const ManJhayLogo = ({ size = 40, className = "" }) => (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <div className="flex">
          <div className="w-2 h-6 bg-gradient-to-b from-primary-600 to-primary-700 rounded-l-lg"></div>
          <div className="w-2 h-8 bg-gradient-to-b from-primary-500 to-primary-600 mx-1 rounded-lg"></div>
          <div className="w-2 h-6 bg-gradient-to-b from-primary-600 to-primary-700 rounded-r-lg"></div>
        </div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-full"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">Preparing your invoice...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-lg p-6 w-full max-w-md border border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-red-500" size={32} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">The invoice you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/profile?tab=orders')}
            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 font-semibold w-full sm:w-auto"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-4 sm:py-8 print:py-0 ${isPrinting ? 'printing' : ''}`}>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 w-48" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => navigate('/profile?tab=orders')}
                className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Orders
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium"
              >
                <Home size={16} className="mr-2" />
                Home
              </button>
              <button
                onClick={handleEmailInvoice}
                className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium"
              >
                <Mail size={16} className="mr-2" />
                Email
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium"
              >
                <Download size={16} className="mr-2" />
                PDF
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md text-sm font-medium"
              >
                <Printer size={16} className="mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar - Responsive Design */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 mb-4 sm:mb-8 print:hidden">
        <div className="bg-white/90 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-sm border border-gray-200/50 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/profile?tab=orders')}
                className="flex items-center px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-sm sm:text-base"
              >
                <ArrowLeft size={16} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to Orders</span>
                <span className="sm:hidden">Back</span>
              </button>
              
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 bg-gray-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                <Sparkles size={12} className="text-primary-600" />
                <span className="font-medium">INV-{order._id?.slice(-8).toUpperCase()}</span>
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-2">
              <button
                onClick={() => navigate('/')}
                className="flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                <Home size={16} className="mr-2" />
                Home
              </button>
              <button
                onClick={handleEmailInvoice}
                className="flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                <Mail size={16} className="mr-2" />
                Email
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                <Download size={16} className="mr-2" />
                PDF
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-md hover:scale-105 transition-all duration-200 font-semibold shadow-sm"
              >
                <Printer size={16} className="mr-2" />
                Print Invoice
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden flex items-center justify-center w-10 h-10 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Invoice Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none border border-gray-200">
          
          {/* Premium Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-6 lg:p-8 print:bg-slate-900">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              {/* Company Info with Logo */}
              <div className="mb-4 sm:mb-6 lg:mb-0">
                <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white/10 rounded-lg sm:rounded-xl backdrop-blur-sm border border-white/20">
                    <ManJhayLogo size={20} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">INVOICE</h1>
                    <p className="text-slate-300 font-light text-xs sm:text-sm">Tax Invoice • Official Receipt</p>
                  </div>
                </div>
                
                <div className="space-y-1 sm:space-y-2 text-slate-300 text-xs sm:text-sm">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Building size={12} className="sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                    <span className="font-medium">{companyInfo.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <MapPin size={12} className="sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                    <span>{companyInfo.address}</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Phone size={12} className="sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                    <span>{companyInfo.phone}</span>
                  </div>
                </div>
              </div>
              
              {/* Invoice Meta */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/20 lg:min-w-80">
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 sm:mb-2">Invoice Number</p>
                    <p className="text-base sm:text-lg lg:text-xl font-bold text-white">INV-{order._id?.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className="h-px bg-white/10"></div>
                  <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 sm:mb-2">Invoice Date</p>
                    <p className="text-sm sm:text-base lg:text-lg font-semibold text-white">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 sm:mb-2">Order Number</p>
                    <p className="text-sm sm:text-base lg:text-lg font-semibold text-white">ORD-{order._id?.slice(-8).toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
            {/* Customer & Shipping Information */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 lg:mb-10">
              {/* Billing Information */}
              <div className="bg-slate-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-200">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center">
                  <User size={16} className="sm:w-5 sm:h-5 mr-2 sm:mr-3 text-primary-600" />
                  Billing Information
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mb-1">Customer Name</p>
                    <p className="text-sm sm:text-lg font-semibold text-slate-900">{order.user?.name || 'Customer'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mb-1">Email Address</p>
                    <p className="text-sm sm:text-base text-slate-900 font-medium">{order.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mb-1">Phone Number</p>
                    <p className="text-sm sm:text-base text-slate-900 font-medium">{order.user?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mb-1">Billing Address</p>
                    <div className="text-slate-900 space-y-0.5 sm:space-y-1">
                      <p className="text-sm sm:text-base font-medium">{order.user?.address || 'Address not specified'}</p>
                      <p className="text-xs sm:text-sm">{order.user?.region}, Ghana</p>
                      {order.user?.landmark && <p className="text-xs sm:text-sm text-slate-600">Landmark: {order.user.landmark}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              <div className="bg-slate-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-200">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center">
                  <Truck size={16} className="sm:w-5 sm:h-5 mr-2 sm:mr-3 text-primary-600" />
                  Shipping Information
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mb-1">Recipient Name</p>
                    <p className="text-sm sm:text-lg font-semibold text-slate-900">{order.user?.name || 'Customer'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mb-1">Shipping Address</p>
                    <div className="text-slate-900 space-y-0.5 sm:space-y-1">
                      <p className="text-sm sm:text-base font-medium">{order.user?.address || 'Address not specified'}</p>
                      <p className="text-xs sm:text-sm">{order.user?.region}, Ghana</p>
                      {order.user?.landmark && <p className="text-xs sm:text-sm text-slate-600">Landmark: {order.user.landmark}</p>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mb-1">Contact Phone</p>
                    <p className="text-sm sm:text-base text-slate-900 font-medium">{order.user?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6 sm:mb-8 lg:mb-10">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center">
                <Package size={18} className="sm:w-5 sm:h-5 mr-2 sm:mr-3 text-primary-600" />
                Order Items
              </h3>
              <div className="overflow-hidden rounded-lg sm:rounded-xl border border-slate-200 bg-white">
                {/* Mobile View - Cards */}
                <div className="lg:hidden">
                  {order.items?.map((item, index) => (
                    <div key={item._id || index} className="border-b border-slate-200 last:border-b-0 p-4">
                      <div className="flex items-start space-x-3 mb-3">
                        <img
                          src={item.product?.images?.[0]?.url || item.product?.image?.url || '/api/placeholder/60/60'}
                          alt={item.product?.name}
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm mb-1 truncate">{item.product?.name || 'Product'}</p>
                          <p className="text-xs text-slate-500">SKU: {item.product?._id?.slice(-8).toUpperCase() || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 text-xs mb-1">Quantity</p>
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-primary-50 text-primary-700 rounded-lg font-semibold border border-primary-200 text-sm">
                            {item.quantity}
                          </span>
                        </div>
                        <div>
                          <p className="text-slate-600 text-xs mb-1">Unit Price</p>
                          <p className="font-medium text-slate-900">{formatCurrency(item.priceAtOrder || item.price)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-600 text-xs mb-1">Total</p>
                          <p className="font-semibold text-slate-900 text-base">
                            {formatCurrency((item.priceAtOrder || item.price) * (item.quantity || 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View - Table */}
                <table className="hidden lg:table min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Product Details
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        SKU
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Quantity
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Unit Price
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {order.items?.map((item, index) => (
                      <tr key={item._id || index} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 lg:px-6 py-4">
                          <div className="flex items-center space-x-3 lg:space-x-4">
                            <img
                              src={item.product?.images?.[0]?.url || item.product?.image?.url || '/api/placeholder/60/60'}
                              alt={item.product?.name}
                              className="w-10 h-10 lg:w-14 lg:h-14 object-cover rounded-lg border border-slate-200"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-sm lg:text-base mb-1 truncate">{item.product?.name || 'Product'}</p>
                              <p className="text-xs text-slate-500 hidden xl:block">Product details</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-center">
                          <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                            {item.product?._id?.slice(-8).toUpperCase() || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 bg-primary-50 text-primary-700 rounded-lg font-semibold border border-primary-200 text-sm lg:text-base">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-right font-medium text-slate-900 text-sm lg:text-base">
                          {formatCurrency(item.priceAtOrder || item.price)}
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-right font-semibold text-slate-900 text-sm lg:text-base">
                          {formatCurrency((item.priceAtOrder || item.price) * (item.quantity || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial & Status Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
              {/* Payment & Status Info */}
              <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Payment Information */}
                <div className="bg-slate-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-200">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center">
                    <CreditCard size={16} className="sm:w-5 sm:h-5 mr-2 sm:mr-3 text-primary-600" />
                    Payment Information
                  </h4>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                      <span className="text-xs sm:text-sm text-slate-600 font-medium">Payment Method</span>
                      <span className="text-sm sm:text-base font-semibold text-slate-900">Mobile Money</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                      <span className="text-xs sm:text-sm text-slate-600 font-medium">Payment Status</span>
                      <span className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold ${
                        order.paymentStatus === 'verified' || order.status !== 'pending'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : order.paymentStatus === 'rejected'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {order.paymentStatus === 'verified' || order.status !== 'pending' ? 'PAID' : 
                         order.paymentStatus === 'rejected' ? 'REJECTED' : 'PENDING'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                      <span className="text-xs sm:text-sm text-slate-600 font-medium">Mobile Number</span>
                      <span className="text-sm sm:text-base font-semibold text-slate-900">{order.momoDetails?.number || '0257965652'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs sm:text-sm text-slate-600 font-medium">Network</span>
                      <span className="text-sm sm:text-base font-semibold text-slate-900">{order.momoDetails?.network || 'MTN'}</span>
                    </div>
                  </div>
                </div>

                {/* Order Status */}
                <div className="bg-slate-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-200">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center">
                    <CheckCircle size={16} className="sm:w-5 sm:h-5 mr-2 sm:mr-3 text-primary-600" />
                    Order Status
                  </h4>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                      <span className="text-xs sm:text-sm text-slate-600 font-medium">Order Status</span>
                      <span className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-200' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        order.status === 'contacted' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                        order.status === 'verified' ? 'bg-green-100 text-green-800 border border-green-200' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                        'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {order.status?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                      <span className="text-xs sm:text-sm text-slate-600 font-medium">Order Date</span>
                      <span className="text-sm sm:text-base font-semibold text-slate-900">{formatDate(order.createdAt)}</span>
                    </div>
                    {order.shippingArrangement?.estimatedDelivery && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs sm:text-sm text-slate-600 font-medium flex items-center">
                          <Clock size={12} className="sm:w-4 sm:h-4 mr-1" />
                          Est. Delivery
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-green-600">{formatDate(order.shippingArrangement.estimatedDelivery)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
                <h4 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 text-center">Order Summary</h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center py-2 sm:py-3 border-b border-slate-600">
                    <span className="text-slate-300 font-medium text-sm sm:text-base">Subtotal</span>
                    <span className="font-semibold text-base sm:text-lg">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  
                  {order.shippingCost > 0 && (
                    <div className="flex justify-between items-center py-2 sm:py-3 border-b border-slate-600">
                      <span className="text-slate-300 font-medium text-sm sm:text-base">Shipping Cost</span>
                      <span className="font-semibold text-base sm:text-lg">{formatCurrency(order.shippingCost)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-3 sm:py-4 border-t border-slate-600 pt-3 sm:pt-4">
                    <span className="text-lg sm:text-xl font-bold">Grand Total</span>
                    <span className="text-xl sm:text-2xl font-bold text-primary-400">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 sm:mt-8 lg:mt-12 pt-4 sm:pt-6 lg:pt-8 border-t border-slate-200">
              <div className="text-center">
                <div className="flex justify-center items-center space-x-2 mb-3 sm:mb-4">
                  <Shield size={14} className="sm:w-5 sm:h-5 text-green-500" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">SECURE & TRUSTED TRANSACTION</span>
                </div>
                <p className="text-slate-600 mb-2 sm:mb-3 text-sm sm:text-lg font-medium">Thank you for shopping with ManJhay!</p>
                <p className="text-slate-500 mb-2 text-xs sm:text-sm">
                  For any questions regarding this invoice, please contact {companyInfo.phone} or {companyInfo.email}
                </p>
                <p className="text-slate-400 text-xs">
                  This is a computer-generated invoice. No signature required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white !important;
          }
          .print\\:bg-slate-900 {
            background: #0f172a !important;
            -webkit-print-color-adjust: exact;
          }
        }
        
        @media (max-width: 640px) {
          .invoice-container {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Invoice;
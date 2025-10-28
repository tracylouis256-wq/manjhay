import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Edit3, Save, X, ShoppingBag, Clock, Truck, CheckCircle, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      region: '',
      landmark: ''
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Check URL state for direct navigation to orders tab
  useEffect(() => {
    if (location.state?.activeTab === 'orders') {
      setActiveTab('orders');
    }
  }, [location.state]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          region: user.address?.region || '',
          landmark: user.address?.landmark || ''
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchUserOrders();
    }
  }, [activeTab]);

  const fetchUserOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await axios.get('/api/orders/user/my-orders');
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (result.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        toast.success('Password changed successfully!');
      }
    } catch (error) {
      // Error is handled in the context
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'verified': return <CheckCircle size={16} />;
      case 'contacted': return <Phone size={16} />;
      case 'shipped': return <Truck size={16} />;
      case 'delivered': return <CheckCircle size={16} />;
      default: return <ShoppingBag size={16} />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-gray-500 text-sm">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User size={18} className="inline-block mr-2" />
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'password'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Save size={18} className="inline-block mr-2" />
                Change Password
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ShoppingBag size={18} className="inline-block mr-2" />
                My Orders
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    {isEditing ? <X size={18} /> : <Edit3 size={18} />}
                    <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                  </button>
                </div>

                <form onSubmit={handleProfileUpdate}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="email"
                          value={profileData.email}
                          disabled
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Region */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Region
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          value={profileData.address.region}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            address: { ...profileData.address, region: e.target.value }
                          })}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Enter your region"
                        />
                      </div>
                    </div>

                    {/* City */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={profileData.address.city}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          address: { ...profileData.address, city: e.target.value }
                        })}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter your city"
                      />
                    </div>

                    {/* Street Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={profileData.address.street}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          address: { ...profileData.address, street: e.target.value }
                        })}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter your street address"
                      />
                    </div>

                    {/* Landmark */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Landmark
                      </label>
                      <input
                        type="text"
                        value={profileData.address.landmark}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          address: { ...profileData.address, landmark: e.target.value }
                        })}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="e.g., Near the main market, Behind the church"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                      >
                        <Save size={18} />
                        <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
                
                <form onSubmit={handlePasswordChange} className="max-w-md">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter current password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                        minLength={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter new password (min. 6 characters)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                        minLength={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      <Save size={18} />
                      <span>{loading ? 'Changing Password...' : 'Change Password'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* My Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">My Orders</h2>
                
                {ordersLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600 mb-4">Start shopping to see your orders here</p>
                    <button
                      onClick={() => navigate('/products')}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <ShoppingBag size={16} className="mr-2" />
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Order #{order._id.slice(-8)}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {formatDate(order.createdAt)} • GH₵{order.totalAmount.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(order.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">
                              <strong>Items:</strong> {order.items.length} product(s)
                            </p>
                            <p className="text-gray-600">
                              <strong>Delivery:</strong> {order.user.region}
                            </p>
                          </div>
                          <div className="text-right">
                            <button
                              onClick={() => navigate(`/orders/${order._id}`)}
                              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <Eye size={16} className="mr-1" />
                              View Details
                            </button>
                          </div>
                        </div>

                        {order.shippingCost > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Shipping:</strong> GH₵{order.shippingCost.toFixed(2)}
                            {order.finalAmount && (
                              <span className="ml-2">
                                <strong>Total:</strong> GH₵{order.finalAmount.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
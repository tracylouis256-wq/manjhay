import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Users, Package, TrendingUp, AlertTriangle, MessageSquare, UserCheck } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel with error handling for each request
      const [
        ordersResponse,
        inventoryResponse, 
        usersResponse,
        productsResponse,
        requestsResponse
      ] = await Promise.allSettled([
        axios.get('/api/orders?limit=5').catch(err => ({ data: { data: [], count: 0 } })),
        axios.get('/api/inventory/alerts').catch(err => ({ data: { data: [] } })),
        axios.get('/api/auth/admin/users/stats').catch(err => ({ data: { data: { totalUsers: 0 } } })),
        axios.get('/api/products?limit=100').catch(err => ({ data: { data: [] } })),
        axios.get('/api/user-requests?status=pending').catch(err => ({ data: { data: [] } }))
      ]);

      // Extract data from responses
      const ordersData = ordersResponse.status === 'fulfilled' ? ordersResponse.value.data : { data: [], count: 0 };
      const inventoryData = inventoryResponse.status === 'fulfilled' ? inventoryResponse.value.data : { data: [] };
      const usersData = usersResponse.status === 'fulfilled' ? usersResponse.value.data : { data: { totalUsers: 0 } };
      const productsData = productsResponse.status === 'fulfilled' ? productsResponse.value.data : { data: [] };
      const requestsData = requestsResponse.status === 'fulfilled' ? requestsResponse.value.data : { data: [] };

      // Calculate product stats
      const totalProducts = productsData.data?.length || 0;
      const inStockProducts = productsData.data?.filter(p => p.inStock).length || 0;
      const outOfStockProducts = productsData.data?.filter(p => !p.inStock).length || 0;

      // Calculate revenue
      const revenue = ordersData.data?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0;

      setStats({
        totalOrders: ordersData.count || 0,
        totalUsers: usersData.data?.totalUsers || 0,
        totalProducts,
        inStockProducts,
        outOfStockProducts,
        revenue
      });

      setRecentOrders(ordersData.data || []);
      setLowStockProducts(inventoryData.data?.slice(0, 5) || []);
      setPendingRequests(requestsData.data?.length || 0);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load some dashboard data');
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome to ManJhay Admin Panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500 rounded-full text-white mr-4">
                <ShoppingBag size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-500 rounded-full text-white mr-4">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-500 rounded-full text-white mr-4">
                <Package size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-500 rounded-full text-white mr-4">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">GH₵{stats.revenue?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full text-green-600 mr-4">
                <Package size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">In Stock Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inStockProducts || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full text-red-600 mr-4">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.outOfStockProducts || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-full text-indigo-600 mr-4">
                <MessageSquare size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
            </div>
            <div className="p-6">
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="flex justify-between items-center py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">Order #{order._id?.slice(-8) || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{order.user?.name || 'Customer'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">GH₵{order.totalAmount?.toFixed(2) || '0.00'}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent orders</p>
              )}
              <Link
                to="/admin/order-management"
                className="block text-center mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Orders
              </Link>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Low Stock Alerts</h2>
                {lowStockProducts.length > 0 && (
                  <AlertTriangle className="text-yellow-500" size={20} />
                )}
              </div>
            </div>
            <div className="p-6">
              {lowStockProducts.length > 0 ? (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div key={product._id} className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          Only {product.inventory?.quantity || 0} units left
                        </p>
                      </div>
                      <Link
                        to="/admin/inventory-management"
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Restock
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No low stock alerts</p>
              )}
              <Link
                to="/admin/inventory-management"
                className="block text-center mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage Inventory
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions - Updated to include User Management */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/admin/product-management"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg mr-4">
                <Package size={24} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Manage Products</h3>
            </div>
            <p className="text-gray-600">Add, edit, or remove products from your catalog</p>
          </Link>

          <Link
            to="/admin/order-management"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg mr-4">
                <ShoppingBag size={24} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">View Orders</h3>
            </div>
            <p className="text-gray-600">Process and manage customer orders</p>
          </Link>

          <Link
            to="/admin/inventory-management"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 rounded-lg mr-4">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Inventory</h3>
            </div>
            <p className="text-gray-600">Monitor stock levels and alerts</p>
          </Link>

          <Link
            to="/admin/user-management"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg mr-4">
                <UserCheck size={24} className="text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            </div>
            <p className="text-gray-600">Manage and monitor all user accounts</p>
          </Link>
        </div>

        {/* Additional Row for User Requests */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/admin/user-requests"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow relative"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-pink-100 rounded-lg mr-4">
                <MessageSquare size={24} className="text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">User Requests</h3>
            </div>
            <p className="text-gray-600">Manage custom product requests</p>
            {pendingRequests > 0 && (
              <span className="absolute top-4 right-4 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {pendingRequests}
              </span>
            )}
          </Link>
        </div>

        {/* Quick Links - Updated to include User Management */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              to="/admin/product-management/new" 
              className="text-blue-600 hover:text-blue-700 font-medium p-3 bg-blue-50 rounded-lg text-center"
            >
              + Add New Product
            </Link>
            <Link 
              to="/admin/order-management?status=pending" 
              className="text-orange-600 hover:text-orange-700 font-medium p-3 bg-orange-50 rounded-lg text-center"
            >
              ⏳ Pending Orders
            </Link>
            <Link 
              to="/admin/inventory-management" 
              className="text-red-600 hover:text-red-700 font-medium p-3 bg-red-50 rounded-lg text-center"
            >
              🚨 Stock Alerts
            </Link>
            <Link 
              to="/admin/user-management" 
              className="text-indigo-600 hover:text-indigo-700 font-medium p-3 bg-indigo-50 rounded-lg text-center"
            >
              👥 User Management
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
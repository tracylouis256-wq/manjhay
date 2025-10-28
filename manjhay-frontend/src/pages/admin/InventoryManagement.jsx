import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Edit, TrendingUp, Plus, RefreshCw, ShoppingBag } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';

const InventoryManagement = () => {
  const [products, setProducts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });
  const [editingStock, setEditingStock] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      
      // Fetch all products
      const productsResponse = await axios.get('/api/products?limit=100');
      const productsData = productsResponse.data.data || productsResponse.data.products || [];
      console.log('Fetched products:', productsData); // Debug
      setProducts(productsData);

      // If we have products, try to fetch inventory data
      if (productsData.length > 0) {
        try {
          const [statsResponse, alertsResponse] = await Promise.all([
            axios.get('/api/inventory/stats'),
            axios.get('/api/inventory/alerts')
          ]);
          
          setStats(statsResponse.data.data || calculateStatsFromProducts(productsData));
          setLowStockAlerts(alertsResponse.data.data || []);
        } catch (inventoryError) {
          console.log('Inventory endpoints not available, using product data:', inventoryError);
          // Calculate from products data
          setStats(calculateStatsFromProducts(productsData));
          setLowStockAlerts(calculateAlertsFromProducts(productsData));
        }
      } else {
        // No products, set empty state
        setStats({
          totalProducts: 0,
          inStock: 0,
          lowStock: 0,
          outOfStock: 0,
          totalValue: 0
        });
        setLowStockAlerts([]);
      }

    } catch (error) {
      console.error('Error fetching inventory data:', error);
      toast.error('Failed to fetch inventory data');
      
      // Set empty state
      setStats({
        totalProducts: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0
      });
      setLowStockAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatsFromProducts = (products) => {
    const totalProducts = products.length;
    const inStock = products.filter(p => p.inventory?.quantity > 0).length;
    const lowStock = products.filter(p => 
      p.inventory?.quantity > 0 && p.inventory?.quantity <= (p.inventory?.lowStockThreshold || 10)
    ).length;
    const outOfStock = products.filter(p => p.inventory?.quantity === 0).length;
    const totalValue = products.reduce((sum, product) => {
      return sum + (product.price * (product.inventory?.quantity || 0));
    }, 0);

    return {
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
      totalValue
    };
  };

  const calculateAlertsFromProducts = (products) => {
    return products.filter(product => 
      product.inventory?.quantity <= (product.inventory?.lowStockThreshold || 10)
    );
  };

  const updateStockQuantity = async (productId) => {
    try {
      const quantity = parseInt(newQuantity);
      if (isNaN(quantity) || quantity < 0) {
        toast.error('Please enter a valid quantity');
        return;
      }

      await axios.patch(`/api/inventory/${productId}/quantity`, {
        quantity: quantity
      });
      
      toast.success('Stock quantity updated successfully');
      setEditingStock(null);
      setNewQuantity('');
      fetchInventoryData(); // Refresh data
    } catch (error) {
      console.error('Update stock error:', error);
      toast.error('Failed to update stock quantity');
    }
  };

  const getStockStatus = (quantity, lowStockThreshold = 10) => {
    if (quantity === 0) return { status: 'out-of-stock', color: 'bg-red-100 text-red-800' };
    if (quantity <= lowStockThreshold) return { status: 'low-stock', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'in-stock', color: 'bg-green-100 text-green-800' };
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600">Monitor and manage product stock levels</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchInventoryData}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw size={20} />
              <span>Refresh</span>
            </button>
            <Link
              to="/admin/product-management"
              className="bg-[#f97316] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#ea580c] transition-colors flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Products</span>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500 rounded-full text-white mr-4">
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
              <div className="p-3 bg-green-500 rounded-full text-white mr-4">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-500 rounded-full text-white mr-4">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-500 rounded-full text-white mr-4">
                <ShoppingBag size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-yellow-600 mr-2" size={24} />
              <h2 className="text-xl font-semibold text-yellow-800">Low Stock Alerts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockAlerts.map((product) => (
                <div key={product._id} className="bg-white rounded-lg p-4 border border-yellow-200">
                  <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-700 font-medium">
                      Only {product.inventory?.quantity || 0} units left
                    </span>
                    <button
                      onClick={() => {
                        setEditingStock(product._id);
                        setNewQuantity(product.inventory?.quantity || 0);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Update Stock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Products Inventory */}
        {products.length > 0 ? (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">All Products ({products.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Low Stock Threshold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => {
                    const stockStatus = getStockStatus(
                      product.inventory?.quantity || 0,
                      product.inventory?.lowStockThreshold || 10
                    );
                    
                    return (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={product.image?.url}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded mr-3"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500 capitalize">
                                {product.category}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.inventory?.sku || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingStock === product._id ? (
                            <input
                              type="number"
                              value={newQuantity}
                              onChange={(e) => setNewQuantity(e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded"
                              min="0"
                            />
                          ) : (
                            product.inventory?.quantity || 0
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.inventory?.lowStockThreshold || 10}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                            {stockStatus.status === 'out-of-stock' && 'Out of Stock'}
                            {stockStatus.status === 'low-stock' && 'Low Stock'}
                            {stockStatus.status === 'in-stock' && 'In Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {editingStock === product._id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => updateStockQuantity(product._id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingStock(null)}
                                className="text-gray-600 hover:text-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingStock(product._id);
                                setNewQuantity(product.inventory?.quantity || 0);
                              }}
                              className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                            >
                              <Edit size={14} />
                              <span>Update</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-500 mb-6">You haven't added any products to your inventory yet.</p>
            <Link
              to="/admin/product-management"
              className="bg-[#f97316] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#ea580c] transition-colors inline-flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Your First Product</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManagement;
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Upload, X, Ruler } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'casual',
    lowStockThreshold: '10',
    sku: '',
    featured: false,
    sizeVariants: [
      { size: '36', stock: '0' },
      { size: '37', stock: '0' },
      { size: '38', stock: '0' },
      { size: '39', stock: '0' },
      { size: '40', stock: '0' },
      { size: '41', stock: '0' },
      { size: '42', stock: '0' },
      { size: '43', stock: '0' },
      { size: '44', stock: '0' },
      { size: '45', stock: '0' }
    ]
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const CLOUDINARY_CONFIG = {
    cloudName: 'dbupf4y3f',
    uploadPreset: 'manjhay-products'
  };

  const sizeOptions = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products?limit=100');
      setProducts(response.data.data || []);
      
      // Debug: Check first product
      if (response.data.data && response.data.data.length > 0) {
        console.log('📦 Product Data from API:', response.data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      price: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (JPEG, PNG, etc.)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const generateSKU = () => {
    const prefix = 'MJ';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${random}`;
  };

  const uploadToCloudinary = async (file) => {
    try {
      console.log('Uploading to Cloudinary with config:', CLOUDINARY_CONFIG);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary API error:', errorData);
        throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Cloudinary upload successful:', data);
      return data;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(error.message || 'Failed to upload image. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Product description is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }

    // Calculate total quantity from size variants
    const totalQuantity = formData.sizeVariants.reduce((total, variant) => {
      return total + (parseInt(variant.stock) || 0);
    }, 0);

    if (totalQuantity <= 0) {
      toast.error('Please add stock to at least one size');
      return;
    }

    if (!imageFile && !editingProduct) {
      toast.error('Product image is required');
      return;
    }

    setSubmitting(true);

    try {
      let imageData = {};
      
      if (imageFile) {
        toast.info('Uploading image to Cloudinary...');
        const cloudinaryResult = await uploadToCloudinary(imageFile);
        // ✅ FIXED: Use proper image structure that matches your backend model
        imageData = {
          public_id: cloudinaryResult.public_id,
          url: cloudinaryResult.secure_url // This should be a string, not an object
        };
        toast.success('Image uploaded successfully!');
      } else if (editingProduct && imagePreview) {
        // ✅ FIXED: Use existing image data properly
        imageData = {
          public_id: editingProduct.image.public_id,
          url: editingProduct.image.url
        };
      }

      // ✅ FIXED: Prepare product data to match the model
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        inventory: {
          quantity: totalQuantity,
          lowStockThreshold: parseInt(formData.lowStockThreshold),
          sku: formData.sku || generateSKU()
        },
        featured: formData.featured,
        image: imageData, // This should be an object with public_id and url (strings)
        sizeVariants: formData.sizeVariants.map(variant => ({
          size: variant.size,
          stock: parseInt(variant.stock) || 0
        }))
      };

      console.log('📤 Submitting product data:', productData);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
        setSubmitting(false);
        return;
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      let response;
      if (editingProduct) {
        response = await axios.put(`/api/products/${editingProduct._id}`, productData, config);
        toast.success('Product updated successfully');
      } else {
        response = await axios.post('/api/products/cloudinary', productData, config);
        toast.success('Product created successfully');
      }

      console.log('✅ Product saved successfully:', response.data);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('❌ Error saving product:', error);
      console.error('Full error response:', error.response);
      
      let errorMessage = 'Failed to save product. Please check all fields and try again.';
      
      if (error.message.includes('Cloudinary')) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'casual',
      lowStockThreshold: '10',
      sku: '',
      featured: false,
      sizeVariants: [
        { size: '36', stock: '0' },
        { size: '37', stock: '0' },
        { size: '38', stock: '0' },
        { size: '39', stock: '0' },
        { size: '40', stock: '0' },
        { size: '41', stock: '0' },
        { size: '42', stock: '0' },
        { size: '43', stock: '0' },
        { size: '44', stock: '0' },
        { size: '45', stock: '0' }
      ]
    });
    setImageFile(null);
    setImagePreview('');
    setEditingProduct(null);
    setShowForm(false);
    setSubmitting(false);
  };

  // ✅ FIXED: Handle missing sizeVariants when editing
  const handleEdit = (product) => {
    console.log('📝 Editing product:', product);
    setEditingProduct(product);
    
    // Handle missing sizeVariants and create proper structure
    let sizeVariantsData = [];
    
    if (product.sizeVariants && product.sizeVariants.length > 0) {
      // Use existing sizeVariants
      sizeVariantsData = product.sizeVariants.map(variant => ({
        size: variant.size,
        stock: variant.stock.toString()
      }));
    } else {
      // Create default size variants structure
      sizeVariantsData = [
        { size: '36', stock: '0' },
        { size: '37', stock: '0' },
        { size: '38', stock: '0' },
        { size: '39', stock: '0' },
        { size: '40', stock: '0' },
        { size: '41', stock: '0' },
        { size: '42', stock: '0' },
        { size: '43', stock: '0' },
        { size: '44', stock: '0' },
        { size: '45', stock: '0' }
      ];
    }

    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      lowStockThreshold: product.inventory?.lowStockThreshold?.toString() || '10',
      sku: product.inventory?.sku || '',
      featured: product.featured || false,
      sizeVariants: sizeVariantsData
    });
    setImagePreview(product.image?.url || '');
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete product';
      toast.error(errorMessage);
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600">Manage your product catalog</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#f97316] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#ea580c] transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Product</span>
          </button>
        </div>

        {/* Product Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={submitting}
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image {!editingProduct && '*'}
                  </label>
                  <div className="flex items-center space-x-4">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={submitting}
                      />
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                        <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">
                          {imageFile ? 'Change Image' : 'Upload Product Image'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Max 5MB • PNG, JPG, JPEG</p>
                      </div>
                    </label>
                  </div>
                  {submitting && imageFile && (
                    <p className="text-sm text-blue-600 mt-2">Uploading image to Cloudinary...</p>
                  )}
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] disabled:bg-gray-100"
                      placeholder="e.g., Black Leather Slippers"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₵) * - Exact amount displayed to customers
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handlePriceChange}
                      step="0.01"
                      min="0"
                      required
                      disabled={submitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] disabled:bg-gray-100"
                      placeholder="45.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">This exact amount will be shown to customers</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    required
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] disabled:bg-gray-100"
                    placeholder="Describe the product features, comfort, and materials..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      disabled={submitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] disabled:bg-gray-100"
                    >
                      <option value="casual">Casual</option>
                      <option value="formal">Formal</option>
                      <option value="sports">Sports</option>
                      <option value="beach">Beach</option>
                      <option value="traditional">Traditional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      placeholder="Auto-generated if empty"
                      disabled={submitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* Size Variants Management */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Size Variants & Stock</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Set stock quantity for each size. At least one size must have stock.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {formData.sizeVariants.map((variant, index) => (
                      <div key={variant.size} className="border rounded-lg p-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Size {variant.size}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={variant.stock}
                          onChange={(e) => {
                            const newVariants = [...formData.sizeVariants];
                            newVariants[index].stock = e.target.value;
                            setFormData(prev => ({ ...prev, sizeVariants: newVariants }));
                          }}
                          disabled={submitting}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] disabled:bg-gray-100"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Total Stock: {formData.sizeVariants.reduce((total, variant) => total + (parseInt(variant.stock) || 0), 0)} units
                  </p>
                </div>

                {/* Low Stock Threshold */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      name="lowStockThreshold"
                      value={formData.lowStockThreshold}
                      onChange={handleInputChange}
                      min="1"
                      disabled={submitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* Featured Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className="h-4 w-4 text-[#f97316] focus:ring-[#f97316] border-gray-300 rounded disabled:bg-gray-100"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Feature this product on homepage
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={submitting}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors font-semibold flex items-center space-x-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Package size={18} />
                    )}
                    <span>
                      {submitting 
                        ? 'Saving...' 
                        : (editingProduct ? 'Update Product' : 'Create Product')
                      }
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products List */}
        {products.length > 0 ? (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Products ({products.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sizes Available
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
                    // ✅ FIXED: Get available sizes from sizeVariants
                    const availableSizes = product.sizeVariants 
                      ? product.sizeVariants.filter(s => s.stock > 0).map(s => s.size)
                      : [];
                    
                    // ✅ FIXED: Calculate total quantity
                    const totalQuantity = product.sizeVariants 
                      ? product.sizeVariants.reduce((total, variant) => total + (variant.stock || 0), 0)
                      : product.inventory?.quantity || 0;
                    
                    return (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={product.image?.url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg mr-3"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                SKU: {product.inventory?.sku || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₵{product.price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {totalQuantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {availableSizes.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {availableSizes.map(size => (
                                <span key={size} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                  {size}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-red-500 text-xs">No stock</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            totalQuantity > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {totalQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                          >
                            <Edit size={16} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="text-red-600 hover:text-red-700 flex items-center space-x-1"
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Products Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start building your product catalog by adding your first pair of slippers.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#f97316] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#ea580c] transition-colors inline-flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Your First Product</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;
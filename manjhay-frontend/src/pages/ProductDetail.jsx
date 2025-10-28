import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');

  // ✅ FIXED: Get available sizes from sizeVariants
  const availableSizes = product?.sizeVariants 
    ? product.sizeVariants
        .filter(variant => variant.stock > 0)
        .map(variant => variant.size)
    : [];

  // ✅ Check if product is in stock (any size has stock)
  const isInStock = availableSizes.length > 0;

  // ✅ Get out of stock sizes
  const outOfStockSizes = product?.sizeVariants 
    ? product.sizeVariants
        .filter(variant => variant.stock === 0)
        .map(variant => variant.size)
    : [];

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/api/products/${id}`);
      setProduct(response.data.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    // If product has sizes, require selection
    if (availableSizes.length > 0 && !selectedSize) {
      toast.error('Please select a size before adding to cart');
      return;
    }
    
    addToCart(product, quantity, selectedSize);
    const sizeText = selectedSize ? ` (Size ${selectedSize})` : '';
    toast.success(`${quantity} ${product.name}${sizeText} added to cart!`);
  };

  // Get stock for selected size
  const getSelectedSizeStock = () => {
    if (!selectedSize) return 0;
    const variant = product.sizeVariants.find(v => v.size === selectedSize);
    return variant ? variant.stock : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <button
            onClick={() => navigate('/products')}
            className="text-[#f97316] hover:text-[#ea580c] font-medium"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/products')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to Products</span>
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <div>
              <img
                src={product.image?.url || '/api/placeholder/400/400'}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                <div className="flex items-center space-x-4 mb-4">
                  <span className="text-2xl font-bold text-[#f97316]">
                    GH₵{product.price}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isInStock 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {isInStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Product Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-700">Category:</span>
                  <span className="text-gray-600 capitalize">{product.category}</span>
                </div>

                {/* ✅ UPDATED: Show available sizes count without stock numbers */}
                {availableSizes.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-700">Available Sizes:</span>
                    <span className="text-gray-600">
                      {availableSizes.length} sizes available
                    </span>
                  </div>
                )}

                {product.featured && (
                  <div className="flex items-center space-x-2">
                    <Star size={16} className="text-yellow-500 fill-current" />
                    <span className="text-gray-600">Featured Product</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center space-x-4">
                <span className="font-semibold text-gray-700">Quantity:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!isInStock}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => {
                      const maxQuantity = selectedSize ? getSelectedSizeStock() : product.quantity;
                      setQuantity(Math.min(maxQuantity, quantity + 1));
                    }}
                    disabled={!isInStock || (selectedSize && quantity >= getSelectedSizeStock())}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* ✅ UPDATED: Size Selector - Shows available sizes WITHOUT stock numbers */}
              {availableSizes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold text-gray-700">Size:</span>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setSelectedSize(size);
                            // Reset quantity to 1 when changing size
                            setQuantity(1);
                          }}
                          className={`w-12 h-12 rounded border text-sm font-medium transition-colors ${
                            selectedSize === size
                              ? 'bg-[#f97316] text-white border-[#f97316]'
                              : 'border-gray-300 text-gray-700 hover:border-[#f97316] hover:bg-orange-50'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Show out of stock sizes as disabled */}
                  {outOfStockSizes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-gray-500 mr-2">Out of stock:</span>
                      {outOfStockSizes.map(size => (
                        <span
                          key={size}
                          className="w-10 h-10 rounded border border-gray-200 text-gray-400 text-sm flex items-center justify-center bg-gray-100 cursor-not-allowed"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {availableSizes.length > 0 && !selectedSize && (
                <p className="text-sm text-red-500">Please select a size to add to cart</p>
              )}

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!isInStock || (availableSizes.length > 0 && !selectedSize)}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-semibold transition-colors ${
                  isInStock && (!availableSizes.length > 0 || selectedSize)
                    ? 'bg-[#f97316] text-white hover:bg-[#ea580c] transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart size={20} />
                <span>
                  {!isInStock 
                    ? 'Out of Stock' 
                    : availableSizes.length > 0 && !selectedSize
                    ? 'Select Size'
                    : 'Add to Cart'
                  }
                </span>
              </button>

              {/* ✅ UPDATED: Low stock warning (without exact numbers) */}
              {selectedSize && getSelectedSizeStock() < 5 && getSelectedSizeStock() > 0 && (
                <p className="text-sm text-orange-600">
                  ⚠️ Low stock for size {selectedSize}!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
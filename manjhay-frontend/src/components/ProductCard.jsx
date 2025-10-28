import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');

  // Get available sizes from sizeVariants
  const availableSizes = product.sizeVariants 
    ? product.sizeVariants.filter(s => s.stock > 0).map(s => s.size)
    : [];

  const hasSizes = availableSizes.length > 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If product has sizes, require selection
    if (hasSizes && !selectedSize) {
      toast.error('Please select a size before adding to cart');
      return;
    }
    
    addToCart(product, 1, selectedSize);
    const sizeText = selectedSize ? ` (Size ${selectedSize})` : '';
    toast.success(`${product.name}${sizeText} added to cart!`);
  };

  // Safe image URL handling
  const getImageUrl = () => {
    if (imageError) return '/api/placeholder/300/300';
    
    if (product.image?.url) return product.image.url;
    if (product.images?.[0]?.url) return product.images[0].url;
    if (product.images?.[0]) return product.images[0];
    if (product.image) return product.image;
    
    return '/api/placeholder/300/300';
  };

  // Safe price handling
  const getPrice = () => {
    if (typeof product.price === 'number') return product.price;
    if (product.price) return parseFloat(product.price);
    return 0;
  };

  // Safe stock handling
  const isInStock = () => {
    if (typeof product.inStock === 'boolean') return product.inStock;
    if (typeof product.quantity === 'number') return product.quantity > 0;
    if (product.sizeVariants) {
      return product.sizeVariants.some(variant => variant.stock > 0);
    }
    return true;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 group">
      <Link to={`/products/${product._id}`} className="block">
        <div className="relative overflow-hidden bg-gray-100">
          <img
            src={getImageUrl()}
            alt={product.name || 'Product image'}
            className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
            onError={handleImageError}
            loading="lazy"
          />
          
          {/* Quick Actions Overlay - Transparent */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex space-x-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <Link
                to={`/products/${product._id}`}
                className="bg-white/90 backdrop-blur-sm text-gray-900 p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye size={18} />
              </Link>
              <button 
                onClick={handleAddToCart}
                disabled={!isInStock() || (hasSizes && !selectedSize)}
                className={`p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
                  isInStock() && (!hasSizes || selectedSize)
                    ? 'bg-[#f97316]/90 text-white hover:bg-[#f97316]' 
                    : 'bg-gray-400/90 text-gray-200 cursor-not-allowed'
                }`}
              >
                <ShoppingCart size={18} />
              </button>
            </div>
          </div>

          {/* Stock Badge */}
          {!isInStock() && (
            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
              Out of Stock
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/products/${product._id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-[#f97316] transition-colors line-clamp-2 mb-2">
            {product.name || 'Unnamed Product'}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[40px]">
          {product.description || 'No description available.'}
        </p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xl font-bold text-[#f97316]">
            GH₵{getPrice().toLocaleString()}
          </span>
          
          {product.category && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
              {product.category}
            </span>
          )}
        </div>

        {/* Size Selector - Only show if product has size variants */}
        {hasSizes && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Size:
            </label>
            <div className="flex flex-wrap gap-1">
              {['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'].map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSize(size);
                  }}
                  className={`w-8 h-8 rounded border text-xs font-medium transition-colors ${
                    selectedSize === size
                      ? 'bg-[#f97316] text-white border-[#f97316]'
                      : availableSizes.includes(size)
                      ? 'border-gray-300 text-gray-700 hover:border-[#f97316] hover:bg-orange-50'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-100'
                  }`}
                  disabled={!availableSizes.includes(size)}
                >
                  {size}
                </button>
              ))}
            </div>
            {!selectedSize && hasSizes && (
              <p className="text-xs text-red-500 mt-1">Select size to add to cart</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${
            isInStock() ? 'text-green-600' : 'text-red-600'
          }`}>
            {isInStock() 
              ? hasSizes 
                ? `${availableSizes.length} sizes available` 
                : 'Available'
              : 'Out of Stock'
            }
          </span>
          
          {/* Show "Add to Cart" button with proper states */}
          <button
            onClick={handleAddToCart}
            disabled={!isInStock() || (hasSizes && !selectedSize)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              isInStock() && (!hasSizes || selectedSize)
                ? 'bg-[#f97316] text-white hover:bg-[#ea580c] transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart size={16} />
            <span className="text-sm font-medium">
              {!isInStock() 
                ? 'Out of Stock' 
                : hasSizes && !selectedSize
                ? 'Select Size'
                : 'Add to Cart'
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
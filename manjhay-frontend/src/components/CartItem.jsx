import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(item._id, item.selectedSize);
    } else {
      updateQuantity(item._id, item.selectedSize, newQuantity);
    }
  };

  const handleRemove = () => {
    removeFromCart(item._id, item.selectedSize);
  };

  return (
    <div className="flex items-center space-x-4 py-4 border-b border-gray-200">
      <img
        src={item.image.url}
        alt={item.name}
        className="w-16 h-16 object-cover rounded-lg"
      />
      
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{item.name}</h3>
        <p className="text-gray-600 text-sm">GH₵{item.price}</p>
        <p className="text-gray-500 text-sm capitalize">{item.category}</p>
        {item.selectedSize && (
          <p className="text-gray-500 text-sm">Size: {item.selectedSize}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
          aria-label="Decrease quantity"
        >
          <Minus size={16} />
        </button>
        
        <span className="w-8 text-center font-medium text-gray-900">
          {item.quantity}
        </span>
        
        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
          aria-label="Increase quantity"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="text-right">
        <p className="font-semibold text-gray-900">
          GH₵{(item.price * item.quantity).toFixed(2)}
        </p>
        <button
          onClick={handleRemove}
          className="text-red-600 hover:text-red-700 text-sm mt-1 flex items-center space-x-1 transition-colors duration-200"
          aria-label="Remove item"
        >
          <Trash2 size={14} />
          <span>Remove</span>
        </button>
      </div>
    </div>
  );
};

export default CartItem;
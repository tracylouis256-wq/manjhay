import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  const handleRemoveItem = (itemId, selectedSize = null) => {
    removeFromCart(itemId, selectedSize);
  };

  const handleQuantityUpdate = (itemId, selectedSize = null, newQuantity) => {
    updateQuantity(itemId, selectedSize, newQuantity);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Start shopping to add items to your cart</p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#f97316] hover:bg-[#ea580c] transition-colors duration-200"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors duration-200"
          >
            Clear Cart
          </button>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="flow-root">
              <ul className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <li key={`${item._id}-${item.selectedSize || 'no-size'}`} className="py-6 flex">
                    <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                      <img
                        src={item.image?.url || '/api/placeholder/100/100'}
                        alt={item.name}
                        className="w-full h-full object-center object-cover"
                      />
                    </div>

                    <div className="ml-4 flex-1 flex flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>{item.name}</h3>
                          <p className="ml-4">GH₵{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 capitalize">{item.category}</p>
                        {item.selectedSize && (
                          <p className="text-sm text-gray-500">Size: {item.selectedSize}</p>
                        )}
                      </div>
                      <div className="flex-1 flex items-end justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityUpdate(item._id, item.selectedSize, item.quantity - 1)}
                            className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-medium w-8 text-center text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityUpdate(item._id, item.selectedSize, item.quantity + 1)}
                            className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
                            aria-label="Increase quantity"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item._id, item.selectedSize)}
                          className="font-medium text-red-600 hover:text-red-500 flex items-center space-x-1 transition-colors duration-200"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                          <span></span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-gray-200 py-6">
              <div className="flex justify-between text-base font-medium text-gray-900">
                <p>Subtotal</p>
                <p>GH₵{getCartTotal().toFixed(2)}</p>
              </div>
              <p className="mt-0.5 text-sm text-gray-500">
                Shipping and taxes calculated at checkout.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-[#f97316] border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-[#ea580c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f97316] transition-colors duration-200"
                >
                  Proceed to Checkout
                </button>
              </div>
              <div className="mt-6 flex justify-center text-sm text-center text-gray-500">
                <p>
                  or{' '}
                  <Link
                    to="/products"
                    className="text-[#f97316] font-medium hover:text-[#ea580c] transition-colors duration-200"
                  >
                    Continue Shopping<span aria-hidden="true"> &rarr;</span>
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
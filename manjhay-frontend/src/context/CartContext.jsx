import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('manjhay_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('manjhay_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1, selectedSize = null) => {
    // If product has size variants, require size selection
    if (product.inventory.sizes && product.inventory.sizes.length > 0) {
      if (!selectedSize) {
        toast.error('Please select a size before adding to cart');
        return;
      }
      
      // Check if selected size is available
      const sizeAvailable = product.inventory.sizes.find(
        s => s.size === selectedSize && s.stock > 0
      );
      
      if (!sizeAvailable) {
        toast.error(`Size ${selectedSize} is unavailable for ${product.name}`);
        return;
      }
    }

    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item._id === product._id && item.selectedSize === selectedSize
      );
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
        const sizeText = selectedSize ? ` (Size ${selectedSize})` : '';
        toast.success(`Updated ${product.name}${sizeText} quantity in cart!`);
        return updatedItems;
      } else {
        const newItems = [...prevItems, { 
          ...product, 
          quantity,
          selectedSize 
        }];
        const sizeText = selectedSize ? ` (Size ${selectedSize})` : '';
        toast.success(`${product.name}${sizeText} added to cart!`);
        return newItems;
      }
    });
  };

  const removeFromCart = (productId, selectedSize = null) => {
    setCartItems(prevItems => {
      const item = prevItems.find(item => 
        item._id === productId && item.selectedSize === selectedSize
      );
      const newItems = prevItems.filter(item => 
        !(item._id === productId && item.selectedSize === selectedSize)
      );
      if (item) {
        const sizeText = selectedSize ? ` (Size ${selectedSize})` : '';
        toast.info(`${item.name}${sizeText} removed from cart`);
      }
      return newItems;
    });
  };

  const updateQuantity = (productId, selectedSize = null, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId, selectedSize);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item._id === productId && item.selectedSize === selectedSize 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    toast.info('Cart cleared');
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
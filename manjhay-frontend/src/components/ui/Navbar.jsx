import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  LogOut, 
  Package, 
  Settings, 
  Box, 
  Users, 
  ShoppingBag, 
  Plus,
  Home,
  Info,
  ClipboardList,
  BarChart3,
  FileText,
  History,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import NotificationBell from '../NotificationBell';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { getCartItemsCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  // Check if user is admin based on role field
  const isAdmin = user?.role === 'admin';

  const navItemClass = "text-gray-600 font-medium hover:text-[#f97316] transition-colors duration-150 p-2 rounded-lg";
  const activeNavItemClass = "text-[#f97316] font-semibold bg-orange-50 border-b-2 border-[#f97316]";
  const mobileNavItemClass = "flex items-center space-x-2 px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md";
  const adminNavItemClass = "text-purple-600 font-medium hover:text-purple-700 transition-colors duration-150 p-2 rounded-lg";

  // Check if current path matches
  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="group flex items-center space-x-3 transition-all duration-300 hover:scale-105">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#f97316] to-[#ea580c] rounded-full blur-sm group-hover:blur-md transition-all duration-300 opacity-70"></div>
              <div className="relative bg-white p-2 rounded-full shadow-lg border border-orange-100">
                <Package size={28} className="text-[#f97316] drop-shadow-sm" />
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-[#f97316] via-[#ea580c] to-orange-600 bg-clip-text text-transparent tracking-tight leading-tight">
                ManJhay
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-gray-600 tracking-[0.2em] uppercase bg-gradient-to-r from-orange-100 to-amber-50 px-2 py-0.5 rounded-full border border-orange-200">
                Quality Slippers
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`${navItemClass} ${isActivePath('/') ? activeNavItemClass : ''}`}
            >
              <div className="flex items-center space-x-1">
                <Home size={18} />
                <span>Home</span>
              </div>
            </Link>
            
            <Link 
              to="/products" 
              className={`${navItemClass} ${isActivePath('/products') ? activeNavItemClass : ''}`}
            >
              <div className="flex items-center space-x-1">
                <Box size={18} />
                <span>Products</span>
              </div>
            </Link>
            
            <Link 
              to="/about" 
              className={`${navItemClass} ${isActivePath('/about') ? activeNavItemClass : ''}`}
            >
              <div className="flex items-center space-x-1">
                <Info size={18} />
                <span>About</span>
              </div>
            </Link>
            
            {/* Request Product Link - Only show for authenticated users */}
            {isAuthenticated && (
              <Link 
                to="/request-product" 
                className={`${navItemClass} ${isActivePath('/request-product') ? activeNavItemClass : ''}`}
              >
                <div className="flex items-center space-x-1">
                  <Plus size={18} />
                  <span>Request Product</span>
                </div>
              </Link>
            )}
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Admin Panel Link - Only for admins */}
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className={`${adminNavItemClass} ${isActivePath('/admin') ? 'bg-purple-50 border-b-2 border-purple-600' : ''}`}
                  >
                    <div className="flex items-center space-x-1">
                      <Settings size={18} />
                      <span>Admin Panel</span>
                    </div>
                  </Link>
                )}
                
                {/* Cart Icon */}
                <Link 
                  to="/cart" 
                  className={`relative text-gray-600 hover:text-[#f97316] transition-colors p-2 rounded-full ${isActivePath('/cart') ? 'text-[#f97316] bg-orange-50' : ''}`}
                >
                  <ShoppingCart size={24} />
                  {getCartItemsCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#f97316] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {getCartItemsCount()}
                    </span>
                  )}
                </Link>
                
                {/* Notification Bell */}
                <NotificationBell />
                
                {/* User Dropdown */}
                <div className="relative group">
                  <button className={`flex items-center space-x-2 text-gray-700 hover:text-[#f97316] transition-colors p-2 rounded-full border border-transparent group-hover:border-[#f97316]/20 ${isActivePath('/profile') ? 'text-[#f97316] bg-orange-50' : ''}`}>
                    <User size={20} />
                    <span className="text-sm font-medium hidden lg:inline">
                      {user?.name || 'Account'}
                      {isAdmin && <span className="ml-1 text-xs text-purple-600">(Admin)</span>}
                    </span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 border border-gray-100 z-50">
                    {/* User Links */}
                    <Link 
                      to="/profile" 
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={closeMobileMenu}
                    >
                      <User size={16} />
                      <span>Profile</span>
                    </Link>
                    
                    {/* FIXED: My Orders link - goes to profile with orders tab active */}
                    <Link 
                      to="/profile"
                      state={{ activeTab: 'orders' }}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={closeMobileMenu}
                    >
                      <History size={16} />
                      <span>My Orders</span>
                    </Link>
                    
                    {/* FIXED: Notifications link */}
                    <Link 
                      to="/notifications" 
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={closeMobileMenu}
                    >
                      <Bell size={16} />
                      <span>Notifications</span>
                    </Link>
                    
                    {/* Admin dropdown items */}
                    {isAdmin && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <div className="px-3 py-1">
                          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Admin Panel</span>
                        </div>
                        <Link 
                          to="/admin" 
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50"
                          onClick={closeMobileMenu}
                        >
                          <BarChart3 size={16} />
                          <span>Dashboard</span>
                        </Link>
                        <Link 
                          to="/admin/product-management" 
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={closeMobileMenu}
                        >
                          <Box size={16} />
                          <span>Product Management</span>
                        </Link>
                        <Link 
                          to="/admin/order-management" 
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={closeMobileMenu}
                        >
                          <ShoppingBag size={16} />
                          <span>Order Management</span>
                        </Link>
                        <Link 
                          to="/admin/inventory-management" 
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={closeMobileMenu}
                        >
                          <Package size={16} />
                          <span>Inventory Management</span>
                        </Link>
                        <Link 
                          to="/admin/user-management" 
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={closeMobileMenu}
                        >
                          <Users size={16} />
                          <span>User Management</span>
                        </Link>
                        <Link 
                          to="/admin/user-requests" 
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={closeMobileMenu}
                        >
                          <ClipboardList size={16} />
                          <span>User Requests</span>
                        </Link>
                      </>
                    )}
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className={`${navItemClass} ${isActivePath('/login') ? activeNavItemClass : ''}`}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-[#f97316] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#ea580c] transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button and icons */}
          <div className="md:hidden flex items-center space-x-3">
            {isAuthenticated && (
              <>
                <Link 
                  to="/cart" 
                  className="relative text-gray-700 p-2"
                >
                  <ShoppingCart size={24} />
                  {getCartItemsCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#f97316] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {getCartItemsCount()}
                    </span>
                  )}
                </Link>
                <NotificationBell />
              </>
            )}
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-[#f97316] p-2 rounded-md transition-colors"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu - Fixed with no page scroll */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 bg-white z-40 overflow-y-auto">
            <div className="py-4 space-y-1">
              {/* Main Navigation Links */}
              <Link 
                to="/" 
                className={`${mobileNavItemClass} ${isActivePath('/') ? 'bg-orange-50 text-[#f97316]' : ''}`} 
                onClick={closeMobileMenu}
              >
                <Home size={20} />
                <span>Home</span>
              </Link>

              <Link 
                to="/products" 
                className={`${mobileNavItemClass} ${isActivePath('/products') ? 'bg-orange-50 text-[#f97316]' : ''}`} 
                onClick={closeMobileMenu}
              >
                <Box size={20} />
                <span>Products</span>
              </Link>

              <Link 
                to="/about" 
                className={`${mobileNavItemClass} ${isActivePath('/about') ? 'bg-orange-50 text-[#f97316]' : ''}`} 
                onClick={closeMobileMenu}
              >
                <Info size={20} />
                <span>About</span>
              </Link>
              
              {/* User-specific links - Only show when authenticated */}
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/profile" 
                    className={`${mobileNavItemClass} ${isActivePath('/profile') ? 'bg-orange-50 text-[#f97316]' : ''}`} 
                    onClick={closeMobileMenu}
                  >
                    <User size={20} />
                    <span>Profile</span>
                  </Link>
                  
                  {/* FIXED: My Orders link - goes to profile with orders tab active */}
                  <Link 
                    to="/profile"
                    state={{ activeTab: 'orders' }}
                    className={`${mobileNavItemClass} ${isActivePath('/profile') && location.state?.activeTab === 'orders' ? 'bg-orange-50 text-[#f97316]' : ''}`} 
                    onClick={closeMobileMenu}
                  >
                    <History size={20} />
                    <span>My Orders</span>
                  </Link>
                  
                  {/* FIXED: Notifications link */}
                  <Link 
                    to="/notifications" 
                    className={`${mobileNavItemClass} ${isActivePath('/notifications') ? 'bg-orange-50 text-[#f97316]' : ''}`} 
                    onClick={closeMobileMenu}
                  >
                    <Bell size={20} />
                    <span>Notifications</span>
                  </Link>
                  
                  <Link 
                    to="/request-product" 
                    className={`${mobileNavItemClass} ${isActivePath('/request-product') ? 'bg-orange-50 text-[#f97316]' : ''}`} 
                    onClick={closeMobileMenu}
                  >
                    <Plus size={20} />
                    <span>Request Product</span>
                  </Link>

                  {/* Admin Panel for Mobile - Only for admins */}
                  {isAdmin && (
                    <>
                      <div className="border-t border-gray-200 my-2"></div>
                      <div className="px-4 py-2">
                        <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Admin Panel</span>
                      </div>
                      <Link 
                        to="/admin" 
                        className="flex items-center space-x-2 text-purple-600 hover:bg-purple-50 rounded-md px-4 py-3 text-base font-medium" 
                        onClick={closeMobileMenu}
                      >
                        <BarChart3 size={20} />
                        <span>Dashboard</span>
                      </Link>
                      <Link 
                        to="/admin/product-management" 
                        className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 rounded-md px-4 py-3 text-base font-medium" 
                        onClick={closeMobileMenu}
                      >
                        <Box size={20} />
                        <span>Product Management</span>
                      </Link>
                      <Link 
                        to="/admin/order-management" 
                        className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 rounded-md px-4 py-3 text-base font-medium" 
                        onClick={closeMobileMenu}
                      >
                        <ShoppingBag size={20} />
                        <span>Order Management</span>
                      </Link>
                      <Link 
                        to="/admin/inventory-management" 
                        className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 rounded-md px-4 py-3 text-base font-medium" 
                        onClick={closeMobileMenu}
                      >
                        <Package size={20} />
                        <span>Inventory Management</span>
                      </Link>
                      <Link 
                        to="/admin/user-management" 
                        className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 rounded-md px-4 py-3 text-base font-medium" 
                        onClick={closeMobileMenu}
                      >
                        <Users size={20} />
                        <span>User Management</span>
                      </Link>
                      <Link 
                        to="/admin/user-requests" 
                        className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 rounded-md px-4 py-3 text-base font-medium" 
                        onClick={closeMobileMenu}
                      >
                        <ClipboardList size={20} />
                        <span>User Requests</span>
                      </Link>
                    </>
                  )}
                  
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center space-x-2 text-gray-700 hover:bg-gray-100 rounded-md px-4 py-3 text-base font-medium"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    to="/login"
                    className={`${mobileNavItemClass} ${isActivePath('/login') ? 'bg-orange-50 text-[#f97316]' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    <User size={20} />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center space-x-2 bg-[#f97316] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#ea580c] transition-colors mx-4"
                    onClick={closeMobileMenu}
                  >
                    <Plus size={20} />
                    <span>Register</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
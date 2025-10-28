import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Invoice from './pages/Invoice';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import Navbar from './components/ui/Navbar';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Profile from './pages/Profile';
import RequestProduct from './pages/RequestProduct';
import OrderDetails from './pages/OrderDetails';
import Notifications from './pages/Notifications'; // ADD THIS IMPORT
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import ProductManagement from './pages/admin/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import UserRequests from './pages/admin/UserRequests';
import UserManagement from './pages/admin/UserManagement';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <main>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/request-product" element={<RequestProduct />} />
                  
                  {/* Protected Routes (Require Authentication) */}
                  <Route path="/cart" element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  } />
                  <Route path="/checkout" element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } />
                  <Route path="/order-confirmation" element={
                    <ProtectedRoute>
                      <OrderConfirmation />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/orders/:orderId" element={
                    <ProtectedRoute>
                      <OrderDetails />
                    </ProtectedRoute>
                  } />
                  {/* ADD NOTIFICATIONS ROUTE */}
                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/product-management" element={
                    <ProtectedRoute adminOnly={true}>
                      <ProductManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/order-management" element={
                    <ProtectedRoute adminOnly={true}>
                      <OrderManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/inventory-management" element={
                    <ProtectedRoute adminOnly={true}>
                      <InventoryManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/user-requests" element={
                    <ProtectedRoute adminOnly={true}>
                      <UserRequests />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/user-management" element={
                    <ProtectedRoute adminOnly={true}>
                      <UserManagement />
                    </ProtectedRoute>
                  } />

                  <Route path="/invoice/:orderId" element={
                    <ProtectedRoute>
                      <Invoice />
                    </ProtectedRoute>
                  } />

                  {/* Catch all route - redirects to public home page */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              
              <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </div>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
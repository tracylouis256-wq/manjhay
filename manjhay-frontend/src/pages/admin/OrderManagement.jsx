import React, { useState, useEffect } from 'react';
import { Eye, Phone, MessageCircle, Truck, CheckCircle, ThumbsUp, ThumbsDown, Shield, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../context/AuthContext'; // Import auth context

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const { user } = useAuth(); // Get current user from auth context

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    verified: 'bg-blue-100 text-blue-800',
    contacted: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const fetchOrders = async () => {
    try {
      console.log('🔄 Fetching orders...');
      const response = await axios.get('/api/orders');
      console.log('✅ Orders fetched:', response.data.data.length);
      setOrders(response.data.data);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const verifyPayment = async (orderId, verified, rejectionReason = '') => {
    setActionLoading(orderId);
    try {
      console.log(`💰 ${verified ? 'Verifying' : 'Rejecting'} payment for order: ${orderId}`);
      
      const response = await axios.patch(`/api/orders/${orderId}/verify-payment`, {
        verified,
        rejectionReason
      });
      
      console.log('✅ Payment action successful:', response.data);
      
      if (verified) {
        toast.success('Payment verified successfully');
      } else {
        toast.warning('Payment rejected');
      }
      
      fetchOrders();
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to verify payment');
    } finally {
      setActionLoading(null);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    setActionLoading(orderId);
    try {
      console.log(`🔄 Updating order ${orderId} status to: ${status}`);
      
      const response = await axios.patch(`/api/orders/${orderId}/status`, { status });
      
      console.log('✅ Status update successful:', response.data);
      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to update order status');
    } finally {
      setActionLoading(null);
    }
  };

  const contactCustomerShipping = async (orderId) => {
    const notes = prompt('Enter contact notes for shipping discussion:');
    if (notes !== null) {
      setActionLoading(orderId);
      try {
        console.log(`📞 Attempting to contact customer for order: ${orderId}`);
        console.log(`📝 Contact notes: ${notes}`);
        console.log(`👤 Current admin user:`, user); // Debug current user
        
        // First, let's check the current order status for debugging
        const orderCheck = await axios.get(`/api/orders/${orderId}`);
        const currentStatus = orderCheck.data.data.status;
        console.log(`📊 Current order status: ${currentStatus}`);
        
        if (currentStatus !== 'verified') {
          console.warn(`⚠️ Order status is ${currentStatus}, but needs to be 'verified'`);
          toast.error(`Cannot contact customer: Order must be verified first. Current status: ${currentStatus}`);
          setActionLoading(null);
          return;
        }

        console.log('✅ Order is verified, proceeding with contact...');
        
        // Use the current admin's name from auth context
        const adminName = user?.name || user?.username || 'Admin';
        console.log(`👤 Using admin name: ${adminName}`);
        
        const response = await axios.post(`/api/orders/${orderId}/contact-shipping`, {
          notes,
          contactMethod: 'call',
          admin: adminName // Send the admin name explicitly
        });
        
        console.log('✅ Contact successful:', response.data);
        toast.success('Customer contacted about shipping cost');
        fetchOrders();
      } catch (error) {
        console.error('❌ Error contacting customer:', error);
        console.error('Error response:', error.response?.data);
        
        if (error.response?.status === 400) {
          toast.error(`Cannot contact customer: ${error.response.data.message}`);
        } else if (error.response?.status === 404) {
          toast.error('Order not found');
        } else {
          toast.error('Failed to contact customer');
        }
      } finally {
        setActionLoading(null);
      }
    }
  };

  const finalizeShippingCost = async (orderId) => {
    const shippingCost = prompt('Enter shipping cost (GH₵):');
    if (shippingCost && !isNaN(shippingCost)) {
      setActionLoading(orderId);
      try {
        console.log(`💰 Finalizing shipping cost for order: ${orderId}`);
        console.log(`📦 Shipping cost: GH₵${shippingCost}`);
        
        const estimatedDelivery = prompt('Enter estimated delivery date (YYYY-MM-DD, optional):');
        const deliveryNotes = prompt('Enter delivery notes (optional):');

        const response = await axios.patch(`/api/orders/${orderId}/finalize-shipping`, {
          shippingCost: parseFloat(shippingCost),
          estimatedDelivery: estimatedDelivery || null,
          deliveryNotes: deliveryNotes || ''
        });

        console.log('✅ Shipping cost finalized:', response.data);
        toast.success('Shipping cost finalized');
        fetchOrders();
      } catch (error) {
        console.error('❌ Error finalizing shipping cost:', error);
        console.error('Error details:', error.response?.data);
        toast.error('Failed to finalize shipping cost');
      } finally {
        setActionLoading(null);
      }
    } else if (shippingCost !== null) {
      toast.error('Please enter a valid shipping cost');
    }
  };

  const viewOrderDetails = async (orderId) => {
    try {
      console.log(`👁️ Fetching details for order: ${orderId}`);
      const response = await axios.get(`/api/orders/${orderId}`);
      console.log('✅ Order details fetched:', response.data.data);
      setSelectedOrder(response.data.data);
      setShowModal(true);
    } catch (error) {
      console.error('❌ Error fetching order details:', error);
      toast.error('Failed to fetch order details');
    }
  };

  const rejectPaymentWithReason = (orderId) => {
    const rejectionReason = prompt('Please provide reason for rejection:');
    if (rejectionReason !== null && rejectionReason.trim() !== '') {
      verifyPayment(orderId, false, rejectionReason);
    } else if (rejectionReason !== null) {
      toast.error('Please provide a reason for rejection');
    }
  };

  const getStatusBadge = (order) => {
    const status = order.status;
    const baseClass = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`;
    
    return (
      <span className={baseClass}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
        {order.shippingArrangement?.costFinalized && status === 'contacted' && (
          <span className="ml-1" title="Shipping Cost Finalized">💰</span>
        )}
      </span>
    );
  };

  const getAvailableActions = (order) => {
    const actions = [];
    const isLoading = actionLoading === order._id;

    // Always show view details
    actions.push(
      <button
        key="view"
        onClick={() => viewOrderDetails(order._id)}
        className="text-blue-600 hover:text-blue-700 p-1 transition-colors"
        title="View Details"
        disabled={isLoading}
      >
        <Eye size={16} />
      </button>
    );

    // Payment Verification Actions
    if (order.status === 'pending') {
      actions.push(
        <button
          key="verify"
          onClick={() => verifyPayment(order._id, true)}
          className="text-green-600 hover:text-green-700 p-1 transition-colors"
          title="Verify Payment"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="small" /> : <ThumbsUp size={16} />}
        </button>,
        <button
          key="reject"
          onClick={() => rejectPaymentWithReason(order._id)}
          className="text-red-600 hover:text-red-700 p-1 transition-colors"
          title="Reject Payment"
          disabled={isLoading}
        >
          <ThumbsDown size={16} />
        </button>
      );
    }

    // Shipping Contact (Only for verified orders)
    if (order.status === 'verified') {
      actions.push(
        <button
          key="contact"
          onClick={() => contactCustomerShipping(order._id)}
          className="text-green-600 hover:text-green-700 p-1 transition-colors"
          title="Contact for Shipping Cost"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="small" /> : <Phone size={16} />}
        </button>
      );
    }

    // Finalize Shipping (Only for contacted orders without finalized cost)
    if (order.status === 'contacted' && !order.shippingArrangement?.costFinalized) {
      actions.push(
        <button
          key="finalize"
          onClick={() => finalizeShippingCost(order._id)}
          className="text-purple-600 hover:text-purple-700 p-1 transition-colors"
          title="Finalize Shipping Cost"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="small" /> : <MessageCircle size={16} />}
        </button>
      );
    }

    // Mark as Shipped (Only for contacted orders with finalized cost)
    if (order.status === 'contacted' && order.shippingArrangement?.costFinalized) {
      actions.push(
        <button
          key="ship"
          onClick={() => updateOrderStatus(order._id, 'shipped')}
          className="text-indigo-600 hover:text-indigo-700 p-1 transition-colors"
          title="Mark as Shipped"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="small" /> : <Truck size={16} />}
        </button>
      );
    }

    // Mark as Delivered
    if (order.status === 'shipped') {
      actions.push(
        <button
          key="deliver"
          onClick={() => updateOrderStatus(order._id, 'delivered')}
          className="text-green-600 hover:text-green-700 p-1 transition-colors"
          title="Mark as Delivered"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="small" /> : <CheckCircle size={16} />}
        </button>
      );
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage customer orders, verify payments, and handle shipping
                </p>
              </div>
              <button
                onClick={fetchOrders}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Region
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
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order._id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{order.user?.name || 'N/A'}</p>
                        <p className="text-gray-500 text-xs">{order.user?.phone || 'N/A'}</p>
                        <p className="text-gray-500 text-xs">{order.user?.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <p className="font-medium">GH₵{order.totalAmount?.toFixed(2) || '0.00'}</p>
                        {order.shippingCost > 0 && (
                          <p className="text-gray-500 text-xs">
                            + GH₵{order.shippingCost.toFixed(2)} shipping
                          </p>
                        )}
                        {order.finalAmount && order.finalAmount !== order.totalAmount && (
                          <p className="text-green-600 text-xs font-medium">
                            Total: GH₵{order.finalAmount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.user?.region || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-1">
                        {getAvailableActions(order)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No orders found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Order Details - {selectedOrder._id.slice(-8)}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p><strong>Name:</strong> {selectedOrder.user?.name || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedOrder.user?.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedOrder.user?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p><strong>Address:</strong> {selectedOrder.user?.address || 'N/A'}</p>
                    <p><strong>Region:</strong> {selectedOrder.user?.region || 'N/A'}</p>
                    <p><strong>Landmark:</strong> {selectedOrder.user?.landmark || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-3">
                      <div className="flex items-center space-x-3">
                        {item.product?.image?.url || item.image?.url ? (
                          <img
                            src={item.product?.image?.url || item.image?.url}
                            alt={item.product?.name || item.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <Package size={20} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{item.product?.name || item.name || 'Product'}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity} × GH₵{(item.priceAtOrder || item.price).toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="font-medium">GH₵{((item.priceAtOrder || item.price) * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <p className="font-medium">Total:</p>
                    <p className="font-bold">GH₵{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>

              {/* Payment & Shipping Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Payment Information</h4>
                  <div className="text-sm bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Status:</strong> {getStatusBadge(selectedOrder)}</p>
                    <p><strong>Total Amount:</strong> GH₵{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</p>
                    {selectedOrder.shippingCost > 0 && (
                      <p><strong>Shipping Cost:</strong> GH₵{selectedOrder.shippingCost.toFixed(2)}</p>
                    )}
                    {selectedOrder.finalAmount && selectedOrder.finalAmount !== selectedOrder.totalAmount && (
                      <p><strong>Final Amount:</strong> GH₵{selectedOrder.finalAmount.toFixed(2)}</p>
                    )}
                    {selectedOrder.paymentProof?.url && (
                      <div className="mt-2">
                        <p><strong>Payment Proof:</strong></p>
                        <img
                          src={selectedOrder.paymentProof.url}
                          alt="Payment proof"
                          className="mt-1 max-w-xs rounded border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(selectedOrder.paymentProof.url, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Shipping Information</h4>
                  <div className="text-sm bg-gray-50 p-4 rounded-lg space-y-2">
                    {selectedOrder.shippingArrangement?.costFinalized ? (
                      <>
                        <p><strong>Shipping Cost:</strong> GH₵{selectedOrder.shippingCost.toFixed(2)}</p>
                        {selectedOrder.shippingArrangement.estimatedDelivery && (
                          <p><strong>Estimated Delivery:</strong> {new Date(selectedOrder.shippingArrangement.estimatedDelivery).toLocaleDateString()}</p>
                        )}
                        {selectedOrder.shippingArrangement.deliveryNotes && (
                          <p><strong>Notes:</strong> {selectedOrder.shippingArrangement.deliveryNotes}</p>
                        )}
                        <p className="text-green-600 font-medium">✓ Shipping cost finalized</p>
                      </>
                    ) : (
                      <p className="text-yellow-600">Shipping cost not yet finalized</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions in Modal */}
              {selectedOrder.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-3">Payment Verification Required</h4>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        verifyPayment(selectedOrder._id, true);
                        setShowModal(false);
                      }}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                      disabled={actionLoading === selectedOrder._id}
                    >
                      {actionLoading === selectedOrder._id ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <>
                          <ThumbsUp size={16} className="mr-2" />
                          Approve Payment
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        rejectPaymentWithReason(selectedOrder._id);
                        setShowModal(false);
                      }}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
                      disabled={actionLoading === selectedOrder._id}
                    >
                      <ThumbsDown size={16} className="mr-2" />
                      Reject Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Contact History */}
              {selectedOrder.contactHistory?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contact History</h4>
                  <div className="space-y-3 text-sm">
                    {selectedOrder.contactHistory.map((contact, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">{contact.admin}</p>
                          <p className="text-gray-500 text-xs">
                            {new Date(contact.date).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-gray-700 mt-1">{contact.notes}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Type: <span className="capitalize">{contact.type}</span> • 
                          Purpose: <span className="capitalize">{contact.purpose?.replace('_', ' ') || 'general'}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
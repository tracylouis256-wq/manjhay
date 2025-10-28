import React from 'react';
import { Clock, CheckCircle, Phone, Truck, XCircle } from 'lucide-react';

const OrderStatus = ({ status }) => {
  const statusConfig = {
    pending: {
      color: 'text-yellow-600 bg-yellow-100',
      icon: Clock,
      label: 'Pending Verification'
    },
    verified: {
      color: 'text-blue-600 bg-blue-100',
      icon: CheckCircle,
      label: 'Payment Verified'
    },
    contacted: {
      color: 'text-purple-600 bg-purple-100',
      icon: Phone,
      label: 'Contacted for Shipping'
    },
    shipped: {
      color: 'text-indigo-600 bg-indigo-100',
      icon: Truck,
      label: 'Shipped'
    },
    delivered: {
      color: 'text-green-600 bg-green-100',
      icon: CheckCircle,
      label: 'Delivered'
    },
    cancelled: {
      color: 'text-red-600 bg-red-100',
      icon: XCircle,
      label: 'Cancelled'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <IconComponent size={16} />
      <span>{config.label}</span>
    </div>
  );
};

export default OrderStatus;
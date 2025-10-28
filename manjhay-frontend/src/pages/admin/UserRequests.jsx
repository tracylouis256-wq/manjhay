import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ImageModal from '../../components/ui/ImageModal';
import { Eye, Calendar, Mail, Phone } from 'lucide-react';

const UserRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchUserRequests();
  }, []);

  const fetchUserRequests = async () => {
    try {
      const response = await fetch('/api/user-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        throw new Error('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching user requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch(`/api/user-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setRequests(prev => 
          prev.map(req => 
            req._id === requestId ? { ...req, status: newStatus } : req
          )
        );
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      contacted: 'bg-blue-100 text-blue-800 border border-blue-200',
      completed: 'bg-green-100 text-green-800 border border-green-200'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const isEmail = (contact) => {
    return contact.includes('@');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Requests</h1>
        <p className="text-gray-600">Manage custom product requests from users</p>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Eye size={48} className="mx-auto" />
            </div>
            <p className="text-gray-500 text-lg">No user requests found.</p>
            <p className="text-gray-400">User requests will appear here when submitted.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Calendar size={16} className="inline mr-1" />
                    Date
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
                {requests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.imageUrl && (
                        <div className="relative group">
                          <img
                            src={request.imageUrl}
                            alt="Product request"
                            className="h-12 w-12 object-cover rounded-md cursor-pointer border border-gray-200"
                            onClick={() => setSelectedImage(request.imageUrl)}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-md transition-all cursor-pointer"></div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {request.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        {isEmail(request.contact) ? (
                          <Mail size={16} className="mr-2 text-blue-500" />
                        ) : (
                          <Phone size={16} className="mr-2 text-green-500" />
                        )}
                        {request.contact}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={request.status}
                        onChange={(e) => updateRequestStatus(request._id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-colors"
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};

export default UserRequests;
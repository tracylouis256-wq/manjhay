import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit, Shield, Ban, CheckCircle, XCircle, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import axios from 'axios';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const { user: adminUser } = useAuth();

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users/admin/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    try {
      const response = await axios.patch(`/api/auth/admin/users/${userId}/status`, {
        isActive
      });

      if (response.data.success) {
        setUsers(prev => prev.map(user => 
          user._id === userId ? { ...user, isActive } : user
        ));
        toast.success(`User ${isActive ? 'activated' : 'suspended'} successfully`);
        
        // Update selected user if modal is open
        if (selectedUser && selectedUser._id === userId) {
          setSelectedUser(prev => ({ ...prev, isActive }));
        }
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await axios.patch(`/api/auth/admin/users/${userId}/role`, {
        role: newRole
      });

      if (response.data.success) {
        setUsers(prev => prev.map(user => 
          user._id === userId ? { ...user, role: newRole } : user
        ));
        toast.success(`User role updated to ${newRole}`);
        
        // Update selected user if modal is open
        if (selectedUser && selectedUser._id === userId) {
          setSelectedUser(prev => ({ ...prev, role: newRole }));
        }
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Inactive
        </span>
      );
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Admin
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          User
        </span>
      );
    }
  };

  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage and monitor all user accounts</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500 rounded-full text-white mr-4">
                <Shield size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-500 rounded-full text-white mr-4">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-500 rounded-full text-white mr-4">
                <Ban size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => !u.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-500 rounded-full text-white mr-4">
                <Shield size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search users by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <Filter size={20} className="text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-colors"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Filter */}
              <div className="flex items-center space-x-2">
                <Shield size={20} className="text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-colors"
                >
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-[#f97316] to-[#CE1126] rounded-full flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user._id.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone size={14} className="mr-1" />
                          {user.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.isActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => viewUserDetails(user)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => updateUserRole(user._id, 'admin')}
                            className="text-purple-600 hover:text-purple-900 transition-colors p-1"
                            title="Make Admin"
                          >
                            <Shield size={16} />
                          </button>
                        )}

                        {user.role === 'admin' && user._id !== adminUser?.id && (
                          <button
                            onClick={() => updateUserRole(user._id, 'user')}
                            className="text-orange-600 hover:text-orange-900 transition-colors p-1"
                            title="Remove Admin"
                          >
                            <Shield size={16} />
                          </button>
                        )}

                        {user.isActive ? (
                          <button
                            onClick={() => updateUserStatus(user._id, false)}
                            className="text-red-600 hover:text-red-900 transition-colors p-1"
                            title="Deactivate User"
                          >
                            <Ban size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => updateUserStatus(user._id, true)}
                            className="text-green-600 hover:text-green-900 transition-colors p-1"
                            title="Activate User"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#f97316] to-[#CE1126] rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {selectedUser.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {selectedUser.name}
                      </h4>
                      <div className="flex space-x-2 mt-1">
                        {getStatusBadge(selectedUser.isActive)}
                        {getRoleBadge(selectedUser.role)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-gray-600">{selectedUser.email}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-gray-600">{selectedUser.phone}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-gray-600">
                        Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {selectedUser.address && (
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2 text-sm">
                          <MapPin size={16} className="text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-gray-600">Address:</span>
                            <div className="text-gray-500 text-xs">
                              {selectedUser.address.street && <div>{selectedUser.address.street}</div>}
                              {selectedUser.address.city && <div>{selectedUser.address.city}</div>}
                              {selectedUser.address.region && <div>{selectedUser.address.region}</div>}
                              {selectedUser.address.landmark && <div>Landmark: {selectedUser.address.landmark}</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">Quick Actions</h5>
                    <div className="flex flex-col space-y-2">
                      {selectedUser.isActive ? (
                        <button
                          onClick={() => {
                            updateUserStatus(selectedUser._id, false);
                            setShowUserModal(false);
                          }}
                          className="w-full bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          Deactivate User
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            updateUserStatus(selectedUser._id, true);
                            setShowUserModal(false);
                          }}
                          className="w-full bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          Activate User
                        </button>
                      )}

                      {selectedUser.role !== 'admin' ? (
                        <button
                          onClick={() => {
                            updateUserRole(selectedUser._id, 'admin');
                            setShowUserModal(false);
                          }}
                          className="w-full bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                        >
                          Make Admin
                        </button>
                      ) : selectedUser._id !== adminUser?.id && (
                        <button
                          onClick={() => {
                            updateUserRole(selectedUser._id, 'user');
                            setShowUserModal(false);
                          }}
                          className="w-full bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                        >
                          Remove Admin
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
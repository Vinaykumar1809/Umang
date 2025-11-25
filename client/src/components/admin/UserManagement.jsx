import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FaTrash, FaUserEdit, FaSearch } from 'react-icons/fa';
import moment from 'moment';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [suspensionPeriod, setSuspensionPeriod] = useState('24HOURS');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      
      // Ensure we always set an array, even if data structure is unexpected
      setUsers(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
      
      // IMPORTANT: Set users to empty array on error
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    try {
      await api.put(`/users/${selectedUser._id}/role`, { role: newRole });
      toast.success('User role updated successfully');
      setUsers(users.map(u => 
        u._id === selectedUser._id ? { ...u, role: newRole } : u
      ));
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleStatusChange = async () => {
    try {
      const newStatus = !selectedUser.isActive;
      await api.put(`/users/${selectedUser._id}/status`, {
        isActive: newStatus,
        suspensionPeriod: newStatus ? null : suspensionPeriod,
      });

      toast.success(
        newStatus ? 'User activated successfully' : 'User deactivated successfully'
      );

      setUsers(
        users.map(u =>
          u._id === selectedUser._id
            ? {
                ...u,
                isActive: newStatus,
                inactivationReason: newStatus ? null : suspensionPeriod,
                inactivationExpire:
                  newStatus || suspensionPeriod === 'INDEFINITE'
                    ? null
                    : calculateExpirationDate(suspensionPeriod),
              }
            : u
        )
      );

      setShowStatusModal(false);
      setSuspensionPeriod('24HOURS');
      setSelectedUser(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const calculateExpirationDate = (period) => {
    const now = new Date();
    switch (period) {
      case '24HOURS':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '7DAYS':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case '30DAYS':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'INDEFINITE':
        return null;
      default:
        return null;
    }
  };

  const openStatusModal = (user) => {
    setSelectedUser(user);
    setSuspensionPeriod('24HOURS');
    setShowStatusModal(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${selectedUser._id}`);
      toast.success('User deleted successfully');
      setUsers(users.filter(u => u._id !== selectedUser._id));
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // FIXED: Added defensive check for users array
  const filteredUsers = Array.isArray(users)
    ? users.filter(user => {
        const matchesSearch =
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
      })
    : [];

  const optimizeImage = (url) => {
    if (!url) return url;
    // If already optimized, return as-is
    if (url.includes("f_auto") || url.includes("q_auto")) return url;
    return url.replace("/upload/", "/upload/f_auto,q_auto/");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          User Management
        </h1>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="user">User</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={optimizeImage(user.profilePicture) || '/default-avatar.png'}
                          alt={user.username}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : user.role === 'member'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {moment(user.createdAt).format('MMM DD, YYYY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openStatusModal(user)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                      >
                        <FaUserEdit className="inline" /> Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <FaTrash className="inline" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Change role for{' '}
              <span className="text-primary-600">{selectedUser?.username}</span>
            </h2>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="user">User</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Note: Admin roles cannot be assigned through this interface
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Confirm Deletion
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-primary-600">
                {selectedUser?.username}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {selectedUser.isActive ? 'Deactivate' : 'Activate'} User
            </h2>
            {selectedUser.isActive ? (
              <>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  Are you sure you want to deactivate{' '}
                  <span className="font-semibold text-primary-600">
                    {selectedUser?.username}
                  </span>
                  's account?
                </p>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  They will receive an email notification about the suspension.
                </p>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Suspension Period
                </label>
                <select
                  value={suspensionPeriod}
                  onChange={(e) => setSuspensionPeriod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="24HOURS">24 Hours</option>
                  <option value="7DAYS">7 Days</option>
                  <option value="30DAYS">30 Days</option>
                  <option value="INDEFINITE">Indefinite</option>
                </select>
                {suspensionPeriod !== 'INDEFINITE' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Account will be automatically reactivated on{' '}
                    <span className="font-semibold">
                      {moment(calculateExpirationDate(suspensionPeriod)).format(
                        'MMM DD, YYYY hh:mm A'
                      )}
                    </span>
                  </p>
                )}
              </>
            ) : (
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                Are you sure you want to activate{' '}
                <span className="font-semibold text-primary-600">
                  {selectedUser?.username}
                </span>
                's account?
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedUser(null);
                  setSuspensionPeriod('24HOURS');
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                className={`px-4 py-2 text-white rounded-lg ${
                  selectedUser.isActive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {selectedUser.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

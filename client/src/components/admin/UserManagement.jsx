import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
      const res = await axios.get('/api/users');
      setUsers(res.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch users');
      setLoading(false);
    }
  };


  const handleRoleChange = async () => {
    try {
      await axios.put(`/api/users/${selectedUser._id}/role`, {
        role: newRole
      });
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

      await axios.put(`/api/users/${selectedUser._id}/status`, {
        isActive: newStatus,
        suspensionPeriod: newStatus ? null : suspensionPeriod,
      });

      toast.success(
        newStatus
          ? 'User activated successfully'
          : 'User deactivated successfully'
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
      await axios.delete(`/api/users/${selectedUser._id}`);
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


  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

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
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          User Management
        </h1>


        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Roles</option>
            <option value="USER">Users</option>
            <option value="MEMBER">Members</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>


        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
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
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={optimizeImage(user.profileImage) || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'}
                        alt={user.username}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.username}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : user.role === 'MEMBER'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {moment(user.createdAt).format('MMM DD, YYYY')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
  
  <button
    onClick={() => openStatusModal(user)}
    disabled={user.role === 'ADMIN'}
    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-opacity ${
      user.role === 'ADMIN' 
        ? 'opacity-50 cursor-not-allowed' 
        : 'hover:opacity-80'
    }`}
    style={{
      backgroundColor: user.isActive ? '#d1fae5' : '#fee2e2',
      color: user.isActive ? '#065f46' : '#991b1b',
    }}
    title={user.role === 'ADMIN' ? 'Cannot change admin status' : 'Click to change status'}
  >
    {user.isActive ? 'Active' : 'Inactive'}
    {user.inactivationExpire && (
      <div style={{ fontSize: '9px', marginTop: '2px' }}>
        Until {moment(user.inactivationExpire).format('MMM DD')}
      </div>
    )}
  </button>
</td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        disabled={user.role === 'ADMIN'}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={user.role === 'ADMIN' ? 'Cannot modify admin role' : 'Change role'}
                      >
                        <FaUserEdit size={18} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        disabled={user.role === 'ADMIN'}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={user.role === 'ADMIN' ? 'Cannot delete admin' : 'Delete user'}
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No users found</p>
          </div>
        )}
      </div>


      {/* Edit Role Modal*/}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Change User Role
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Change role for <strong>{selectedUser?.username}</strong>
            </p>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white mb-4"
            >
              <option value="USER">User</option>
              <option value="MEMBER">Member</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Note: Admin roles cannot be assigned through this interface
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
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


      {/* Delete Confirmation Modal*/}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Delete User
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete <strong>{selectedUser?.username}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
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

      {/* Status Modal - Similar to Role Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {selectedUser?.isActive ? 'Deactivate User' : 'Activate User'}
            </h2>

            {selectedUser?.isActive ? (
              <>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Are you sure you want to deactivate <strong>{selectedUser?.username}</strong>'s account?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  They will receive an email notification about the suspension.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Suspension Duration:
                  </label>
                  <select
                    value={suspensionPeriod}
                    onChange={(e) => setSuspensionPeriod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="24HOURS">24 Hours</option>
                    <option value="7DAYS">7 Days</option>
                    <option value="30DAYS">30 Days</option>
                    <option value="INDEFINITE">Indefinitely</option>
                  </select>
                </div>

                {suspensionPeriod !== 'INDEFINITE' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded mb-4">
                    Account will be automatically reactivated on <strong>{moment(calculateExpirationDate(suspensionPeriod)).format('MMM DD, YYYY hh:mm A')}</strong>
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Are you sure you want to activate <strong>{selectedUser?.username}</strong>'s account?
              </p>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSuspensionPeriod('24HOURS');
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                className={`px-4 py-2 text-white rounded-lg ${
                  selectedUser?.isActive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {selectedUser?.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default UserManagement;

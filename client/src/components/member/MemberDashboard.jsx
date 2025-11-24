import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../../../context/socketContext';
import api from '../../utils/api'
import { FaFileAlt, FaEdit, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const MemberDashboard = () => {
  const [stats, setStats] = useState({
    published: 0,
    drafts: 0,
    pending: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

   const { socket } = useSocket();

useEffect(() => {
  if (socket) {
    socket.on('dashboard:stats_updated', (newStats) => {
      // Update your stat states with newStats
    });

    return () => {
      socket.off('dashboard:stats_updated');
    };
  }
}, [socket]);

  const fetchStats = async () => {
    try {
      const [published, drafts, pending, rejected] = await Promise.all([
        api.get('/posts/user?status=published'),
        api.get('/posts/user?status=draft'),
        api.get('/posts/user?status=pending'),
        api.get('/posts/user?status=rejected')
      ]);

      setStats({
        published: published.data.count,
        drafts: drafts.data.count,
        pending: pending.data.count,
        rejected: rejected.data.count
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch stats');
      setLoading(false);
    }
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
          Member Dashboard
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Published Posts</p>
                <p className="text-3xl font-bold mt-2">{stats.published}</p>
              </div>
              <FaCheckCircle size={48} className="opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Draft Posts</p>
                <p className="text-3xl font-bold mt-2">{stats.drafts}</p>
              </div>
              <FaEdit size={48} className="opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Pending Approval</p>
                <p className="text-3xl font-bold mt-2">{stats.pending}</p>
              </div>
              <FaClock size={48} className="opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Rejected</p>
                <p className="text-3xl font-bold mt-2">{stats.rejected}</p>
              </div>
              <FaTimesCircle size={48} className="opacity-80" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/member/create-post"
            className="bg-primary-600 text-white rounded-lg p-6 text-center hover:bg-primary-700 transition group"
          >
            <FaFileAlt size={48} className="mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold mb-2">Create New Post</h3>
            <p className="text-sm opacity-90">Write and submit a new post</p>
          </Link>

          <Link
            to="/member/drafts"
            className="bg-gray-600 text-white rounded-lg p-6 text-center hover:bg-gray-700 transition group"
          >
            <FaEdit size={48} className="mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold mb-2">Manage Drafts</h3>
            <p className="text-sm opacity-90">View and edit your draft posts</p>
          </Link>

          <Link
            to="/member/posts"
            className="bg-green-600 text-white rounded-lg p-6 text-center hover:bg-green-700 transition group"
          >
            <FaCheckCircle size={48} className="mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold mb-2">My Posts</h3>
            <p className="text-sm opacity-90">View all your published posts</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;

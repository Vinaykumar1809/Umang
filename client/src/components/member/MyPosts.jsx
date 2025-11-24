import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useSocket } from '../../../context/SocketContext';
import { FaEye, FaEdit, FaTrash, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import moment from 'moment';

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Set filter from URL on mount
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && statusParam !== filter) {
      setFilter(statusParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('post:status_changed', (data) => {
        setPosts(prev =>
          prev.map(p => p._id === data.postId 
            ? { ...p, status: data.newStatus }
            : p
          )
        );
      });

      socket.on('post:deleted', (postId) => {
        setPosts(prev => prev.filter(p => p._id !== postId));
      });

      return () => {
        socket.off('post:status_changed');
        socket.off('post:deleted');
      };
    }
  }, [socket]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      //Pass status as query parameter
      const statusQuery = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.get(`/posts/user${statusQuery}`);
      setPosts(res.data.data || []);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch posts');
      setPosts([]);
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      toast.success('Post deleted successfully');
      setPosts(posts.filter(post => post._id !== postId));
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const getStatusBadge = (status) => {
    const base =
      'flex items-center space-x-1 px-3 py-1 text-xs rounded-full font-medium';
    switch (status) {
      case 'published':
        return (
          <span className={`${base} bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200`}>
            <FaCheckCircle />
            <span>Published</span>
          </span>
        );
      case 'pending':
        return (
          <span className={`${base} bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200`}>
            <FaClock />
            <span>Pending</span>
          </span>
        );
      case 'rejected':
        return (
          <span className={`${base} bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200`}>
            <FaTimesCircle />
            <span>Rejected</span>
          </span>
        );
      case 'draft':
        return (
          <span className={`${base} bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200`}>
            <FaClock />
            <span>Draft</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Update filter and URL
  const handleFilterClick = (f) => {
    setFilter(f);
    if (f === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ status: f });
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
    <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            My Posts
          </h1>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {['all', 'draft', 'published', 'pending', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => handleFilterClick(f)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm transition ${
                  filter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              No posts found
            </p>
            <button
              onClick={() => navigate('/member/create-post')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Create New Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post._id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                        {post.title}
                      </h3>
                      {getStatusBadge(post.status)}
                    </div>
                    <div
                      className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {post.status === 'published'
                          ? `Published ${moment(post.publishedAt).fromNow()}`
                          : `Created ${moment(post.createdAt).fromNow()}`}
                      </span>
                      {post.status === 'published' && (
                        <>
                          <span>•</span>
                          <span>{post.views || 0} views</span>
                        </>
                      )}
                    </div>

                    {post.status === 'rejected' && post.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                          Rejection Reason:
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {post.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Responsive Buttons */}
                  <div className="flex sm:flex-col flex-row sm:space-y-2 gap-2 sm:gap-0 overflow-x-auto w-full sm:w-auto">
                    {post.status === 'published' && (
                      <button
                        onClick={() => navigate(`/blog/${post._id}`)}
                        className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                      >
                        <FaEye />
                        <span>View</span>
                      </button>
                    )}
                    {post.status !== 'pending' && (
                      <button
                        onClick={() => navigate(`/member/edit-post/${post._id}`)}
                        className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        <FaEdit />
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                    >
                      <FaTrash />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPosts;

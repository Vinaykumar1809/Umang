import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api'
import { useSocket } from '../../../context/SocketContext';
import toast from 'react-hot-toast';
import { FaEdit, FaTrash, FaPaperPlane } from 'react-icons/fa';
import moment from 'moment';

const DraftPosts = () => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDrafts();
  }, []);

const { socket } = useSocket();

useEffect(() => {
  if (socket) {
    socket.on('post:draft_deleted', (postId) => {
      setDrafts(prev => prev.filter(p => p._id !== postId));
    });

    return () => {
      socket.off('post:draft_deleted');
    };
  }
}, [socket]);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts/user?status=draft');
      setDrafts(res.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch drafts');
      setLoading(false);
    }
  };

  const handleEdit = (postId) => {
    navigate(`/member/edit-post/${postId}`);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) return;

    try {
      await api.delete(`/posts/${postId}`);
      toast.success('Draft deleted successfully');
      setDrafts(drafts.filter(post => post._id !== postId));
    } catch (error) {
      toast.error('Failed to delete draft');
    }
  };

  const handleSubmitForReview = async (postId) => {
    if (!window.confirm('Submit this post for admin review?')) return;

    try {
      await api.put(`/posts/${postId}`, { status: 'pending' });
      toast.success('Post submitted for review');
      setDrafts(drafts.filter(post => post._id !== postId));
    } catch (error) {
      toast.error('Failed to submit post');
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
          Draft Posts
        </h1>

        {drafts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              No draft posts yet
            </p>
            <button
              onClick={() => navigate('/member/create-post')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Create Your First Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((post) => (
              <div
                key={post._id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {post.title}
                    </h3>
                    <div
  className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2"
  dangerouslySetInnerHTML={{ __html: post.content }}
/>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                        {post.category}
                      </span>
                      {post.tags?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Last modified: {moment(post.updatedAt).fromNow()}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleEdit(post._id)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <FaEdit />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleSubmitForReview(post._id)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <FaPaperPlane />
                      <span>Submit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
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

export default DraftPosts;

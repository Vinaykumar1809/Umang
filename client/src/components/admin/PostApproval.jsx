import React, { useState, useEffect } from 'react';
import api from '../../utils/api'
import toast from 'react-hot-toast';
import { useSocket } from '../../../context/SocketContext';
import { FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import moment from 'moment';

const PostApproval = () => {
  const [pendingPosts, setPendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPendingPosts();
  }, []);


  const { socket } = useSocket();

useEffect(() => {
  if (socket) {
    socket.on('post:pending', (newPost) => {
      setPendingPosts(prev => [newPost, ...prev]);
    });

    socket.on('post:approval_change', (data) => {
      setPendingPosts(prev =>
        prev.filter(p => p._id !== data.postId)
      );
    });

    return () => {
      socket.off('post:pending');
      socket.off('post:approval_change');
    };
  }
}, [socket]);


  const fetchPendingPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts/pending');
      setPendingPosts(res.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch pending posts');
      setLoading(false);
    }
  };

  const handleApprove = async (postId) => {
    try {
      setProcessingId(postId);
      await api.put(`/posts/${postId}/approve`);
      toast.success('Post approved successfully');
      setPendingPosts(pendingPosts.filter(post => post._id !== postId));
      setProcessingId(null);
    } catch (error) {
      toast.error('Failed to approve post');
      setProcessingId(null);
    }
  };

  const handleRejectClick = (post) => {
    setSelectedPost(post);
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessingId(selectedPost._id);
      await api.put(`/posts/${selectedPost._id}/reject`, {
        reason: rejectionReason
      });
      toast.success('Post rejected');
      setPendingPosts(pendingPosts.filter(post => post._id !== selectedPost._id));
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedPost(null);
      setProcessingId(null);
    } catch (error) {
      toast.error('Failed to reject post');
      setProcessingId(null);
    }
  };

  const handlePreview = (post) => {
    setSelectedPost(post);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const optimizeImage = (url) => {
  if (!url) return url;

  // If already optimized, return as-is
  if (url.includes("f_auto") || url.includes("q_auto")) return url;

  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Pending Posts Approval
        </h1>

        {pendingPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No pending posts for approval
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingPosts.map((post) => (
              <div
                key={post._id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
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

                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        {post.author?.profileImage && (
                          <img
                            src={optimizeImage(post.author.profileImage)}
                            alt={post.author.username}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <span>By {post.author?.username}</span>
                      </div>
                      <span>•</span>
                      <span>{moment(post.createdAt).fromNow()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handlePreview(post)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      <FaEye />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => handleApprove(post._id)}
                      disabled={processingId === post._id}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaCheck />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleRejectClick(post)}
                      disabled={processingId === post._id}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaTimes />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
     {selectedPost && !showRejectModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Preview Post</h2>
        <button
          onClick={() => setSelectedPost(null)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <FaTimes size={24} />
        </button>
      </div>
      {/* Post Preview Body */}
      <div className="p-8">
        {selectedPost.featuredImage && (
          <div className="w-full h-96 overflow-hidden mb-6">
            <img
              src={optimizeImage(selectedPost.featuredImage)}
              alt={selectedPost.title}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
          {selectedPost.title}
        </h1>

        {/* Author Section Only */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          {selectedPost.author?.profileImage ? (
            <img
              src={optimizeImage(selectedPost.author.profileImage)}
              alt={selectedPost.author.username}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-400 text-2xl">
                {selectedPost.author?.username?.[0] || "?"}
              </span>
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {selectedPost.author?.username || 'Unknown'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Author</p>
          </div>
        </div>

        {/* Content */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: selectedPost.content }}
        />
      </div>
    </div>
  </div>
)}


      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Reject Post
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Please provide a reason for rejecting "{selectedPost?.title}"
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              rows="4"
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedPost(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === selectedPost?._id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId === selectedPost?._id ? 'Rejecting...' : 'Reject Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostApproval;

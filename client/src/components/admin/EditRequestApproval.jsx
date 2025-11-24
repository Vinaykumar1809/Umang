import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FaCheck, FaTimes, FaEye } from "react-icons/fa";
import moment from "moment";

const EditRequestApproval = () => {
  const [editRequests, setEditRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState(null);

  useEffect(() => {
    fetchEditRequests();
  }, []);

  const fetchEditRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/posts/pending-edit-requests");
      setEditRequests(res.data.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch edit requests");
      setLoading(false);
    }
  };

  const handleApprove = async (postId) => {
    try {
      await api.put(`/posts/${postId}/approve-edit`);
      toast.success("Edit request approved");
      fetchEditRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve edit request");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      await api.put(`/posts/${rejectingId}/reject-edit`, { reason: rejectReason });
      toast.success("Edit request rejected");
      setShowRejectModal(false);
      setRejectReason("");
      setRejectingId(null);
      fetchEditRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject edit request");
    }
  };

  const optimizeImage = (url) => {
  if (!url) return url;

  // If already optimized, return as-is
  if (url.includes("f_auto") || url.includes("q_auto")) return url;

  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};


  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Pending Edit Requests Approval
        </h1>
        {editRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No pending edit requests for approval
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {editRequests.map((post) => (
              <div
                key={post.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Use requested title/category/content */}
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {post.pendingEdit?.title || post.title}
                    </h3>
                    <div
                      className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: post.pendingEdit?.content || post.content || "" }}
                    ></div>
                  
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        {post.author?.profileImage ? (
                          <img
                            src={optimizeImage(post.author.profileImage)}
                            alt={post.author.username}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : null}
                        <span>By {post.author?.username}</span>
                      </div>
                      <span>{moment(post.pendingEdit?.submittedAt).fromNow()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => setSelectedPost(post)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      <FaEye />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => handleApprove(post.id)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <FaCheck />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(post.id);
                        setShowRejectModal(true);
                      }}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Preview Edit Request
              </h2>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FaTimes size={24} />
              </button>
            </div>
            <div className="p-8">
              {/* Requested featured image */}
              {selectedPost.pendingEdit?.featuredImage ? (
                <div className="w-full h-96 overflow-hidden mb-6">
                  <img
                    src={optimizeImage(selectedPost.pendingEdit.featuredImage)}
                    alt={selectedPost.pendingEdit.title || selectedPost.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ) : null}

             
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                {selectedPost.pendingEdit?.title || selectedPost.title}
              </h1>
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
                      {selectedPost.author?.username?.[0] ? selectedPost.author.username[0] : ""}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedPost.author?.username || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Author</p>
                </div>
              </div>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedPost.pendingEdit?.content || selectedPost.content || "" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Reject Edit Request
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Please provide a reason for rejecting "{editRequests.find((p) => p.id === rejectingId)?.pendingEdit?.title || editRequests.find((p) => p.id === rejectingId)?.title}"
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white rows-4 placeholder:text-gray-400"
              rows={4}
              placeholder="Enter rejection reason..."
            ></textarea>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setRejectingId(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditRequestApproval;

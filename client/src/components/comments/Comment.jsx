import React, { useState } from 'react';
import moment from 'moment';
import toast from 'react-hot-toast';
import { FaUser, FaTrash, FaReply, FaEdit, FaThumbsUp, FaRegThumbsUp } from 'react-icons/fa';
import { useAuth } from '../../../context/authContext.jsx';

const Comment = ({ 
  comment, 
  onDelete, 
  onReply, 
  onEdit, 
  onEditReply, 
  onLike, 
  onLikeReply, 
  onDeleteReply, 
  postOwnerId, 
  currentUser, 
  isReply = false 
}) => {
  const { user, isAuthenticated } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit state for top-level comment
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [savingEdit, setSavingEdit] = useState(false);

  // Edit state for replies
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyContent, setEditingReplyContent] = useState('');
  const [savingReplyEdit, setSavingReplyEdit] = useState(false);

  const canDelete = () => {
    if (!isAuthenticated || !user) return false;
    
    const currentUserId = (user.id || user._id || '').toString();
    const commentAuthorId = (comment.author?._id || comment.author || '').toString();
    const postOwnerIdStr = (postOwnerId || '').toString();
    
    const isAdmin = user.role === 'ADMIN';
    const isCommentAuthor = currentUserId === commentAuthorId;
    const isPostOwner = currentUserId === postOwnerIdStr;
    
    return isAdmin || isCommentAuthor || isPostOwner;
  };

  const canEdit = () => {
    if (!isAuthenticated || !user) return false;

    const isAdmin = user.role === 'ADMIN';
    const currentUserId = (user.id || user._id || '').toString();
    const commentAuthorId = (comment.author?._id || comment.author || '').toString();
    
    const isCommentAuthor = currentUserId === commentAuthorId;
    
    return isCommentAuthor || isAdmin;
  };

  //Check if user can edit/delete replies
  const canManageReply = (reply) => {
    if (!isAuthenticated || !user) return false;
    
    const currentUserId = (user.id || user._id || '').toString();
    const replyAuthorId = (reply.author?._id || reply.author || '').toString();
    const postOwnerIdStr = (postOwnerId || '').toString();
    
    const isAdmin = user.role === 'ADMIN';
    const isReplyAuthor = currentUserId === replyAuthorId;
    const isPostOwner = currentUserId === postOwnerIdStr;
    
    return isAdmin || isReplyAuthor || isPostOwner;
  };

  const isLikedByUser = () => {
    if (!isAuthenticated || !user) return false;
    const userId = user.id || user._id;
    return comment.likes?.some(likeUserId => 
      likeUserId.toString() === userId.toString()
    );
  };

  //Like reply
  const handleLikeReply = async (replyId) => {
    if (!isAuthenticated) {
      toast.error('Please login to like replies');
      return;
    }
    try {
      await onLikeReply(comment._id, replyId);
    } catch (error) {
      toast.error('Failed to like reply');
    }
  };

  //  Delete reply
  const handleDeleteReplyClick = async (replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    try {
      await onDeleteReply(comment._id, replyId);
    } catch (error) {
      toast.error('Failed to delete reply');
    }
  };

  // Edit reply
  const handleEditReplySubmit = async (replyId) => {
    if (!editingReplyContent.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    setSavingReplyEdit(true);
    try {
      await onEditReply(comment._id, replyId, editingReplyContent);
      setEditingReplyId(null);
      setEditingReplyContent('');
      toast.success('Reply updated successfully');
    } catch (error) {
      toast.error('Failed to edit reply');
    } finally {
      setSavingReplyEdit(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmitting(true);
    await onReply(comment._id, replyContent);
    setReplyContent('');
    setShowReplyForm(false);
    setSubmitting(false);
  };

  const handleSaveEdit = async () => {
    if (!editedContent.trim()) return;
    setSavingEdit(true);
    await onEdit(comment._id, editedContent);
    setIsEditing(false);
    setSavingEdit(false);
  };

  // Like comment
  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error('Please login to like comments');
      return;
    }
    onLike(comment._id);
  };

  const optimizeImage = (url) => {
  if (!url) return url;

  // If already optimized, return as-is
  if (url.includes("f_auto") || url.includes("q_auto")) return url;

  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};


  return (
    <div id={`comment-${comment._id}`} className={`${isReply ? 'ml-12' : ''}`}>
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        {comment.author?.profileImage ? (
          <img
            src={optimizeImage(comment.author.profileImage)}
            alt={comment.author.username}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
            <FaUser className="text-gray-600 dark:text-gray-400" />
          </div>
        )}

        {/* Comment Content */}
        <div className="flex-1">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            {/* Author and Date */}
            <div className="mb-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {comment.author?.username || 'Unknown User'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {moment(comment.createdAt).fromNow()}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                    (edited)
                  </span>
                )}
              </div>
            </div>

            {/* Editable Content or Static Text */}
            {!isEditing ? (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
            ) : (
              <textarea
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
                rows={3}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
            {/* Like Button */}
            {isAuthenticated && (
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 transition ${
                  isLikedByUser() 
                    ? 'text-blue-600 hover:text-blue-700' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-blue-600'
                }`}
              >
                {isLikedByUser() ? <FaThumbsUp /> : <FaRegThumbsUp />}
                <span>{comment.likes?.length || 0}</span>
              </button>
            )}

            {/* Show like count for non-authenticated users */}
            {!isAuthenticated && comment.likes && comment.likes.length > 0 && (
              <span className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                <FaRegThumbsUp />
                <span>{comment.likes.length}</span>
              </span>
            )}

            {/* Reply button - only for top-level comments */}
            {isAuthenticated && !isReply && !isEditing && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition"
              >
                <FaReply />
                <span>Reply</span>
              </button>
            )}

            {/* Edit button - works for both top-level and nested */}
            {canEdit() && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition"
              >
                <FaEdit />
                <span>Edit</span>
              </button>
            )}

            {/* Save/Cancel when editing */}
            {isEditing && (
              <>
                <button
                  disabled={savingEdit}
                  onClick={handleSaveEdit}
                  className="bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  disabled={savingEdit}
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(comment.content);
                  }}
                  className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </>
            )}

            {/* Delete button - works for both top-level and nested */}
            {canDelete() && !isEditing && (
              <button
                onClick={() => onDelete(comment._id)}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition"
              >
                <FaTrash />
                <span>Delete</span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="mt-4">
              <div className="flex items-start space-x-3">
                {currentUser?.profileImage && (
                  <img
                    src={optimizeImage(currentUser.profileImage)}
                    alt={currentUser.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm resize-none"
                    rows="2"
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReplyForm(false);
                        setReplyContent('');
                      }}
                      className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !replyContent.trim()}
                      className="px-4 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Posting...' : 'Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <div key={reply._id} id={`comment-${reply._id}`} className="flex items-start space-x-4">
                  {/* Reply Avatar */}
                  {reply.author?.profileImage ? (
                    <img
                      src={optimizeImage(reply.author.profileImage)}
                      alt={reply.author.username}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                      <FaUser className="text-gray-600 dark:text-gray-400" />
                    </div>
                  )}

                  {/* Reply Content */}
                  <div className="flex-1">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                      <div className="mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {reply.author?.username || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {moment(reply.createdAt).fromNow()}
                          </span>
                          {reply.isEdited && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                              (edited)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reply Edit or Display */}
                      {editingReplyId === reply._id ? (
                        <textarea
                          className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
                          rows={2}
                          value={editingReplyContent}
                          onChange={(e) => setEditingReplyContent(e.target.value)}
                        />
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reply.content}</p>
                      )}
                    </div>

                    {/* Reply Actions */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                      {/* Like Reply */}
                      {isAuthenticated && (
                        <button
                          onClick={() => handleLikeReply(reply._id)}
                          className={`flex items-center space-x-1 transition ${
                            reply.likes?.some(id => id.toString() === (user?.id || user?._id)?.toString())
                              ? 'text-blue-600 hover:text-blue-700' 
                              : 'text-gray-600 dark:text-gray-400 hover:text-blue-600'
                          }`}
                        >
                          {reply.likes?.some(id => id.toString() === (user?.id || user?._id)?.toString()) ? <FaThumbsUp /> : <FaRegThumbsUp />}
                          <span>{reply.likes?.length || 0}</span>
                        </button>
                      )}

                      {!isAuthenticated && reply.likes && reply.likes.length > 0 && (
                        <span className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                          <FaRegThumbsUp />
                          <span>{reply.likes.length}</span>
                        </span>
                      )}

                      {/* Edit Reply Button */}
                      {canManageReply(reply) && editingReplyId !== reply._id && (
                        <button
                          onClick={() => {
                            setEditingReplyId(reply._id);
                            setEditingReplyContent(reply.content);
                          }}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition"
                        >
                          <FaEdit />
                          <span>Edit</span>
                        </button>
                      )}

                      {/* Save/Cancel Reply Edit */}
                      {editingReplyId === reply._id && (
                        <>
                          <button
                            disabled={savingReplyEdit}
                            onClick={() => handleEditReplySubmit(reply._id)}
                            className="bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 disabled:opacity-50 text-xs"
                          >
                            Save
                          </button>
                          <button
                            disabled={savingReplyEdit}
                            onClick={() => {
                              setEditingReplyId(null);
                              setEditingReplyContent('');
                            }}
                            className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-600 text-xs"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {/* Delete Reply Button */}
                      {canManageReply(reply) && editingReplyId !== reply._id && (
                        <button
                          onClick={() => handleDeleteReplyClick(reply._id)}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition"
                        >
                          <FaTrash />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comment;

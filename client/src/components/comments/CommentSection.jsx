import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../utils/api.js';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/authContext';
import Comment from './Comment.jsx';
import { FaComment } from 'react-icons/fa';
import { useSocket } from '../../../context/SocketContext';

const CommentSection = ({ postId, postOwnerId }) => {
  const { user, isAuthenticated } = useAuth();
   const { socket } = useSocket(); 
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/comments/post/${postId}`);
      setComments(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch comments');
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      
  
      const res = await axios.post('/api/comments', {
        content: newComment,
        postId: postId
      });

      //  Update UI immediately (Optimistic Update)
      setComments([res.data.data, ...comments]);
      setNewComment('');
      toast.success('Comment added successfully');
      setSubmitting(false);
    } catch (error) {
      toast.error('Failed to add comment');
      setSubmitting(false);
    }
  };

  //  Update UI immediately, then delete from server
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      //  Update UI immediately (Optimistic Update)
      setComments(comments.filter(c => c._id !== commentId));
      
      // Send delete to server
      await api.delete(`/comments/${commentId}`);
      toast.success('Comment deleted successfully');
    } catch (error) {
      //  Rollback if error
      await fetchComments();
      toast.error('Failed to delete comment');
    }
  };

  // Update UI immediately, then send to server
  const handleReply = async (parentCommentId, content) => {
    try {
      const res = await api.post('/comments', {
        content,
        postId,
        parentCommentId
      });

      // Update UI immediately (Optimistic Update)
      setComments(prevComments =>
        prevComments.map(comment =>
          comment._id === parentCommentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), res.data.data]
              }
            : comment
        )
      );
      
      toast.success('Reply added successfully');
    } catch (error) {
      toast.error('Failed to add reply');
    }
  };

  //Update UI immediately, then update server
  const handleEditComment = async (commentId, newContent) => {
    try {
      //Update UI immediately (Optimistic Update)
      setComments(prevComments =>
        prevComments.map(comment =>
          comment._id === commentId
            ? { ...comment, content: newContent }
            : comment
        )
      );

      // Send update to server
      await api.put(`/comments/${commentId}`, { content: newContent });
      toast.success('Comment updated successfully');
    } catch (error) {
      //  Rollback if error
      await fetchComments();
      toast.error('Failed to update comment');
    }
  };

  //  Update UI immediately, then send like to server
  const handleLikeComment = async (commentId) => {
    if (!isAuthenticated) {
      toast.error('Please login to like comments');
      return;
    }

    try {
      const userId = user.id || user._id;

      // Update UI immediately (Optimistic Update)
      setComments(prevComments =>
        prevComments.map(comment =>
          comment._id === commentId
            ? {
                ...comment,
                likes: comment.likes?.some(id => id.toString() === userId.toString())
                  ? comment.likes.filter(id => id.toString() !== userId.toString())
                  : [...(comment.likes || []), userId]
              }
            : comment
        )
      );

      //Send like to server
      await api.put(`/comments/${commentId}/like`);
    } catch (error) {
      // Rollback if error
      await fetchComments();
      toast.error('Failed to like comment');
    }
  };

  // Like reply - Update UI immediately, then send to server
  const handleLikeReply = async (parentCommentId, replyId) => {
    if (!isAuthenticated) {
      toast.error('Please login to like replies');
      return;
    }

    try {
      const userId = user.id || user._id;

      // Update UI immediately (Optimistic Update)
      setComments(prevComments =>
        prevComments.map(comment =>
          comment._id === parentCommentId
            ? {
                ...comment,
                replies: comment.replies?.map(reply =>
                  reply._id === replyId
                    ? {
                        ...reply,
                        likes: reply.likes?.some(id => id.toString() === userId.toString())
                          ? reply.likes.filter(id => id.toString() !== userId.toString())
                          : [...(reply.likes || []), userId]
                      }
                    : reply
                ) || []
              }
            : comment
        )
      );

      // Send like to server
      await api.put(`/comments/${parentCommentId}/replies/${replyId}/like`);
    } catch (error) {
      //  Rollback if error
      await fetchComments();
      toast.error('Failed to like reply');
    }
  };

  // Delete reply - Update UI immediately, then send to server
  const handleDeleteReply = async (parentCommentId, replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;

    try {
      //Update UI immediately (Optimistic Update)
      setComments(prevComments =>
        prevComments.map(comment =>
          comment._id === parentCommentId
            ? {
                ...comment,
                replies: comment.replies?.filter(reply => reply._id !== replyId) || []
              }
            : comment
        )
      );

      // Send delete to server
      await api.delete(`/comments/${parentCommentId}/replies/${replyId}`);
      toast.success('Reply deleted successfully');
    } catch (error) {
      //Rollback if error
      await fetchComments();
      toast.error('Failed to delete reply');
    }
  };

  // Edit reply - Update UI immediately, then update server
const handleEditReply = async (parentCommentId, replyId, newContent) => {
  if (!newContent.trim()) {
    toast.error('Reply cannot be empty');
    return;
  }

  try {


    //  Update UI immediately (Optimistic Update)
    setComments(prevComments =>
      prevComments.map(comment =>
        comment._id === parentCommentId
          ? {
              ...comment,
              replies: comment.replies?.map(reply =>
                reply._id === replyId
                  ? { ...reply, content: newContent, isEdited: true }
                  : reply
              ) || []
            }
          : comment
      )
    );

    //  Send update to server
    const response = await api.put(
      `/comments/${parentCommentId}/replies/${replyId}`,
      { content: newContent }
    );

  } catch (error) {
    await fetchComments();
  }
};

const optimizeImage = (url) => {
  if (!url) return url;

  // If already optimized, return as-is
  if (url.includes("f_auto") || url.includes("q_auto")) return url;

  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};


  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <div className="flex items-center space-x-3 mb-6">
        <FaComment className="text-2xl text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Comments ({comments.length})
        </h2>
      </div>

      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex items-start space-x-4">
            {user?.profileImage && (
              <img
                src={optimizeImage(user.profileImage)}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white resize-none"
                rows="3"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Please <a href="/login" className="text-primary-600 hover:underline">login</a> to comment
          </p>
        </div>
      )}

      {comments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments
            .filter(comment => !comment.parentComment)
            .map((comment) => (
              <Comment
                key={comment._id}
                comment={comment}
                onDelete={handleDeleteComment}
                onReply={handleReply}
                onEdit={handleEditComment}
                onEditReply={handleEditReply}
                onLike={handleLikeComment}
                onLikeReply={handleLikeReply}
                onDeleteReply={handleDeleteReply}
                postOwnerId={postOwnerId}
                currentUser={user}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
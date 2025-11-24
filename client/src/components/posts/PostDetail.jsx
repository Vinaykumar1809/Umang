import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import moment from 'moment';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaEye, FaUser, FaEdit, FaTrash, FaComment, FaHeart, FaRegHeart } from 'react-icons/fa';
import { useAuth } from '../../../context/authContext';
import CommentSection from '../../components/comments/CommentSection';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);

  const defaultProfilePic = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/posts/${id}`);
      setPost(res.data.data);
      setLoading(false);
    } catch {
      toast.error('Failed to fetch post');
      setLoading(false);
      navigate('/blog');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${id}`);
      toast.success('Post deleted successfully');
      navigate('/blog');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const canEditDelete = () => {
    if (!user || !post) return false;
    const userId = (user.id || user._id || '').toString();
    const authorId = post.author?._id?.toString() || post.author;
    if (user.role === 'ADMIN') return true;
    return userId === authorId;
  };

  const isLiked = () => {
    if (!post || !isAuthenticated) return false;
    const userId = user.id || user._id;
    return post.likes?.some(u => u.toString() === userId.toString());
  };

  //  Real-time like without page refresh
  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Login to like posts');
      return;
    }

    try {
      setLiking(true);
      const userId = user.id || user._id;
      const currentlyLiked = isLiked();


      setPost(prevPost => ({
        ...prevPost,
        likes: currentlyLiked
          ? prevPost.likes.filter(id => id.toString() !== userId.toString())
          : [...prevPost.likes, userId]
      }));

  
      await api.put(`/posts/${id}/like`);
    } catch {
     
      await fetchPost();
      toast.error('Failed to update like');
    } finally {
      setLiking(false);
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Post Not Found
          </h2>
          <button
            onClick={() => navigate('/blog')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Posts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={() => navigate('/blog')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition"
        >
          <FaArrowLeft />
          <span>Back to Posts</span>
        </button>

        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          {/*Only render featured image if it exists */}
          {post.featuredImage && (
            <div className="w-full h-96 overflow-hidden">
              <img
                src={optimizeImage(post.featuredImage)}
                alt={post.title}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultProfilePic;
                }}
              />
            </div>
          )}

          <div className="p-8">
            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              {post.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                {post.author?.profileImage ? (
                  <img
                    src={optimizeImage(post.author.profileImage)}
                    alt={post.author.username}
                    className="w-12 h-12 rounded-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultProfilePic;
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <FaUser className="text-gray-600 dark:text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {post.author?.username || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Author</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <FaEye />
                <span className="text-sm">{post.views || 0} views</span>
              </div>

              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <FaComment />
                <span className="text-sm">{post.comments?.length || 0} comments</span>
              </div>

              <div className="ml-auto flex space-x-2">
                {canEditDelete() && (
                  <>
                    <Link
                      to={`/member/edit-post/${post._id}`}
                      className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      <FaEdit />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                    >
                      <FaTrash />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                {/* Like Button */}
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <button
                    onClick={handleLike}
                    disabled={liking}
                    className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition"
                  >
                    {isLiked() ? (
                      <FaHeart className="text-red-600" size={30} />
                    ) : (
                      <FaRegHeart size={30} />
                    )}
                    <span>{post.likes?.length || 0}</span>
                  </button>
                </div>

                {/* Published Date */}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Published: {moment(post.publishedAt || post.createdAt).format('MMMM DD, YYYY')}
                </div>

                {/* Updated Date */}
                {post.isEdited && post.editHistory && post.editHistory.length > 0 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Last updated: {moment(post.editHistory[post.editHistory.length - 1].editedAt).fromNow()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </article>

        <div className="mt-8">
          <CommentSection postId={post._id} postOwnerId={post.author._id} />
        </div>
      </div>
    </div>
  );
};

export default PostDetail;

import React from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { FaEye, FaComment, FaUser, FaHeart } from 'react-icons/fa';

// Utility to remove HTML tags
const stripHtml = (html) => {
  return html.replace(/<[^>]+>/g, '');
};

const optimizeImage = (url) => {
  if (!url) return url;

  // If already optimized, return as-is
  if (url.includes("f_auto") || url.includes("q_auto")) return url;

  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};



const PostCard = ({ post }) => {
  // Clean excerpt from content
  const textExcerpt = post.content 
    ? stripHtml(post.content).substring(0, 150) + '...' 
    : 'No content available';

  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
     


      {/* Content Section */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition line-clamp-2">
          <Link to={`/blog/${post._id}`}>{post.title}</Link>
        </h2>

        {/* Excerpt */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 flex-grow">
          {textExcerpt}
        </p>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-auto">
          {/* Author and Stats */}
          <div className="flex items-center justify-between">
            {/* Author Info */}
            <div className="flex items-center space-x-2 flex-1">
              {post.author?.profileImage ? (
                <img
                  src={optimizeImage(post.author.profileImage)}
                  alt={post.author.username}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                  <FaUser className="text-gray-600 dark:text-gray-400 text-sm" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {post.author?.username || 'Unknown'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {moment(post.publishedAt || post.createdAt).fromNow()}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400 text-xs ml-2 flex-shrink-0">
              <div className="flex items-center space-x-1" title="Views">
                <FaEye />
                <span>{post.views || 0}</span>
              </div>
              {post.comments && post.comments.length > 0 && (
                <div className="flex items-center space-x-1" title="Comments">
                  <FaComment />
                  <span>{post.comments.length}</span>
                </div>
              )}
              <div className="flex items-center space-x-1" title="Likes">
                <FaHeart />
                <span>{post.likes?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;

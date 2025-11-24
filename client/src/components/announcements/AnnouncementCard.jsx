import React from 'react';
import moment from 'moment';
import { FaStar, FaExternalLinkAlt, FaUser, FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../../context/authContext.jsx';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const AnnouncementCard = ({ announcement, onDelete, onEdit, isHero = false }) => {
  const { user } = useAuth();

  const handleEdit = () => {
    if (onEdit) {
      onEdit(announcement._id);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await api.delete(`/announcements/${announcement._id}`);
      toast.success('Announcement deleted');
      if (onDelete) onDelete(announcement._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete announcement');
    }
  };

  const optimizeImage = (url) => {
  if (!url) return url;

  // If already optimized, return as-is
  if (url.includes("f_auto") || url.includes("q_auto")) return url;

  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};

  const validLinks = Array.isArray(announcement.links)
    ? announcement.links.filter((link) => link && link.url)
    : [];

  if (isHero) {
    return (
      <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-2xl overflow-hidden mb-8">
        {announcement.image && (
          <div className="absolute inset-0 opacity-20">
            <img
              src={optimizeImage(announcement.image)}
              alt={announcement.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="relative z-10 container mx-auto px-6 py-16 text-center">
          <div className="flex items-center justify-center mb-4">
            <FaStar className="text-yellow-400 text-2xl mr-2" />
            <span className="text-yellow-400 font-semibold text-lg uppercase tracking-wide">
              Announcement
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {announcement.title}
          </h1>
          <div
            className="text-xl text-white/90 mb-6 max-w-3xl mx-auto"
            dangerouslySetInnerHTML={{ __html: announcement.content }}
          />

          {validLinks.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4">
              {announcement.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  <span>{link.title || 'Visit'}</span>
                  <FaExternalLinkAlt />
                </a>
              ))}
            </div>
          )}
          <div className="mt-6 text-white/70 text-sm">
            Posted {moment(announcement.createdAt).fromNow()}
          </div>
        </div>
      </div>
    );
  }

  // Regular card
  return (
    <article className="rounded-xl shadow-lg overflow-hidden transition-all duration-300
      bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200
      dark:from-gray-800 dark:via-gray-900 dark:to-gray-950
      hover:shadow-2xl hover:scale-[1.01] border border-gray-200 dark:border-gray-700">
      <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-indigo-500 to-cyan-400" />
      <div className="p-6 sm:p-8 ">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              {announcement.isFeatured && <FaStar className="text-yellow-500" title="Featured" />}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {announcement.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Image */}
        {announcement.image && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img
              src={optimizeImage(announcement.image)}
              alt={announcement.title}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Render HTML content properly */}
        <div className="mb-4">
          <div
            className="text-gray-700 dark:text-gray-300 whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: announcement.content }}
          />
        </div>

        {/* Links */}
        {validLinks.length > 0 && (
          <div className="mb-4 space-y-1">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Related Links:
            </p>
            {announcement.links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-primary-600 dark:text-primary-400 hover:underline text-sm"
              >
                <FaExternalLinkAlt size={12} />
                <span>{link.title || 'Visit'}</span>
              </a>
            ))}
          </div>
        )}

        {/* Footer & Admin Controls */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {announcement.author?.profileImage ? (
              <img
                src={optimizeImage(announcement.author.profileImage)}
                alt={announcement.author.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <FaUser className="text-gray-600 dark:text-gray-400 text-sm" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {announcement.author?.username || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Posted {moment(announcement.createdAt).fromNow()}
              </p>
            </div>
          </div>

          {/* Admin Edit/Delete Buttons - ONLY in regular cards, NOT in hero */}
          {user?.role === 'ADMIN' && (
            <div className="flex space-x-3">
              <button
                onClick={handleEdit}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                <FaEdit className="mr-1" /> Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                <FaTrash className="mr-1" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default AnnouncementCard;

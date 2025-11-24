import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FaEdit, FaTrash, FaStar, FaRegStar } from 'react-icons/fa';
import moment from 'moment';
import EditAnnouncement from '../../pages/EditAnnouncement';

const AnnouncementManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcements/all');
      setAnnouncements(res.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch announcements');
      setLoading(false);
    }
  };

  const handleEdit = (announcement) => {
    if (!announcement?._id) {
      toast.error('Invalid announcement');
      return;
    }
    setSelectedAnnouncementId(announcement._id);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedAnnouncementId(null);
    fetchAnnouncements();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await api.delete(`/announcements/${id}`);
      toast.success('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to delete announcement');
    }
  };

  const handleToggleFeatured = async (announcement) => {
    try {
      await api.put(`/announcements/${announcement._id}/toggle-featured`, {
        featuredUntil: announcement.isFeatured
          ? null
          : moment().add(7, 'days').toISOString(),
      });
      toast.success('Featured status updated');
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to update featured status');
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Announcements Manager</h1>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedAnnouncementId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl my-8 relative">
            <button
              onClick={closeEditModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 dark:hover:text-gray-300 z-10"
              aria-label="Close"
            >
              ✕
            </button>
            <EditAnnouncement announcementId={selectedAnnouncementId} onClose={closeEditModal} />
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">No announcements yet</p>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{announcement.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {announcement.author?.username || 'Admin'} • {moment(announcement.createdAt).fromNow()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleFeatured(announcement)}
                    className={`p-2 rounded-lg transition ${
                      announcement.isFeatured
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-600'
                    }`}
                  >
                    {announcement.isFeatured ? <FaStar /> : <FaRegStar />}
                  </button>
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement._id)}
                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {announcement.image && (
                <img src={optimizeImage(announcement.image)} alt={announcement.title} className="w-full max-h-48 object-cover rounded-lg mb-4" />
              )}

              <p className="text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">{announcement.content.replace(/<[^>]*>/g, '')}</p>

              <div className="flex gap-2 flex-wrap mt-4">
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  {announcement.targetAudience}
                </span>
                {!announcement.isActive && <span className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full">Inactive</span>}
                {announcement.isFeatured && <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">Featured</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementManager;

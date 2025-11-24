import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AnnouncementCard from '../components/announcements/AnnouncementCard';
import EditAnnouncement from './EditAnnouncement';
import toast from 'react-hot-toast';
import { FaBullhorn } from 'react-icons/fa';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      // Use public endpoint - no authentication required
      const res = await axios.get('/api/announcements');
      setAnnouncements(res.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch announcements');
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (filter === 'all') return true;
    if (filter === 'featured') return announcement.isFeatured;
    return true;
  });

  const handleDelete = (deletedId) => {
    setAnnouncements((prev) => prev.filter((a) => a._id !== deletedId));
  };

  const handleEdit = (announcementId) => {
    setSelectedAnnouncementId(announcementId);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedAnnouncementId(null);
    fetchAnnouncements();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <FaBullhorn className="text-4xl text-primary-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Announcements
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with the latest news and announcements
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('featured')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'featured'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Featured
          </button>
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
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No announcements found
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement._id}
                announcement={announcement}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;

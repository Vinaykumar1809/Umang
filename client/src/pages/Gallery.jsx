import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
} from 'react-icons/fa';
import { useAuth } from '../../context/authContext'; 

export default function Gallery() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');


  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/gallery/events');
      if (data.success) setEvents(data.events);
    } catch {
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const startEditing = (event) => {
    setEditingEventId(event._id);
    setEditingTitle(event.title);
    setEditingDescription(event.description || '');
  };

  const cancelEditing = () => {
    setEditingEventId(null);
    setEditingTitle('');
    setEditingDescription('');
  };

  const saveEdits = async () => {
    if (!editingTitle.trim()) {
      toast.error('Event title is required');
      return;
    }
    try {
      const res = await api.put(`/gallery/events/${editingEventId}`, {
        title: editingTitle,
        description: editingDescription,
      });
      if (res.data.success) {
        setEvents(
          events.map((e) => (e._id === editingEventId ? res.data.event : e))
        );
        toast.success('Event updated');
        cancelEditing();
      }
    } catch {
      toast.error('Failed to update event');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await api.delete(`/gallery/events/${id}`);
      if (res.data.success) {
        if (res.data.publicIds?.length) {
          for (const pid of res.data.publicIds) {
            await api.post('/galleryImages/delete', { publicId: pid });
          }
        }
        setEvents(events.filter((e) => e._id !== id));
        toast.success('Event deleted');
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleImageUpload = async (eventId, file) => {
    if (!file) return;
    setUploading((prev) => ({ ...prev, [eventId]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/galleryImages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (uploadRes.data.success) {
        const addRes = await api.post(`/gallery/events/${eventId}/images`, {
          imageUrl: uploadRes.data.secureUrl,
          publicId: uploadRes.data.publicId,
        });
        if (addRes.data.success) {
          setEvents(
            events.map((e) => (e._id === eventId ? addRes.data.event : e))
          );
          toast.success('Image added');
        }
      }
    } catch {
      toast.error('Failed to upload');
    } finally {
      setUploading((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  const handleDeleteImage = async (eventId, imageId) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      const res = await api.delete(`/gallery/events/${eventId}/images/${imageId}`);
      if (res.data.success) {
        await api.post('/galleryImages/delete', { publicId: res.data.publicId });
        setEvents(
          events.map((e) => (e._id === eventId ? res.data.event : e))
        );
        toast.success('Image deleted');
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  const scrollCarousel = (id, dir) => {
    const el = document.getElementById(id);
    if (el)
      el.scrollBy({ left: dir === 'left' ? -500 : 500, behavior: 'smooth' });
  };

  const optimizeImage = (url) => {
  if (!url) return url;

  // If already optimized, return as-is
  if (url.includes("f_auto") || url.includes("q_auto")) return url;

  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};


  const visibleEvents = isAdmin
    ? events
    : events.filter((e) => e.images && e.images.length > 0);

  return (
    <div className="min-h-screen bg-white text-gray-700 dark:text-gray-200 dark:bg-[rgb(16,23,42)] py-8">
      <div className="max-w-6xl mx-auto w-full px-2 sm:px-4">
        <h1 className="text-4xl font-bold mb-10 text-center">Gallery</h1>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : visibleEvents.length === 0 ? (
          <p className="text-lg text-center mt-16">No events in gallery yet.</p>
        ) : (
          visibleEvents.map((event) => (
            <div key={event._id} className="mb-12 group">
              <div className="flex flex-wrap justify-between items-start mb-4">
                <div className="flex-1">
                  {isAdmin && editingEventId === event._id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="w-full rounded border-2 border-blue-600 px-3 py-2 text-gray-900 bg-white"
                        placeholder="Event Title"
                        required
                      />
                      <textarea
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        className="w-full rounded border-2 border-blue-600 px-3 py-2 text-gray-900 bg-white"
                        placeholder="Event Description (optional)"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdits}
                          className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 font-semibold flex items-center gap-2"
                        >
                          <FaCheck /> Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="bg-gray-500 hover:bg-gray-600 text-white rounded px-4 py-2 font-semibold flex items-center gap-2"
                        >
                          <FaTimes /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold">{event.title}</h2>
                      {event.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {event.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {event.images.length} photo{event.images.length !== 1 ? 's' : ''}
                      </p>
                    </>
                  )}
                </div>

                {isAdmin && editingEventId !== event._id && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEditing(event)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-semibold flex items-center gap-2"
                      title="Edit Event"
                    >
                      <FaEdit size={18} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded font-semibold flex items-center gap-2"
                      title="Delete Event"
                    >
                      <FaTrash size={18} /> Delete
                    </button>
                  </div>
                )}
              </div>

              {isAdmin && (
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium w-fit mb-3">
                  <FaPlus size={16} />
                  <span>Add Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      Array.from(e.target.files).forEach((file) => handleImageUpload(event._id, file));
                      e.target.value = '';
                    }}
                    disabled={uploading[event._id]}
                    className="hidden"
                  />
                </label>
              )}

              {uploading[event._id] && (
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-3">⏳ Uploading...</div>
              )}

              <div className="relative group/carousel mt-2">
                {event.images.length > 0 ? (
                  <>
                    <button
                      onClick={() => scrollCarousel(`carousel-${event._id}`, 'left')}
                      className="absolute left-0 z-10 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-full opacity-0 group-hover/carousel:opacity-100 transition"
                    >
                      <FaChevronLeft size={20} />
                    </button>
                    <div
                      id={`carousel-${event._id}`}
                      className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                      style={{ scrollBehavior: 'smooth' }}
                    >
                      {event.images.map((image) => (
                        <div
                          key={image._id}
                          className="flex-shrink-0 w-64 h-40 relative rounded-xl overflow-hidden shadow-lg group/image"
                        >
                          <img src={optimizeImage(image.url)} alt="Event" className="w-full h-full object-cover" />
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteImage(event._id, image._id)}
                              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 opacity-0 group-hover/image:opacity-100 transition"
                              title="Delete image"
                            >
                              <FaTrash size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => scrollCarousel(`carousel-${event._id}`, 'right')}
                      className="absolute right-0 z-10 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-full opacity-0 group-hover/carousel:opacity-100 transition"
                    >
                      <FaChevronRight size={20} />
                    </button>
                  </>
                ) : (
                  isAdmin && (
                    <div className="py-12 text-gray-400 dark:text-gray-600 text-center rounded-lg bg-gray-100 dark:bg-gray-800">
                      No images yet. Use Add Photos button above to get started!
                    </div>
                  )
                )}
              </div>
            </div>
          ))
        )}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </div>
  );
}

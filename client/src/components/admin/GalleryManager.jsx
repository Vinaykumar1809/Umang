import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  FaPlus, FaTrash, FaChevronLeft, FaChevronRight,
  FaEdit, FaCheck, FaTimes, FaSpinner
} from 'react-icons/fa';

export default function GalleryManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [uploading, setUploading] = useState({});
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => { fetchEvents(); }, []);
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/gallery/events');
      if (data.success) setEvents(data.events);
    } catch {
      toast.error('Failed to load events');
    } finally { setLoading(false); }
  };

  const handleCreateEvent = async e => {
    e.preventDefault();
    if (!newEventTitle.trim()) return toast.error('Event title required');
    setCreating(true);
    try {
      const { data } = await api.post('/gallery/events', {
        title: newEventTitle, description: newEventDescription
      });
      if (data.success) {
        setEvents([data.event, ...events]);
        setNewEventTitle('');
        setNewEventDescription('');
        toast.success('Event created!');
      }
    } catch { toast.error('Create failed'); }
    finally { setCreating(false); }
  };

  const handleUpdateEvent = async e => {
    e.preventDefault();
    if (!editingEvent.title.trim()) return toast.error('Event title required');
    try {
      const { data } = await api.put(`/gallery/events/${editingEvent._id}`, {
        title: editingEvent.title,
        description: editingEvent.description
      });
      if (data.success) {
        setEvents(events.map(ev => ev._id === editingEvent._id ? data.event : ev));
        setEditingEvent(null);
        toast.success('Updated!');
      }
    } catch { toast.error('Update failed'); }
  };

  const handleImageUpload = async (eventId, file) => {
    if (!file) return;
    setUploading(u => ({ ...u, [eventId]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/galleryImages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (uploadRes.data.success) {
        const pushRes = await api.post(`/gallery/events/${eventId}/images`, {
          imageUrl: uploadRes.data.secureUrl,
          publicId: uploadRes.data.publicId
        });
        if (pushRes.data.success) {
          setEvents(events.map(ev => ev._id === eventId ? pushRes.data.event : ev));
          toast.success('Image added');
        }
      }
    } catch { toast.error('Upload failed'); }
    finally { setUploading(u => ({ ...u, [eventId]: false })); }
  };

  const handleDeleteImage = async (eventId, imageId) => {
    if (!window.confirm('Delete image?')) return;
    try {
      const res = await api.delete(`/gallery/events/${eventId}/images/${imageId}`);
      if (res.data.success) {
        await api.post('/galleryImages/delete', { publicId: res.data.publicId });
        setEvents(events.map(ev => ev._id === eventId ? res.data.event : ev));
        toast.success('Image deleted');
      }
    } catch { toast.error('Delete failed'); }
  };

  const handleDeleteEvent = async eventId => {
    if (!window.confirm('Delete entire event and all images?')) return;
    try {
      const res = await api.delete(`/gallery/events/${eventId}`);
      if (res.data.success) {
        if (res.data.publicIds?.length) {
          for (const pid of res.data.publicIds) {
            await api.post('/galleryImages/delete', { publicId: pid });
          }
        }
        setEvents(events.filter(ev => ev._id !== eventId));
        toast.success('Event deleted');
      }
    } catch { toast.error('Delete failed'); }
  };

  const optimizeImage = (url) => {
  if (!url) return url;

  // If already optimized, return as-is
  if (url.includes("f_auto") || url.includes("q_auto")) return url;

  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};


  const scrollCarousel = (id, dir) => {
    const el = document.getElementById(id);
    if (el) el.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
  };


  return (
    <div className="min-h-screen bg-white text-gray-700 dark:text-gray-200 dark:bg-[rgb(16,23,42)] py-8">
      <div className="max-w-6xl mx-auto w-full px-2 sm:px-4">
        <h1 className="text-4xl font-bold mb-8 text-center">Manage Gallery</h1>

        {/* Create Event Form */}
        <form onSubmit={handleCreateEvent}
              className="mb-12 w-full max-w-xl mx-auto space-y-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 py-6 px-8 shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Create New Event</h2>
          <div>
            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-200">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newEventTitle}
              onChange={e => setNewEventTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
              placeholder="Enter event title"
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-200">
              Description
            </label>
            <textarea
              value={newEventDescription}
              onChange={e => setNewEventDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
              rows="2"
              placeholder="Event description (optional)"
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-semibold transition shadow disabled:opacity-80 flex items-center gap-2 justify-center"
          >
            {creating ? <FaSpinner className="animate-spin" /> : <FaPlus />}
            {creating ? "Creating..." : "Create Event"}
          </button>
        </form>

        {/* Event Cards */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <FaSpinner className="animate-spin h-12 w-12 text-blue-600" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-lg text-center mt-16">No events yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-9 max-w-6xl mx-auto">
            {events.map(event => (
              <div key={event._id}
                   className="mb-10 p-6 rounded-xl shadow bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex flex-col">
                <div className="flex flex-wrap md:flex-nowrap gap-4 w-full justify-between mb-2">
                  {/* Event Info */}
                  <div className="flex-1">
                    <label className="block mb-1 font-semibold text-gray-900 dark:text-gray-200">
                      Event Title <span className="text-red-500">*</span>
                    </label>
                    {editingEvent?._id === event._id ? (
                      <input
                        type="text"
                        value={editingEvent.title}
                        onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
                      />
                    ) : (
                      <span className="text-xl font-bold">{event.title}</span>
                    )}
                    <label className="block mt-2 mb-1 font-semibold text-gray-900 dark:text-gray-200">
                      Description
                    </label>
                    {editingEvent?._id === event._id ? (
                      <textarea
                        value={editingEvent.description}
                        onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows={2}
                      />
                    ) : (
                      <span className="text-base">{event.description || <span className="italic text-gray-400">No description</span>}</span>
                    )}
                  </div>
                  {/* Edit/Delete buttons */}
                  <div className="flex gap-1 items-start">
                    {editingEvent?._id === event._id ? (
                      <div className="flex gap-2 mt-3">
                        <button type="button"
                                className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 font-semibold"
                                onClick={handleUpdateEvent}>
                          <FaCheck />
                        </button>
                        <button type="button"
                                className="bg-gray-400 hover:bg-gray-500 text-white rounded-lg px-4 py-2"
                                onClick={() => setEditingEvent(null)}>
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1 font-semibold"
                                title="Edit event"
                                onClick={() => setEditingEvent(event)}>
                          <FaEdit />
                        </button>
                        <button className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1 font-semibold"
                                title="Delete event"
                                onClick={() => handleDeleteEvent(event._id)}>
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-200">
                    Event Photos
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center whitespace-nowrap">
                      <span>Add Image</span>
                      {uploading[event._id] && (<FaSpinner className="animate-spin ml-2" />)}
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={e => {
                          Array.from(e.target.files).forEach(file => handleImageUpload(event._id, file));
                          e.target.value = '';
                        }}
                        disabled={uploading[event._id]}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  {/* Images Carousel */}
                  <div className="relative group/carousel mt-2">
                    {event.images.length > 0 ? (
                      <>
                        <button
                          onClick={() => scrollCarousel(`carousel-admin-${event._id}`, 'left')}
                          className="absolute left-0 z-10 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full opacity-0 group-hover/carousel:opacity-100 transition"
                        ><FaChevronLeft size={20} /></button>
                        <div id={`carousel-admin-${event._id}`} className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2">
                          {event.images.map(image => (
                            <div key={image._id}
                              className="flex-shrink-0 w-52 h-36 relative rounded-xl overflow-hidden shadow">
                              <img src={optimizeImage(image.url)} alt="" className="w-full h-full object-cover" />
                              <button
                                onClick={() => handleDeleteImage(event._id, image._id)}
                                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 opacity-0 group-hover/carousel:opacity-100 transition"
                                title="Delete image"
                              ><FaTrash size={16} /></button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => scrollCarousel(`carousel-admin-${event._id}`, 'right')}
                          className="absolute right-0 z-10 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full opacity-0 group-hover/carousel:opacity-100 transition"
                        ><FaChevronRight size={20} /></button>
                      </>
                    ) : (
                      <div className="py-8 text-center text-gray-400 dark:text-gray-600">No images yet. Upload above!</div>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{event.images.length} photo{event.images.length !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        )}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {display:none;}
          .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none;}
        `}</style>
      </div>
    </div>
  );
}

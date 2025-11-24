import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FaSpinner } from 'react-icons/fa';

const initialLink = { title: '', url: '' };

const EditAnnouncement = ({ announcementId, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: null,
    imagePublicId: null,
    imagePreview: null,
    links: [initialLink],
    isFeatured: false,
    featuredUntil: '',
    targetAudience: 'all',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        if (!announcementId) {
          toast.error('Invalid announcement ID');
          setFetching(false);
          return;
        }
        const res = await api.get(`/announcements/${announcementId}`);
        const data = res.data.data;

        setFormData({
          title: data.title || '',
          content: data.content || '',
          image: data.image || null,
          imagePublicId: data.imagePublicId || null,
          imagePreview: data.image || null,
          links: Array.isArray(data.links) && data.links.length > 0 ? data.links : [initialLink],
          isFeatured: data.isFeatured || false,
          featuredUntil: data.featuredUntil ? data.featuredUntil.split('T')[0] : '',
          targetAudience: data.targetAudience || 'all',
          isActive: data.isActive ?? true,
        });
        setFetching(false);
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error('Failed to fetch announcement.');
        setFetching(false);
      }
    };
    fetchAnnouncement();
  }, [announcementId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleContentChange = (value) => {
    setFormData((prev) => ({ ...prev, content: value }));
  };

  const handleLinkChange = (index, field, value) => {
    const newLinks = formData.links.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    );
    setFormData((prev) => ({ ...prev, links: newLinks }));
  };

  const addLink = () => {
    setFormData((prev) => ({ ...prev, links: [...prev.links, initialLink] }));
  };

  const removeLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  // Image upload (blue button + preview)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2 MB');
      return;
    }

    setImageLoading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const response = await api.post('/images/upload', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData((prev) => ({
        ...prev,
        image: response.data.secure_url,
        imagePublicId: response.data.public_id,
        imagePreview: response.data.secure_url,
      }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setImageLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: null,
      imagePublicId: null,
      imagePreview: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error('Title and Content are required');
      return;
    }
    try {
      setLoading(true);
      const featuredUntilDate = formData.featuredUntil ? new Date(formData.featuredUntil) : null;
      await api.put(`/announcements/${announcementId}`, {
        title: formData.title,
        content: formData.content,
        image: formData.image,
        imagePublicId: formData.imagePublicId,
        links: formData.links,
        isFeatured: formData.isFeatured,
        featuredUntil: featuredUntilDate,
        targetAudience: formData.targetAudience,
        isActive: formData.isActive,
      });
      toast.success('Announcement updated successfully');
      setLoading(false);
      if (onClose) onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update announcement');
      setLoading(false);
    }
  };

  const optimizeImage = (url) => {
  if (!url) return url;

  // If already optimized, return as-is
  if (url.includes("f_auto") || url.includes("q_auto")) return url;

  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};


  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image', 'clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'link',
    'image',
  ];

  if (fetching)
    return <div className="text-center mt-10 text-gray-600 dark:text-gray-300">Loading announcement data...</div>;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          maxLength="200"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="Announcement title"
          required
        />
      </div>
      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Content *
        </label>
        <ReactQuill
          value={formData.content}
          onChange={handleContentChange}
          modules={modules}
          formats={formats}
          theme="snow"
          className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          placeholder="Write your announcement..."
        />
      </div>
      {/* Image upload - button and preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Image</label>
        <div className="flex items-center gap-2 mb-2">
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center whitespace-nowrap">
            <span>Upload Image</span>
            {imageLoading && <FaSpinner className="animate-spin ml-2" />}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={imageLoading}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        {formData.imagePreview && (
          <div className="relative mt-2 inline-block">
            <img
              src={optimizeImage(formData.imagePreview)}
              alt="Preview"
              className="max-w-xs h-auto rounded-lg border border-gray-300 dark:border-gray-600"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              title="Remove image"
              className="absolute top-1 right-1 w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs font-bold"
            >
              ×
            </button>
          </div>
        )}
      </div>
      {/* Links */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Related Links
        </label>
        {formData.links.map((link, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={link.title}
              onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
              placeholder="Link title"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
            <input
              type="url"
              value={link.url}
              onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
              placeholder="https://..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
            {formData.links.length > 1 && (
              <button
                type="button"
                onClick={() => removeLink(index)}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addLink}
          className="text-sm text-primary-600 hover:text-primary-700 mt-2"
        >
          + Add Link
        </button>
      </div>
      {/* Target Audience */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Target Audience
        </label>
        <select
          name="targetAudience"
          value={formData.targetAudience}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All</option>
          <option value="users">Users</option>
          <option value="members">Members</option>
          <option value="admins">Admins</option>
        </select>
      </div>
      {/* Featured */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isFeatured"
            checked={formData.isFeatured}
            onChange={handleChange}
            className="rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Featured Announcement
          </span>
        </label>
        {formData.isFeatured && (
          <input
            type="date"
            name="featuredUntil"
            value={formData.featuredUntil}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
        )}
      </div>
      {/* Active */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="rounded"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
      </label>
      {/* Buttons */}
      <div className="flex gap-4 pt-4 border-t dark:border-gray-700">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-lg disabled:opacity-50 transition"
        >
          {loading ? 'Updating...' : 'Update'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default EditAnnouncement;

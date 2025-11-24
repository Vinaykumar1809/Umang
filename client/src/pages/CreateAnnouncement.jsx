import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FaSpinner } from 'react-icons/fa';

const initialLink = { title: '', url: '' };

const CreateAnnouncement = () => {
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
  const [imageLoading, setImageLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleContentChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      content: value,
    }));
  };

  const handleLinkChange = (index, field, value) => {
    const newLinks = formData.links.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    );
    setFormData((prev) => ({
      ...prev,
      links: newLinks,
    }));
  };

  const addLink = () => {
    setFormData((prev) => ({
      ...prev,
      links: [...prev.links, initialLink],
    }));
  };

  const removeLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  // Revised: single-button image upload with preview and remove
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
      toast.error('Title and content are required');
      return;
    }
    try {
      setLoading(true);
      const featuredUntilDate = formData.featuredUntil
        ? new Date(formData.featuredUntil)
        : null;

      await api.post('/announcements', {
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
      toast.success('Announcement created successfully');
      navigate('/admin/announcements');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create announcement');
    } finally {
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
  const formats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link', 'image'];

  return (
    <div className="container mx-auto px-6 py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Create Announcement</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-900 dark:text-gray-100 p-6 rounded-xl shadow-md">

        {/* Title */}
        <div>
          <label htmlFor="title" className="block mb-1 font-semibold">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            maxLength={200}
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block mb-1 font-semibold">Content</label>
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <ReactQuill
              value={formData.content}
              onChange={handleContentChange}
              modules={modules}
              formats={formats}
              theme="snow"
            />
          </div>
        </div>

        {/* Image Upload Section */}
        <div>
          <label className="block mb-1 font-semibold">Image</label>
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
        <fieldset>
          <legend className="font-semibold mb-1">Links</legend>
          {formData.links.map((link, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 mb-3 items-center">
              <input
                type="text"
                placeholder="Link Title"
                value={link.title}
                onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                className="col-span-5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1"
              />
              <input
                type="url"
                placeholder="https://..."
                value={link.url}
                onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                className="col-span-6 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1"
              />
              {formData.links.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="col-span-1 text-red-500 hover:text-red-700 font-bold"
                  aria-label="Remove link"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addLink}
            className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
          >
            + Add another link
          </button>
        </fieldset>

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

        {/* Target Audience */}
        <div>
          <label htmlFor="targetAudience" className="block mb-1 font-semibold">Target Audience</label>
          <select
            id="targetAudience"
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded appearance-none"
          >
            <option value="all">All</option>
            <option value="users">Users</option>
            <option value="members">Members</option>
            <option value="admins">Admins</option>
          </select>
        </div>

        {/* Active */}
        <div>
          <label className="inline-flex items-center space-x-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="form-checkbox text-primary-600 dark:bg-gray-800 dark:border-gray-600"
            />
            <span>Active</span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Announcement'}
        </button>
      </form>
    </div>
  );
};

export default CreateAnnouncement;

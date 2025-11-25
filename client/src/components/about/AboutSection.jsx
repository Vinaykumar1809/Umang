import React, { useState } from 'react';
import axios from 'axios';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FaEdit, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../../context/authContext';

const AboutSection = ({ aboutData, onUpdate }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: aboutData?.title || 'About Us',
    vision: aboutData?.vision || '',
    mission: aboutData?.mission || '',
    description: aboutData?.description || '',
    image: aboutData?.image || '',
    imagePublicId: aboutData?.imagePublicId || null
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

    try {
      setUploadingImage(true);
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

      const response = await api.post('/images/upload', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        if (formData.imagePublicId) {
          try {
            await api.post('/images/delete',
              { publicId: formData.imagePublicId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }

        setFormData(prev => ({
          ...prev,
          image: response.data.secure_url,
          imagePublicId: response.data.public_id
        }));
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!formData.imagePublicId) {
      setFormData(prev => ({ ...prev, image: '', imagePublicId: null }));
      return;
    }

    if (!window.confirm('Are you sure you want to remove the current image?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.post('/images/delete',
        { publicId: formData.imagePublicId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFormData(prev => ({ ...prev, image: '', imagePublicId: null }));
      toast.success('Image removed');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description) {
      toast.error('Description is required');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await api.put('/aboutus', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('About Us updated successfully');
      setIsEditing(false);

      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Error updating about us:', error);
      toast.error(error.response?.data?.message || 'Failed to update About Us');
    } finally {
      setLoading(false);
    }
  };

  const optimizeImage = (url) => {
  if (!url) return url;
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};

  const handleCancel = () => {
    setFormData({
      title: aboutData?.title || 'About Us',
      vision: aboutData?.vision || '',
      mission: aboutData?.mission || '',
      description: aboutData?.description || '',
      image: aboutData?.image || '',
      imagePublicId: aboutData?.imagePublicId || null
    });
    setIsEditing(false);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <section className="w-full py-8 sm:py-12 md:py-16 px-4 sm:px-6 md:px-8 lg:px-16 bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto">
        {isEditing && isAdmin ? (
          // EDIT MODE
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md p-4 sm:p-6 md:p-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-6">Edit About Us</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Title</label>
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white" 
                  placeholder="Enter section title" 
                />
              </div>

              {/* Vision Textarea */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Vision (Optional)</label>
                <textarea 
                  name="vision" 
                  value={formData.vision} 
                  onChange={handleChange} 
                  rows="3" 
                  maxLength="1000" 
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white resize-none" 
                  placeholder="Enter your organization's vision" 
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.vision.length}/1000 characters</p>
              </div>

              {/* Mission Textarea */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mission (Optional)</label>
                <textarea 
                  name="mission" 
                  value={formData.mission} 
                  onChange={handleChange} 
                  rows="3" 
                  maxLength="1000" 
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white resize-none" 
                  placeholder="Enter your organization's mission" 
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.mission.length}/1000 characters</p>
              </div>

              {/* Description Textarea */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows="4" 
                  maxLength="2000" 
                  required 
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white resize-none" 
                  placeholder="Enter detailed description about your organization" 
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.description.length}/2000 characters</p>
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Image URL</label>
                <label className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base rounded-lg cursor-pointer transition duration-300 w-full sm:w-fit">
                  <span>Upload Image</span>
                  {uploadingImage && <FaSpinner className="animate-spin text-sm sm:text-base" />}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    disabled={uploadingImage} 
                    className="hidden" 
                  />
                </label>

                {/* Image Preview */}
                {formData.image && (
                  <div className="mt-4 flex flex-col items-start">
                    <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
                      <img 
                        src={optimizeImage(formData.image)} 
                        alt="Preview" 
                        className="w-full h-auto max-h-64 sm:max-h-72 md:max-h-80 object-contain rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600" 
                        onError={e => e.target.style.display = 'none'} 
                      />
                      <button 
                        type="button" 
                        onClick={handleRemoveImage} 
                        title="Remove image" 
                        className="absolute top-2 right-2 w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition duration-300"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Click × to remove image</p>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <button 
                  type="submit" 
                  disabled={loading || uploadingImage} 
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold text-sm sm:text-base rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  <FaCheck className="text-sm sm:text-base" /> {loading ? 'Saving...' : 'Save'}
                </button>
                <button 
                  type="button" 
                  onClick={handleCancel} 
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-semibold text-sm sm:text-base rounded-lg transition duration-300 w-full sm:w-auto"
                >
                  <FaTimes className="text-sm sm:text-base" /> Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          //DISPLAY MODE - Responsive Layout
          <div>
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
              <div className="flex-1 w-full">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-2">
                  {aboutData?.title || 'About Us'}
                </h1>
                {aboutData?.updatedBy && (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Last updated by {aboutData.updatedBy.username}
                  </p>
                )}
              </div>
              {isAdmin && (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-semibold text-sm sm:text-base rounded-lg transition duration-300 whitespace-nowrap"
                >
                  <FaEdit className="text-sm sm:text-base" /> Edit
                </button>
              )}
            </div>

            {/* Content Grid - Responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 mb-8">
              {/* Image Column - Responsive */}
              <div className="flex items-center justify-center order-2 md:order-1">
                {aboutData?.image ? (
                  <div className="w-full max-w-sm sm:max-w-md md:max-w-full">
                    <img 
                      src={optimizeImage(aboutData.image)} 
                      alt="About Us" 
                      className="w-full h-auto max-h-64 sm:max-h-72 md:max-h-96 object-contain rounded-lg shadow-md bg-gray-100 dark:bg-gray-700" 
                      onError={e => e.target.style.display = 'none'} 
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-sm sm:max-w-md md:max-w-full h-64 sm:h-72 md:h-96 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-md flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">No image available</p>
                  </div>
                )}
              </div>

              {/* Text Content Column - Responsive */}
              <div className="space-y-4 sm:space-y-6 md:space-y-8 order-1 md:order-2">
                {/* Who We Are Section */}
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-3 md:mb-4">
                    Who We Are
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    {aboutData?.description}
                  </p>
                </div>

                {/* Vision Section */}
                {aboutData?.vision && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 sm:p-5 md:p-6 rounded-lg border-l-4 border-primary-500 transform transition-all duration-300">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-primary-900 dark:text-blue-100 mb-2">
                      Our Vision
                    </h3>
                    <p className="text-sm sm:text-base md:text-lg text-blue-800 dark:text-blue-200 leading-relaxed">
                      {aboutData.vision}
                    </p>
                  </div>
                )}

                {/* Mission Section */}
                {aboutData?.mission && (
                  <div className="bg-purple-50 dark:bg-purple-900/30 p-4 sm:p-5 md:p-6 rounded-lg border-l-4 border-purple-500 transform transition-all duration-300">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      Our Mission
                    </h3>
                    <p className="text-sm sm:text-base md:text-lg text-purple-800 dark:text-purple-200 leading-relaxed">
                      {aboutData.mission}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutSection;

import React, { useState } from 'react';
import axios from 'axios';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaLinkedin, FaGithub,FaInstagram, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../../context/authContext';



const TeamSection = ({ teamMembers: initialTeamMembers, onUpdate }) => {
  const { user } = useAuth();
  const [teamMembers] = useState(initialTeamMembers || []);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    photo: '',
    photoPublicId: null,
    linkedinUrl: '',
    githubUrl: '',
    instagramUrl: ''
  });



  const isAdmin = user?.role === 'ADMIN';
  const defaultProfilePic = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';



  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      photo: '',
      photoPublicId: null,
      linkedinUrl: '',
      githubUrl: '',
      instagramUrl: ''
    });
    setEditingMember(null);
  };



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
        if (editingMember && formData.photoPublicId) {
          try {
            await api.post('/images/delete',
              { publicId: formData.photoPublicId },
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }



        setFormData(prev => ({
          ...prev,
          photo: response.data.secure_url,
          photoPublicId: response.data.public_id
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



  const handleRemovePhoto = async () => {
    if (!formData.photoPublicId) {
      setFormData(prev => ({ ...prev, photo: '', photoPublicId: null }));
      return;
    }



    if (!window.confirm('Are you sure you want to remove the current photo?')) return;



    try {
      const token = localStorage.getItem('token');
      await api.post('/images/delete',
        { publicId: formData.photoPublicId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );



      setFormData(prev => ({ ...prev, photo: '', photoPublicId: null }));
      toast.success('Photo removed, default photo will be shown');
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Failed to remove photo');
    }
  };



  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      position: member.position || '',
      photo: member.photo || '',
      photoPublicId: member.photoPublicId || null,
      linkedinUrl: member.linkedinUrl || '',
      githubUrl: member.githubUrl || '',
      instagramUrl: member.instagramUrl || ''
    });
    setShowModal(true);
  };



  const handleSubmit = async (e) => {
    e.preventDefault();



    if (!formData.name) {
      toast.error('Name is required');
      return;
    }



    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };



      if (editingMember) {
        await api.put(`/team/${editingMember._id}`, formData, config);
        toast.success('Team member updated successfully');
      } else {
        await api.post('/team', formData, config);
        toast.success('Team member added successfully');
      }



      setShowModal(false);
      resetForm();



      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Error saving team member:', error);
      toast.error(error.response?.data?.message || 'Failed to save team member');
    } finally {
      setLoading(false);
    }
  };



  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team member?')) return;



    try {
      const token = localStorage.getItem('token');
      await api.delete(`/team/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Team member deleted successfully');



      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error('Failed to delete team member');
    }
  };

const optimizeImage = (url) => {
  if (!url) return url;

  // If already optimized, return as-is
  if (url.includes("f_auto") || url.includes("q_auto")) return url;

  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};


  return (
    <section className="w-full py-16 px-4 md:px-8 lg:px-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Our Team</h2>
          {isAdmin && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-300 shadow-lg"
            >
              <FaPlus /> Add Team Member
            </button>
          )}
        </div>



        {teamMembers.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-8">
            {teamMembers.map(member => (
              <div key={member._id} className="flex flex-col items-center group">
                <div className="relative w-24 h-24 mb-2">
                  <div className="w-24 h-24 rounded-full border-4 border-blue-600 overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-lg">
                    <img
                      src={optimizeImage(member.photo) || defaultProfilePic}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = defaultProfilePic;
                      }}
                    />
                  </div>



                  {isAdmin && (
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button
                        onClick={() => handleEdit(member)}
                        className="p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition duration-300 shadow-lg"
                        title="Edit"
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(member._id)}
                        className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition duration-300 shadow-lg"
                        title="Delete"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  )}
                </div>



                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 text-center">
                  {member.name}
                </h3>
                {member.position && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">
                    {member.position}
                  </p>
                )}



                <div className="flex justify-center gap-2">
                  {member.linkedinUrl && (
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition duration-300"
                      title="LinkedIn"
                    >
                      <FaLinkedin size={16} />
                    </a>
                  )}
                  {member.githubUrl && (
                    <a
                      href={member.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-800 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition duration-300"
                      title="GitHub"
                    >
                      <FaGithub size={16} />
                    </a>
                  )}
                  {member.instagramUrl && (
                    <a
                      href={member.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-800 dark:text-pink-500 dark:hover:text-pink-400 transition duration-300"
                      title="Instagram"
                    >
                      <FaInstagram size={16} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400 text-xl mb-6">No team members yet</p>
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-300"
              >
                <FaPlus /> Add First Team Member
              </button>
            )}
          </div>
        )}



        {showModal && isAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingMember ? 'Edit Team Member' : 'Add Team Member'}
                </h2>
              </div>



              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter member name"
                    required
                  />
                </div>



                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., President, Vice President"
                  />
                </div>



                <div className="relative inline-block">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Photo (Optional)
                  </label>
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition duration-300 w-fit">
                    <span>Upload Image</span>
                    {uploadingImage && <FaSpinner className="animate-spin" />}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>



                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Max 2MB (JPG, PNG, WebP) - {uploadingImage ? 'Uploading...' : 'Ready to upload'}
                  </p>



                  {formData.photo && (
                    <div className="relative mt-3 inline-block">
                      <img
                        src={optimizeImage(formData.photo)}
                        alt="Preview"
                        className="max-w-xs h-auto rounded-lg border border-gray-300 dark:border-gray-600"
                        onError={(e) => {
                          e.target.src = defaultProfilePic;
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        title="Remove photo"
                        className="absolute top-1 right-1 w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition duration-300"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>



                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      name="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>



                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      name="githubUrl"
                      value={formData.githubUrl}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://github.com/..."
                    />
                  </div>



                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      name="instagramUrl"
                      value={formData.instagramUrl}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>



                <div className="flex gap-4 pt-6 border-t border-gray-300 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={loading || uploadingImage}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold rounded-lg transition duration-300 disabled:opacity-50"
                  >
                    <FaCheck /> {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-semibold rounded-lg transition duration-300"
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};



export default TeamSection;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import { FaSpinner } from 'react-icons/fa';

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    featuredImage: ''
  });

  const [originalPost, setOriginalPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [hasPendingEditRequest, setHasPendingEditRequest] = useState(false);

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [featuredImagePublicId, setFeaturedImagePublicId] = useState('');

  // Determine role
  const role = user?.role || 'MEMBER';
  const userId = user?.id;

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line
  }, [id]);

  const fetchPost = async () => {
    try {
      setFetching(true);

      if (!user) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      const res = await api.get(`/posts/edit/${id}`);
      const post = res.data.data;

      setOriginalPost(post);

      if (post.pendingEdit && post.pendingEdit.submittedAt) {
        setHasPendingEditRequest(true);
      } else {
        setHasPendingEditRequest(false);
      }

      if (post.pendingEdit && post.pendingEdit.submittedAt) {
        setFormData({
          title: post.pendingEdit.title,
          content: post.pendingEdit.content,
          featuredImage: post.pendingEdit.featuredImage || ''
        });
        setFeaturedImagePublicId(post.pendingEdit.featuredImagePublicId || '');
      } else {
        setFormData({
          title: post.title,
          content: post.content,
          featuredImage: post.featuredImage || ''
        });
        setFeaturedImagePublicId(post.featuredImagePublicId || '');
      }

      setFetching(false);
    } catch (error) {
      console.error('Error fetching post:', error);

      const errorMessage = error.response?.data?.message || 'Failed to load post data';
      toast.error(errorMessage);

      setFetching(false);

      if (error.response?.status === 401) {
        setTimeout(() => navigate('/login'), 1500);
      } else if (error.response?.status === 404) {
        setTimeout(() => navigate('/member/posts'), 2000);
      } else if (error.response?.status === 403) {
        setTimeout(() => navigate('/member/posts'), 2000);
      }
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleContentChange = (value) => {
    setFormData(prev => ({
      ...prev,
      content: value
    }));
  };

  // Image upload handler
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

      const response = await axios.post('/api/images/upload', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Delete old image if exists (but only for non-published posts or admins)
        if (featuredImagePublicId && (originalPost?.status !== 'published' || role === 'ADMIN')) {
          try {
            await axios.post('/api/images/delete',
              { publicId: featuredImagePublicId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }

        setFormData(prev => ({ ...prev, featuredImage: response.data.secure_url }));
        setFeaturedImagePublicId(response.data.public_id);
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Image removal handler - Updated for published posts
  const handleRemoveImage = () => {
    // For published posts by members, just clear locally without calling Cloudinary delete
    if (originalPost?.status === 'published' && role === 'MEMBER') {
      setFormData(prev => ({ ...prev, featuredImage: '' }));
      setFeaturedImagePublicId(''); // Clear to indicate removal
      toast.success('Image marked for removal');
      return;
    }

    // For draft/pending/rejected posts or admin users, delete directly
    if (!featuredImagePublicId) {
      setFormData(prev => ({ ...prev, featuredImage: '' }));
      return;
    }

    if (!window.confirm('Are you sure you want to remove the current image?')) return;

    // For non-published posts, delete immediately
    const deleteImage = async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.post('/api/images/delete',
          { publicId: featuredImagePublicId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setFormData(prev => ({ ...prev, featuredImage: '' }));
        setFeaturedImagePublicId('');
        toast.success('Image removed');
      } catch (error) {
        console.error('Error removing image:', error);
        toast.error('Failed to remove image');
      }
    };

    deleteImage();
  };

  // Save draft
  const handleSaveDraft = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error('Title and Content are required');
      return;
    }

    try {
      setLoading(true);

      await api.put(`/posts/${id}`, {
        ...formData,
        featuredImagePublicId,
        status: 'draft'
      });

      toast.success('Draft saved successfully');
      setLoading(false);
      navigate('/member/posts');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error(error.response?.data?.message || 'Failed to save draft');
      setLoading(false);
    }
  };

  // Submit for approval
  const handleSubmitForApproval = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Title and Content are required');
      return;
    }

    if (hasPendingEditRequest) {
      toast.error('You already have a pending edit request for this post. Please wait for admin approval or rejection.');
      return;
    }

    try {
      setLoading(true);

      await api.put(`/posts/${id}`, {
        ...formData,
        featuredImagePublicId,
        status: 'pending'
      });

      toast.success('Post submitted for approval');
      setLoading(false);
      navigate('/member/posts');
    } catch (error) {
      console.error('Error submitting post:', error);
      toast.error(error.response?.data?.message || 'Failed to submit post');
      setLoading(false);
    }
  };

  // Admin publish
  const handleAdminPublish = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error('Title and Content are required');
      return;
    }

    try {
      setLoading(true);

      await api.put(`/posts/${id}`, {
        ...formData,
        featuredImagePublicId,
        status: 'published'
      });

      toast.success('Post published successfully');
      setLoading(false);
      navigate('/member/posts');
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error(error.response?.data?.message || 'Failed to publish post');
      setLoading(false);
    }
  };

  // Admin edit published post
  const handleAdminEditPublished = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error('Title and Content are required');
      return;
    }

    try {
      setLoading(true);

      await api.put(`/posts/${id}`, {
        ...formData,
        featuredImagePublicId,
        status: 'published'
      });

      toast.success('Published post updated successfully');
      setLoading(false);
      navigate('/member/posts');
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error(error.response?.data?.message || 'Failed to update post');
      setLoading(false);
    }
  };

  // Member edit published post
  const handleMemberEditPublished = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error('Title and Content are required');
      return;
    }

    if (hasPendingEditRequest) {
      toast.error('You already have a pending edit request for this post. Please wait for admin approval or rejection.');
      return;
    }

    try {
      setLoading(true);

      await api.put(`/posts/${id}`, {
        ...formData,
        featuredImagePublicId,
        status: 'published'
      });

      toast.success('Edit request submitted for admin approval');
      setLoading(false);
      navigate('/member/posts');
    } catch (error) {
      console.error('Error submitting edit request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit edit request');
      setLoading(false);
    }
  };

  // Generic update handler
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error('Title and Content are required');
      return;
    }

    try {
      setLoading(true);

      let action = '';
      let statusToSend = originalPost.status;

      if (originalPost.status === 'pending') {
        action = 'Pending post updated successfully';
        statusToSend = 'pending';
      } else if (originalPost.status === 'rejected') {
        action = 'Post updated successfully';
        statusToSend = 'rejected';
      }

      await api.put(`/posts/${id}`, {
        ...formData,
        featuredImagePublicId,
        status: statusToSend
      });

      toast.success(action);
      setLoading(false);
      navigate('/member/posts');
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error(error.response?.data?.message || 'Failed to update post');
      setLoading(false);
    }
  };

  const optimizeImage = (url) => {
  if (!url) return url;

  // If already optimized, return as-is
  if (url.includes("f_auto") || url.includes("q_auto")) return url;

  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};


  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!originalPost) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">Post not found</h2>
          <p className="text-gray-500 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
        Edit Post
      </h1>

      {originalPost.status === 'published' && hasPendingEditRequest && role === 'MEMBER' && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
          <p className="font-bold">⚠️ Pending Edit Request</p>
          <p>Your edit request for this published post is awaiting admin approval. You cannot submit another edit request until this one is processed.</p>
        </div>
      )}

      <div className="mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          originalPost.status === 'draft' ? 'bg-gray-200 text-gray-700' :
          originalPost.status === 'pending' ? 'bg-yellow-200 text-yellow-700' :
          originalPost.status === 'published' ? 'bg-green-200 text-green-700' :
          'bg-red-200 text-red-700'
        }`}>
          Status: {originalPost.status.charAt(0).toUpperCase() + originalPost.status.slice(1)}
        </span>

        {hasPendingEditRequest && role === 'MEMBER' && (
          <span className="ml-3 px-3 py-1 rounded-full text-sm font-semibold bg-orange-200 text-orange-700">
            🕐 Pending Approval
          </span>
        )}

        {role === 'ADMIN' && (
          <span className="ml-3 px-3 py-1 rounded-full text-sm font-semibold bg-purple-200 text-purple-700">
            👤 Admin Mode
          </span>
        )}
      </div>

      <form className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Featured Image
          </label>
          <div className="flex items-center gap-2 mb-2">
            <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center whitespace-nowrap">
              <span>Upload Image</span>
              {uploadingImage && <FaSpinner className="animate-spin ml-2" />}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          {formData.featuredImage && (
            <div className="relative mt-2 inline-block">
              <img
                src={optimizeImage(formData.featuredImage)}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content *
          </label>
          <ReactQuill
            theme="snow"
            value={formData.content}
            onChange={handleContentChange}
            className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            modules={{
              toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['blockquote', 'code-block'],
                ['link', 'image'],
                ['clean']
              ]
            }}
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          {originalPost.status === 'draft' && (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={loading}
                className="flex-1 min-w-32 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Saving...' : 'Save Draft'}
              </button>
              {role === 'ADMIN' ? (
                <button
                  onClick={handleAdminPublish}
                  disabled={loading}
                  className="flex-1 min-w-32 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Publishing...' : 'Publish'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitForApproval}
                  disabled={loading}
                  className="flex-1 min-w-32 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Submitting...' : 'Submit for Approval'}
                </button>
              )}
            </>
          )}

          {originalPost.status === 'pending' && (
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="flex-1 min-w-32 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Updating...' : 'Update Pending Post'}
            </button>
          )}

          {originalPost.status === 'published' && (
            role === 'ADMIN' ? (
              <button
                onClick={handleAdminEditPublished}
                disabled={loading}
                className="flex-1 min-w-32 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Updating...' : 'Update Published Post'}
              </button>
            ) : (
              <button
                onClick={handleMemberEditPublished}
                disabled={loading || hasPendingEditRequest}
                title={hasPendingEditRequest ? 'You have a pending edit request waiting for approval' : 'Submit edit request for admin approval'}
                className={`flex-1 min-w-32 px-6 py-3 rounded-lg transition ${
                  hasPendingEditRequest
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Submitting...' : hasPendingEditRequest ? '⏳ Waiting for Approval' : 'Submit Edit Request'}
              </button>
            )
          )}

          {originalPost.status === 'rejected' && (
            <>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="flex-1 min-w-32 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              {role === 'MEMBER' && (
                <button
                  type="button"
                  onClick={handleSubmitForApproval}
                  disabled={loading}
                  className="flex-1 min-w-32 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Resubmitting...' : 'Resubmit for Approval'}
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => navigate('/member/posts')}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>

      {originalPost.status === 'rejected' && originalPost.rejectionReason && (
        <div className="mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-bold">❌ Rejection Reason:</p>
          <p>{originalPost.rejectionReason}</p>
        </div>
      )}
    </div>
  );
};

export default EditPost;

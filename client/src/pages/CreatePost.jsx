import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import axios from 'axios';
import { FaSpinner } from 'react-icons/fa';
import 'react-quill/dist/quill.snow.css';

const CreatePost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    featuredImage: ''
  });
  const [featuredImagePublicId, setFeaturedImagePublicId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.data || data.user || data);
      } catch (err) { /* optional error handling */ }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      try {
        setLoadingPost(true);
        const { data } = await api.get(`/posts/${postId}`);
        const post = data.data;
        setFormData({
          title: post.title || '',
          content: post.content || '',
          featuredImage: post.featuredImage || ''
        });
        setFeaturedImagePublicId(post.featuredImagePublicId || '');
      } catch (err) {
        toast.error('Failed to load post');
      } finally {
        setLoadingPost(false);
      }
    };
    fetchPost();
  }, [postId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (value) => {
    setFormData(prev => ({ ...prev, content: value }));
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
        // If already have image, delete previous from Cloudinary
        if (featuredImagePublicId && formData.featuredImage) {
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
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, featuredImage: '' }));
    setFeaturedImagePublicId('');
  };

  const submit = async (action) => {
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }

    const payload = {
      title: formData.title,
      content: formData.content,
      featuredImage: formData.featuredImage,
      featuredImagePublicId,
    };

    if (action === 'draft') payload.status = 'draft';
    else if (action === 'publish') payload.status = 'published';
    else if (action === 'submit') payload.status = 'pending';

    try {
      setLoading(true);
      if (postId) {
        await api.put(`/posts/${postId}`, payload);
        if (action === 'draft') toast.success('Post updated as draft');
        else if (action === 'publish') toast.success('Post updated and published');
        else if (action === 'submit') toast.success('Edit submitted for approval');
        else toast.success('Post updated');
      } else {
        await api.post('/posts', payload);
        if (action === 'draft') toast.success('Saved as draft');
        else if (action === 'publish') toast.success('Post published');
        else if (action === 'submit') toast.success('Submitted for approval');
        else toast.success('Post created');
      }
      navigate('/member/posts');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save post');
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
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image', 'code-block'],
      ['clean'],
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'link', 'image', 'code-block',
  ];

  if (loadingPost) return <div className="text-gray-600 dark:text-gray-300">Loading post...</div>;

  const role = user?.role || 'MEMBER';

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{postId ? 'Edit Post' : 'Create New Post'}</h1>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded shadow border border-gray-200 dark:border-gray-700">
        <div>
          <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-200" htmlFor="title">Title</label>
          <input id="title" name="title" type="text" value={formData.title} onChange={handleChange}
            className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700" required />
        </div>
        <div>
          <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-200">Content</label>
          <ReactQuill value={formData.content} onChange={handleContentChange}
            modules={modules} formats={formats} theme="snow" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label className="block mb-2 font-semibold text-gray-900 dark:text-gray-200">Featured Image</label>
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

        <div className="flex gap-3">
          <button type="button" disabled={loading} onClick={() => submit('draft')}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          {role === 'ADMIN' ? (
            <button type="button" disabled={loading} onClick={() => submit('publish')}
              className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-800 disabled:opacity-50">
              {loading ? 'Publishing...' : 'Publish'}
            </button>
          ) : (
            <button type="button" disabled={loading} onClick={() => submit('submit')}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreatePost;

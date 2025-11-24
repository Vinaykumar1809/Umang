import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaCamera, FaSave, FaTimes, FaEdit, FaTrash, FaCheck, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import moment from 'moment';

const DEFAULT_PROFILE_IMAGE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

const Profile = () => {
  const { user, updateUser, loadUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    profileImage: ''
  });
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_PROFILE_IMAGE);
  const [currentImagePublicId, setCurrentImagePublicId] = useState(null);
  const [stats, setStats] = useState({ postsCount: 0, commentsCount: 0, viewsCount: 0 });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState(null);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const [confirmPasswordStatus, setConfirmPasswordStatus] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      const profileImage = user.profileImage || '';
      setFormData({
        username: user.username || '',
        profileImage
      });
      setPreviewUrl(profileImage || DEFAULT_PROFILE_IMAGE);

      if (profileImage.includes('cloudinary')) {
        setCurrentImagePublicId(extractPublicIdFromUrl(profileImage));
      } else {
        setCurrentImagePublicId(null);
      }
      fetchUserStats();
    }
  }, [user]);

  const extractPublicIdFromUrl = (url) => {
    if (!url) return null;
    const parts = url.split('/');
    const last = parts[parts.length - 1];
    return last.split('.')[0];
  };

  const isDefaultImage = !formData.profileImage || !formData.profileImage.includes('cloudinary');

  const fetchUserStats = async () => {
    try {
      const postsRes = await api.get('/posts/user', { params: { status: 'published' } });
      const commentsRes = await api.get('/comments/user');
      const posts = postsRes.data.data || [];
      const comments = commentsRes.data.data || [];
      setStats({
        postsCount: posts.length,
        commentsCount: comments.length,
        viewsCount: posts.reduce((acc, p) => acc + (p.views || 0), 0),
      });
    } catch {
      console.error('Failed to fetch stats');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) return toast.error('Image size must be less than 2 MB');
    if (!file.type.startsWith('image/')) return toast.error('Please upload an image file');
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
      setNewProfileImage(file);
    };
    reader.readAsDataURL(file);
  };

  const uploadImageToCloudinary = async (file) => {
    setUploadingImage(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      const res = await api.post('/images/upload', formDataToSend);
      return { secure_url: res.data.secure_url, public_id: res.data.public_id };
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to upload image');
      throw e;
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteImageFromCloudinary = async (publicId) => {
    if (!publicId?.trim()) return true;
    try {
      await api.post('/images/delete', { publicId });
      return true;
    } catch {
      return true;
    }
  };

  const handleDeleteImage = async () => {
    if (!window.confirm('Are you sure you want to delete your profile photo?')) return;
    setLoading(true);
    try {
      if (currentImagePublicId?.trim()) await deleteImageFromCloudinary(currentImagePublicId);
      const res = await api.put('/users/profile', { username: formData.username, profileImage: '' });
      setFormData(prev => ({ ...prev, profileImage: '' }));
      setPreviewUrl(DEFAULT_PROFILE_IMAGE);
      setNewProfileImage(null);
      setCurrentImagePublicId(null);
      updateUser(res.data.data);
      await loadUser();
      toast.success('Profile photo deleted successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete profile photo');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic username validation with debounce and API check
  useEffect(() => {
    if (!isEditing) return;
    if (!formData.username) return setUsernameStatus(null);
    if (formData.username === user.username) return setUsernameStatus('valid');
    if (formData.username.length < 4 || !/^[a-zA-Z0-9@$_-]+$/.test(formData.username)) return setUsernameStatus('invalid');

    const timer = setTimeout(async () => {
      try {
        setUsernameStatus(null);
        const res = await api.get(`/users/check/username?username=${formData.username}`);
        setUsernameStatus(res.data.available ? 'valid' : 'taken');
      } catch {
        setUsernameStatus('invalid');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username, isEditing, user.username]);

  // Password strength validation
  useEffect(() => {
    if (!showPasswordForm) {
      setPasswordStatus(null);
      setPasswordRequirements({ minLength: false, hasUpperCase: false, hasLowerCase: false, hasNumber: false, hasSpecialChar: false });
      return;
    }
    const pwd = passwordData.newPassword || '';
    if (!pwd) {
      setPasswordStatus(null);
      setPasswordRequirements({ minLength: false, hasUpperCase: false, hasLowerCase: false, hasNumber: false, hasSpecialChar: false });
      return;
    }
    const requirements = {
      minLength: pwd.length >= 6,
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecialChar: /[~`!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/]/.test(pwd),
    };
    setPasswordRequirements(requirements);
    setPasswordStatus(Object.values(requirements).every(Boolean) ? 'valid' : 'invalid');
  }, [passwordData.newPassword, showPasswordForm]);

  // Confirm password match validation
  useEffect(() => {
    if (!showPasswordForm) {
      setConfirmPasswordStatus(null);
      return;
    }
    if (!passwordData.confirmPassword) return setConfirmPasswordStatus(null);
    setConfirmPasswordStatus(passwordData.newPassword === passwordData.confirmPassword ? 'match' : 'mismatch');
  }, [passwordData.newPassword, passwordData.confirmPassword, showPasswordForm]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required';
    else if (usernameStatus === 'taken') newErrors.username = 'Username already taken';
    else if (usernameStatus === 'invalid') newErrors.username = 'Username must be 4+ characters and contain only letters, numbers, @, $, _, or -';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const pwdErrors = {};
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      pwdErrors.password = 'All password fields are required';
    } else if (passwordData.currentPassword === passwordData.newPassword) {
      pwdErrors.password = 'New password must be different from current password';
    } else if (passwordStatus !== 'valid') {
      pwdErrors.password = 'New password does not meet requirements';
    } else if (confirmPasswordStatus !== 'match') {
      pwdErrors.password = 'New passwords do not match';
    }
    setErrors(pwdErrors);
    return Object.keys(pwdErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: undefined }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors above');
      return;
    }
    setLoading(true);
    try {
      let imageUrl = formData.profileImage;
      let newPublicId = currentImagePublicId;
      if (newProfileImage) {
        const uploadResult = await uploadImageToCloudinary(newProfileImage);
        imageUrl = uploadResult.secure_url;
        if (currentImagePublicId?.trim()) await deleteImageFromCloudinary(currentImagePublicId);
        newPublicId = uploadResult.public_id;
      }
      const res = await api.put('/users/profile', { username: formData.username, profileImage: imageUrl });
      setFormData(prev => ({ ...prev, profileImage: imageUrl }));
      setNewProfileImage(null);
      setCurrentImagePublicId(newPublicId);
      setPreviewUrl(imageUrl || DEFAULT_PROFILE_IMAGE);
      updateUser(res.data.data);
      await loadUser();
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) {
      toast.error('Please fix the password errors above');
      return;
    }
    setLoading(true);
    try {
      await api.put('/users/password', { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const profileImage = user?.profileImage || '';
    setFormData({ username: user?.username || '', profileImage });
    setPreviewUrl(profileImage || DEFAULT_PROFILE_IMAGE);
    setNewProfileImage(null);
    setErrors({});
    setUsernameStatus(null);
    setIsEditing(false);
  };

  const optimizeImage = (url) => {
  if (!url) return url;

  // If already optimized, return as-is
  if (url.includes("f_auto") || url.includes("q_auto")) return url;

  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};


  const canDeleteImage = !isDefaultImage && currentImagePublicId;
  const canSaveProfile = isEditing && usernameStatus === 'valid';
  const canUpdatePassword = passwordStatus === 'valid' && confirmPasswordStatus === 'match';

  if (!user)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Profile</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <img src={optimizeImage(previewUrl)} alt={formData.username} onError={e => { e.target.src = DEFAULT_PROFILE_IMAGE; }} className="w-32 h-32 rounded-full object-cover border-4 border-primary-500" />
                  {isEditing && (
                    <div className="absolute bottom-0 right-0 flex space-x-1">
                      <label className="bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition cursor-pointer shadow-lg">
                        <FaCamera />
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploadingImage} />
                      </label>
                      {canDeleteImage && (
                        <button onClick={handleDeleteImage} disabled={loading || uploadingImage} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" title="Delete profile photo">
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.username}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                <span className={`mt-2 px-3 py-1 text-xs font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : user.role === 'MEMBER' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>{user.role}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.postsCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Posts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.viewsCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Views</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.commentsCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Comments</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">Member since {moment(user.createdAt).format('MMMM YYYY')}</div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Profile Information</h3>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                    <FaEdit />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FaUser className="text-gray-400" /></div>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} disabled={!isEditing} className={`w-full pl-10 pr-4 py-2 border ${usernameStatus === 'valid' ? 'border-green-500' : usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed`} />
                  </div>
                  {!isEditing ? null : (
                    <div>
                      {errors.username ? (
                        <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                      ) : usernameStatus === 'taken' ? (
                        <p className="mt-1 text-sm text-red-600">Username already taken</p>
                      ) : usernameStatus === 'invalid' ? (
                        <p className="mt-1 text-sm text-red-600">Username must be 4+ characters and contain only letters, numbers, @, $, _, or -</p>
                      ) : usernameStatus === 'valid' ? (
                        <p className="mt-1 text-sm text-green-600">Username available</p>
                      ) : null}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FaEnvelope className="text-gray-400" /></div>
                    <input type="email" value={user.email} disabled className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed" />
                  </div>
                </div>

                {uploadingImage && <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-300">⏳ Uploading image...</div>}

                {isEditing && (
                  <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={handleCancel} disabled={loading || uploadingImage} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                      <FaTimes /><span>Cancel</span>
                    </button>
                    <button type="submit" disabled={!canSaveProfile || loading || uploadingImage} className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                      <FaSave /><span>{loading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Password Change */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h3>
                {!showPasswordForm && (
                  <button onClick={() => setShowPasswordForm(true)} className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm">
                    <FaLock />
                    <span>Change Password</span>
                  </button>
                )}
              </div>

              {showPasswordForm && (
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                    <div className="relative">
                      <input type={showCurrentPassword ? 'text' : 'password'} name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white" placeholder="Enter current password" />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showCurrentPassword ? (
                          <FaEyeSlash className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        ) : (
                          <FaEye className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                    <div className="relative">
                      <input type={showNewPassword ? 'text' : 'password'} name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className={`w-full px-4 py-2 pr-10 border ${passwordStatus === 'valid' ? 'border-green-500' : passwordStatus === 'invalid' ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-lg focus:outline-none focus:ring-primary-500 dark:bg-gray-700 dark:text-white`} placeholder="Enter new password" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPassword ? (
                          <FaEyeSlash className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        ) : (
                          <FaEye className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        )}
                      </button>
                    </div>
                    {showPasswordForm && passwordData.newPassword && (
                      <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-2">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Password Requirements</p>
                        <div className="space-y-1 text-xs">
                          <div className={`flex items-center ${passwordRequirements.minLength ? 'text-green-600' : 'text-red-600'}`}>{passwordRequirements.minLength ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />} At least 6 characters</div>
                          <div className={`flex items-center ${passwordRequirements.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>{passwordRequirements.hasUpperCase ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />} At least one uppercase letter (A-Z)</div>
                          <div className={`flex items-center ${passwordRequirements.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>{passwordRequirements.hasLowerCase ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />} At least one lowercase letter (a-z)</div>
                          <div className={`flex items-center ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-red-600'}`}>{passwordRequirements.hasNumber ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />} At least one number (0-9)</div>
                          <div className={`flex items-center ${passwordRequirements.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>{passwordRequirements.hasSpecialChar ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />} At least one special character (!@#$ etc.)</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className={`w-full px-4 py-2 pr-10 border ${confirmPasswordStatus === 'match' ? 'border-green-500' : confirmPasswordStatus === 'mismatch' ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white`} placeholder="Confirm new password" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        ) : (
                          <FaEye className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        )}
                      </button>
                    </div>
                    {confirmPasswordStatus === 'mismatch' && <p className="text-sm text-red-600 mt-1">Passwords do not match</p>}
                  </div>

                  {errors.password && <div className="text-sm text-red-600">{errors.password}</div>}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); setErrors({}); setPasswordStatus(null); setConfirmPasswordStatus(null); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">Cancel</button>
                    <button type="submit" disabled={loading || !(passwordStatus === 'valid' && confirmPasswordStatus === 'match')} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition">{loading ? 'Updating...' : 'Update Password'}</button>
                  </div>
                </form>
              )}
            </div>

            {/* Account Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Account Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Account Status:</span><span className={`font-semibold ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Role:</span><span className="font-semibold text-gray-900 dark:text-white">{user.role}</span></div>
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Member Since:</span><span className="font-semibold text-gray-900 dark:text-white">{moment(user.createdAt).format('MMMM DD, YYYY')}</span></div>
                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Last Seen:</span><span className="font-semibold text-gray-900 dark:text-white">{moment(user.lastSeen || user.updatedAt).fromNow()}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
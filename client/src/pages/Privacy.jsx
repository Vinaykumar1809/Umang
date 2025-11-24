import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { FaEdit, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const Privacy = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const GMAIL_ADDRESS = 'nitw.umang@gmail.com';
  // Get privacy content from localStorage
  const getStoredContent = () => {
    try {
      const stored = localStorage.getItem('umang_privacy_policy');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error parsing privacy policy:', error);
    }
    return getDefaultContent();
  };

  const getDefaultContent = () => ({
    content: `# Privacy Policy for Umang(उमंग)

**Effective Date:** November 2, 2025  
**Last Updated:** November 2, 2025  
**Platform Name:** Umang (उमंग)  
**Organization:** Literary & Debating Club(Hindi),
National Institute of Technology, Warangal (NITW)

## 1. Introduction

Welcome to Umang (उमंग), the official blogging and content platform of our College's Literary & Debating Club (Hindi). We are committed to protecting your privacy and ensuring you have a positive experience on our platform.

## 2. Information We Collect

### 2.1 Information You Provide Directly

#### 2.1.1 Registration and Account Information
When you create an account on Umang, we collect:
- **Full Name** - For user identification and profile display
- **Email Address** - For account verification, password recovery, and communications
- **Username** - For unique account identification and public display
- **Password** - Securely stored using encryption for authentication purposes
- **Profile Picture/Image** - Optional user-uploaded image for profile display
- **Bio/Description** - Optional personal information you choose to share
- **Role Type** - Whether you are a regular User, Member, or Administrator

#### 2.1.2 Content You Create
- **Blog Posts** - Articles and literary content you publish
- **Comments and Responses** - Your interactions on other users' posts
- **Literary Creations** - Poetry, essays, shayari, and other content submissions
- **Event Announcements** - Information you create about club events

### 2.2 Information Collected Automatically

#### 2.2.1 Device and Usage Information
- **Browser Type and Version** - What browser you use to access Umang
- **Device Type** - Whether you access from mobile, tablet, or desktop
- **Operating System** - Windows, Mac, iOS, Android, etc.
- **IP Address** - Your device's internet address
- **Page Views and Navigation** - Which pages you visit on our platform
- **Time and Duration** - How long you spend on different sections

#### 2.2.2 Cookies and Tracking Technology
- **Session Cookies** - Temporary files that remember your login status
- **Preference Cookies** - Remember your theme choice and settings
- **Authentication Tokens** - Secure tokens stored for session management

## 3. How We Use Your Information

- **Account Management** - Creating and maintaining your user account
- **Authentication** - Verifying your identity when you log in
- **Content Management** - Storing and displaying your blog posts and content
- **Communications** - Email verification, notifications, and announcements
- **Personalization** - Showing relevant features based on your user role
- **Analytics** - Understanding platform usage and improving features
- **Security** - Protecting your account and data

## 4. Data Security

We implement reasonable security measures to protect your information:
- **Password Encryption** - Your password is encrypted using industry-standard methods
- **HTTPS/SSL** - Data transmitted over secure, encrypted connections
- **Bearer Tokens** - Authentication uses secure tokens
- **Access Control** - Different users can access different features
- **Role-Based Security** - Admin functions require proper authorization

## 5. Your Rights

You have the right to:
- **Access Your Data** - Request a copy of all personal data we hold about you
- **Delete Your Account** - Remove your user account and associated data
- **Update Information** - Modify your profile information anytime
- **Manage Preferences** - Control your notification and privacy settings
- **Data Portability** - Request your data in a portable format

## 6. Third-Party Services

Umang uses third-party services for:
- **Image Hosting** - Cloudinary (for image storage and delivery)
- **Email Services** - Third-party providers for sending notifications
- **Hosting** - Web hosting providers to host the platform
- **Database** - MongoDB for data storage

We are not responsible for third-party services' practices. Please review their privacy policies separately.

## 7. Children's Privacy

Umang is intended for college students and adults. We do not knowingly collect information from individuals under 13 years old.

## 8. Data Retention

- **Account Information** - Retained while your account is active
- **Blog Posts and Comments** - Retained until you delete them or your account is removed
- **Notifications** - Retained for 6 months
- **Activity Logs** - Retained for 90 days for security purposes
- **Backup Data** - Retained up to 90 days after deletion

## 9. Contact Us

For questions about this privacy policy, please contact:
- **Email:** [nitw.umang@gmail.com](mailto:nitw.umang@gmail.com)
- **Hours:** During college hours

## 10. Policy Changes

We may update this privacy policy to reflect changes in our practices or applicable laws. We will notify you of significant changes by posting the updated policy on this page.

---

**Last Updated:** ${new Date().toLocaleDateString()}  
**Effective From:** November 2, 2025

उमंग - आपकी गोपनीयता हमारी प्राथमिकता  
(Umang - Your Privacy is Our Priority)`,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'System'
  });

  const [policyData, setPolicyData] = useState(getStoredContent());
  const [editContent, setEditContent] = useState(policyData.content);

  const handleEdit = () => {
    setEditContent(policyData.content);
    setIsEditing(true);
    setIsPreview(false);
  };

  const handleSave = () => {
    if (!editContent.trim()) {
      toast.error('Content cannot be empty');
      return;
    }

    try {
      setSaving(true);
      const updatedPolicy = {
        content: editContent,
        lastUpdated: new Date().toISOString(),
        updatedBy: user?.username || 'Admin'
      };

      localStorage.setItem('umang_privacy_policy', JSON.stringify(updatedPolicy));
      setPolicyData(updatedPolicy);
      setIsEditing(false);
      setIsPreview(false);
      toast.success('Privacy policy updated successfully!');
    } catch (error) {
      console.error('Error saving privacy policy:', error);
      toast.error('Failed to save privacy policy');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsPreview(false);
    setEditContent(policyData.content);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last updated: {new Date(policyData.lastUpdated).toLocaleDateString()}
              </p>
              {policyData.updatedBy && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Updated by: {policyData.updatedBy}
                </p>
              )}
            </div>

            {/* Admin Edit Button */}
            {user?.role === 'ADMIN' && !isEditing && (
              <button
                onClick={handleEdit}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition"
              >
                <FaEdit /> Edit Policy
              </button>
            )}
          </div>
        </div>

        {/* Editing Mode */}
        {isEditing && user?.role === 'ADMIN' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 space-y-6">
            {/* Tabs: Edit / Preview */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsPreview(false)}
                className={`px-4 py-2 font-medium transition border-b-2 ${
                  !isPreview
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setIsPreview(true)}
                className={`px-4 py-2 font-medium transition border-b-2 flex items-center gap-2 ${
                  isPreview
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <FaEye /> Preview
              </button>
            </div>

            {/* Edit Content */}
            {!isPreview && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Privacy Policy Content (Markdown)
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={35}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white font-mono text-sm resize-none"
                  placeholder="Enter privacy policy content in Markdown..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {editContent.length} characters | Supports Markdown formatting
                </p>

                {/* Markdown Help */}
                <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    📝 Markdown Guide:
                  </h4>
                  <div className="text-xs text-blue-800 dark:text-blue-200 grid grid-cols-2 gap-2">
                    <div>
                      <p><strong># Heading 1</strong></p>
                      <p><strong>## Heading 2</strong></p>
                      <p><strong>**bold**</strong></p>
                    </div>
                    <div>
                      <p><strong>*italic*</strong></p>
                      <p><strong>- List item</strong></p>
                      <p><strong>[Link](url)</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Content */}
            {isPreview && (
              <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-700 p-6 rounded-lg overflow-y-auto" style={{ maxHeight: '600px' }}>
                <ReactMarkdown>{editContent}</ReactMarkdown>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaCheck /> {saving ? 'Saving...' : 'Save Changes'}
              </button>

              <button
                onClick={handleCancel}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-semibold rounded-lg transition"
              >
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Display Mode */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8">
            <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
              <ReactMarkdown>{policyData.content}</ReactMarkdown>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>For questions about this privacy policy, please contact us.</p>
              <p className="mt-2">
                <strong>उमंग - आपकी गोपनीयता हमारी प्राथमिकता</strong>
              </p>
              <p className="text-xs mt-2">
                (Umang - Your Privacy is Our Priority)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Privacy;
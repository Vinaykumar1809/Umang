import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { FaEdit, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const Terms = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get terms content from localStorage
  const getStoredContent = () => {
    try {
      const stored = localStorage.getItem('umang_terms_of_service');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error parsing terms of service:', error);
    }
    return getDefaultContent();
  };

  const getDefaultContent = () => ({
    content: `# Terms of Service for Umang(उमंग)  
**Effective Date:** November 2, 2025  
**Last Updated:** November 2, 2025  
**Platform Name:** Umang (उमंग)  
**Organization:** Literary & Debating Club(Hindi),
National Institute of Technology, Warangal (NITW)

---

## 1. Agreement to Terms

By accessing, creating an account on, or using the Umang platform (the "Platform"), you agree to be bound by these Terms of Service (the "Terms"). If you do not agree to these Terms, you may not use the Platform.

**Umang is a platform owned and operated by the Hindi Samiti (Literary & Debating Club[Hindi]) of NIT,Warangal.**

---

## 2. Platform Overview

### 2.1 Purpose
Umang is a blogging and content-sharing platform designed for:
- Publishing literary content (blogs, poetry, essays, shayari)
- Organizing club announcements and events
- Managing debates and discussions
- Building an alumni network
- Facilitating member interactions
- Archiving club activities and achievements

### 2.2 Who Can Use Umang
-  Users must be at least 13 years old

### 2.3 Access Requirements
- Valid email address for registration
- Acceptance of these Terms
- Compliance with all applicable laws

---

## 3. User Accounts and Registration

### 3.1 Creating an Account
To use Umang, you must:
1. Provide accurate and truthful information
2. Create a username and password
3. Accept this Terms of Service and Privacy Policy
4. Verify your email address
5. Complete any additional verification required

### 3.2 Account Responsibilities
You are responsible for:
- **Confidentiality:** Keeping your password secret
- **Authorization:** All activities under your account
- **Accuracy:** Maintaining current information
- **Compliance:** Following all platform rules
- **Security:** Reporting unauthorized access immediately

### 3.3 Account Suspension
We may suspend or terminate accounts for:
- Violating these Terms
- Engaging in prohibited conduct
- Prolonged inactivity
- Safety or security concerns
- Legal requirements

---

## 4. User Conduct and Prohibited Activities

### 4.1 Prohibited Content
You may **NOT** post, upload, or share:

**Offensive Content:**
- Hate speech targeting race, religion, caste, gender, or sexual orientation
- Discriminatory content
- Harassing, bullying, or threatening language
- Sexually explicit or inappropriate content
- Violence or gore

**Illegal Content:**
- Copyrighted material without permission
- Plagiarized content
- Child exploitation material
- Illegal activity or fraud
- Spam or malicious code

**False Information:**
- Impersonation of others
- Misinformation or disinformation
- Doxxing (sharing private information)
- Defamatory content

### 4.2 Prohibited Activities
You may **NOT**:
- Hack or attempt unauthorized access
- Upload malware or viruses
- Spam or flood the platform
- Create multiple fake accounts
- Sell or purchase accounts
- Harvest data without permission
- Bypass security measures
- Use bots or automated tools
- Access others' accounts
- Interfere with platform functionality

### 4.3 Intellectual Property
- Respect others' copyrights and trademarks
- Do not use others' creative work without permission
- Give proper attribution when referencing others' work
- Do not claim others' work as your own

---

## 5. Content Rights and Ownership

### 5.1 Your Content
You retain ownership of:
- All blog posts you create
- Poetry, essays, and literary works
- Comments and responses
- Images and media you upload
- Any original content you submit

### 5.2 Platform License
By posting content on Umang, you grant the platform a:
- Non-exclusive license to display your content
- Right to reproduce content for platform purposes
- Right to archive and preserve content
- Right to use content for club records

### 5.3 Use of Your Content
The platform may:
- Display your content on the platform
- Share content in club communications
- Archive content for historical purposes
- Use content in club publications (with attribution)
- Maintain content in backups

### 5.4 Removal of Content
- You may delete your own content anytime
- The club may remove content violating these Terms
- Removed content may be retained in backups
- The club must notify you of removals when possible

---

## 6. Content Moderation and Review

### 6.1 Moderation Policy
The platform:
- Monitors content for violations
- Does **NOT** pre-approve all content (post-moderation)
- May remove violating content
- May issue warnings or suspend accounts
- Works with admins to maintain community standards

### 6.2 Edit Request Workflow
Members can:
- Request edits to published posts
- Suggest improvements to others' content
- Submit edit requests for admin approval
- Provide constructive feedback
- Collaborate on content improvement

### 6.3 Appeal Process
If content is removed:
1. You will be notified of the removal
2. You may request clarification from admins
3. You can appeal the decision
4. Admins will review within 7 days
5. Final decision is binding

---

## 7. Roles and Permissions

### 7.1 User Roles

**Regular User:**
- View public content
- Create account
- Post comments (if allowed)
- Read blog posts
- Limited editing capabilities

**Member:**
- Create blog posts
- Write and publish content
- Comment and interact
- Receive notifications
- Edit own content
- Participate in events
- Access member dashboard

**Alumni:**
- Create profile
- Share alumni information
- Publish alumni content
- Network with other alumni
- Participate in alumni events
- Limited editing of own posts

**Administrator:**
- Manage all user accounts
- Approve/reject content
- Create announcements
- Access admin dashboard
- Moderate comments
- Manage events
- View analytics
- Manage other admins

### 7.2 Role Assignment
- Users must verify their email to get access
- Members are assigned by club coordinators
- Admin access is restricted to authorized personnel
- Role changes require admin approval
- Users cannot change their own roles

---

## 8. Feature-Specific Terms

### 8.1 Blog Posts
- Must be original or properly attributed
- Should relate to club activities or Hindi literature
- Offensive or spam content may be removed
- Authors remain responsible for accuracy
- Published posts are publicly visible (unless archived)

### 8.2 Comments
- Should be respectful and constructive
- Spam comments will be removed
- Personal attacks are prohibited
- Comments may be moderated
- Users are responsible for comment content

### 8.3 Notifications
- Real-time alerts about platform activity
- Can be customized in preferences
- May include email notifications
- Users can opt-out of certain notifications
- Older notifications auto-delete after 6 months

### 8.4 Alumni Directory
- Information is displayed publicly
- Users can update their profiles
- Contact information may be shared within network
- Graduation year and achievements are highlighted
- Privacy controls available for sensitive data

### 8.5 Events and Announcements
- Official club events posted by admins
- Event details include date, time, location
- Users can register interest in events
- Event information may be shared
- Past events archived for reference

### 8.6 Real-Time Features (WebSocket)
- Notifications delivered instantly
- Connection may occasionally drop
- Platform not responsible for missed notifications
- High traffic may affect performance
- Users should not rely solely on real-time features

---

## 9. Third-Party Services

### 9.1 External Services
Umang uses third-party services for:
- **Image Hosting:** Cloudinary (for image storage)
- **Email:** Third-party email services
- **Hosting:** Web hosting providers
- **Database:** MongoDB for data storage

### 9.2 Liability Disclaimer
- Platform is NOT responsible for third-party services
- Third-party services have separate terms and privacy policies
- We are not liable for third-party outages or failures
- Users agree to third-party terms when using features
- Data stored with third parties subject to their policies

### 9.3 Third-Party Links
- Umang may include links to external websites
- We do NOT endorse external websites
- We are NOT responsible for external content
- External websites have separate terms and policies
- Use external sites at your own risk

---

## 10. Disclaimer of Warranties

### 10.1 "As-Is" Service
Umang is provided on an "AS-IS" and "AS-AVAILABLE" basis. We make no warranties about:
- Accuracy of content
- Functionality of features
- Availability of service
- Security of data
- Compatibility with your devices
- Error-free operation

### 10.2 No Guarantees
We do **NOT** guarantee:
- Continuous service availability
- Uninterrupted access
- Data recovery
- Specific results from using the platform
- Protection from viruses or malware
- Preservation of content

### 10.3 Limitation of Liability
We are **NOT** liable for:
- Indirect or consequential damages
- Lost data or content
- Business interruption
- Loss of profits
- Data theft or breaches
- Third-party actions
- Your use of the platform
- Content posted by other users

---

## 11. Indemnification

You agree to indemnify and hold harmless the Hindi Samiti club and the college from any claims, damages, or expenses arising from:
- Your violation of these Terms
- Your use of the platform
- Your content or posts
- Your interactions with other users
- Your infringement of intellectual property rights
- Any harmful actions on your part

---

## 12. Privacy and Data Protection

### 12.1 Privacy Policy
- Umang has a separate Privacy Policy
- Privacy Policy details data collection and use
- Privacy Policy is part of these Terms
- By using Umang, you consent to Privacy Policy

### 12.2 Data Handling
- We collect data to operate the platform
- Data is protected with reasonable security measures
- Data may be shared with third-party services
- Data retention follows Privacy Policy
- Users have rights under Privacy Policy

### 12.3 Your Privacy Rights
- Right to access your data
- Right to delete your account
- Right to update your information
- Right to control notifications
- Right to data portability (where applicable)

---

## 13. Intellectual Property Rights

### 13.1 Platform IP
- Umang's design, layout, and code are proprietary
- Platform features, trademarks, and logos are protected
- You may not copy or reproduce platform design
- You may not claim ownership of platform features
- You license these materials only for personal use

### 13.2 User Generated Content
- You retain copyright of your original content
- You grant the platform limited rights to use content
- You represent you have rights to posted content
- You must respect others' intellectual property rights
- The platform may archive content indefinitely

### 13.3 Attribution
- Properly attribute others' work when referencing
- Cite sources for quotes or references
- Do not claim others' work as your own
- Respect plagiarism detection
- Give credit to original creators

---

## 14. Dispute Resolution
For disputes, try to resolve by:
1. Submit written complaint to our email
2. Include specific details and evidence
3. Allow 30 days for response
4. Platform will investigate and respond
5. Final decision is binding

### 14.3 Escalation
Disputes may be escalated to appropriate authorities (if necessary).

### 14.4 Arbitration
- Disputes are subject to arbitration
- No class action lawsuits permitted
- Both parties must submit to jurisdiction

---

## 15. Modifications to Terms

### 15.1 Right to Modify
We may modify these Terms:
- To reflect platform changes
- To comply with laws
- To improve platform policies
- To address new issues
- Based on user feedback

### 15.2 Notice of Changes
- Updated Terms posted on platform
- Effective date clearly marked
- For major changes, email notification sent
- 30-day notice for significant changes
- Your continued use means acceptance

### 15.3 Version Control
- Current version always available
- Previous versions archived
- Changes tracked with dates
- Users notified of important updates

---

## 16. Term and Termination

### 16.1 Account Termination
Accounts may be terminated:
- By you: Anytime by requesting deletion
- By us: For violating Terms, safety concerns, or legal reasons
- Voluntarily: By you for any reason
- For cause: By us with notice (when possible)

### 16.2 Effect of Termination
Upon termination:
- Access to account is removed
- Content may be retained (per Privacy Policy)
- Your license to use platform ends
- Outstanding obligations remain
- Some data retained for legal/backup purposes

### 16.3 Survival
These sections survive termination:
- Intellectual Property Rights
- Limitation of Liability
- Indemnification
- Dispute Resolution
- General Provisions

---

## 17. General Provisions

### 17.1 Entire Agreement
- These Terms constitute entire agreement
- Previous agreements are superseded
- No oral modifications valid
- Written modifications must be signed by both parties

### 17.2 Severability
- If any provision is unenforceable, others remain valid
- Unenforceable provisions are modified minimally
- Remaining Terms enforced to fullest extent
- Invalid provisions don't affect other Terms

### 17.3 Waiver
- Failure to enforce right doesn't waive it
- Partial enforcement doesn't waive other rights
- Our waiver of one violation doesn't waive others
- Written waiver required for enforcement

### 17.4 Assignment
- You cannot assign these Terms to others
- We may assign Terms to successors or third parties
- Assignment doesn't release original party
- Your rights transfer with assignment

### 17.5 Headings
- Section headings are for convenience only
- Headings don't affect interpretation
- Headings not part of legal agreement
- Content of sections controls

---

## 18. Acknowledgment

### 18.1 Your Agreement
By using Umang, you acknowledge:
- You have read these Terms
- You understand these Terms
- You agree to follow these Terms
- You accept all risks of using the platform
- You release the platform from certain liabilities
- You understand the platform is as-is

### 18.2 Authority
You confirm:
- You are legally able to enter agreements
- You are at least 13 years old
- You have authority over your account
- Your information is accurate
- You are using platform for legitimate purposes

---

## 19. Contact Information

**Admin Email:** nitw.umang@gmail.com 
**Hours:** college hours
**Response Time:** 24-48 hours

---

**Last Updated:** November 2, 2025  
**Effective From:** November 2, 2025

उमंग - हिंदी साहित्य में आपका स्वागत है!  
(Umang - Welcome to Hindi Literature!)`,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'System'
  });

  const [termsData, setTermsData] = useState(getStoredContent());
  const [editContent, setEditContent] = useState(termsData.content);

  const handleEdit = () => {
    setEditContent(termsData.content);
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
      const updatedTerms = {
        content: editContent,
        lastUpdated: new Date().toISOString(),
        updatedBy: user?.username || 'Admin'
      };

      localStorage.setItem('umang_terms_of_service', JSON.stringify(updatedTerms));
      setTermsData(updatedTerms);
      setIsEditing(false);
      setIsPreview(false);
      toast.success('Terms of Service updated successfully!');
    } catch (error) {
      console.error('Error saving terms of service:', error);
      toast.error('Failed to save Terms of Service');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsPreview(false);
    setEditContent(termsData.content);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last updated: {new Date(termsData.lastUpdated).toLocaleDateString()}
              </p>
              {termsData.updatedBy && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Updated by: {termsData.updatedBy}
                </p>
              )}
            </div>

            {/* Admin Edit Button */}
            {user?.role === 'ADMIN' && !isEditing && (
              <button
                onClick={handleEdit}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition"
              >
                <FaEdit /> Edit Terms
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
                  Terms of Service Content (Markdown)
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={35}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white font-mono text-sm resize-none"
                  placeholder="Enter Terms of Service content in Markdown..."
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
              <ReactMarkdown>{termsData.content}</ReactMarkdown>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>Last updated: {new Date(termsData.lastUpdated).toLocaleDateString()}</p>
              <p className="mt-4">
                <strong>उमंग - हिंदी साहित्य में आपका स्वागत है!</strong>
              </p>
              <p className="text-xs mt-2">
                (Umang - Welcome to Hindi Literature!)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Terms;
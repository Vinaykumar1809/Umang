import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: [
      'post_approved', 
      'post_rejected', 
      'post_pending',  
      'post_published', 
      'post_liked',
      'post_edit_request',    
     'post_edit_approved',   
     'post_edit_rejected', 
      'comment_added',
      'comment_liked',
      'comment_replied',
      'announcement_created',
      'role_changed',
      'welcome',
      'system'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    postId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Post'
    },
    announcementId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Announcement'
    },
    commentId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Comment'
    },
    parentCommentId: {     
      type: mongoose.Schema.ObjectId,
      ref: 'Comment'
    },
    rejectionReason: String,
    newRole: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date
}, {
  timestamps: true
});

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);

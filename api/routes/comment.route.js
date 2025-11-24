import express from 'express';
import Comment from '../models/comment.model.js';
import Post from '../models/post.model.js';
import { protect } from '../middleware/auth.js';
import { editComment, likeComment } from '../controllers/comment.controller.js';
import Notification from '../models/notification.model.js';

const router = express.Router();

// Helper function to create notification
const createNotification = async (recipientId, type, title, message, metadata, io) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      metadata
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('recipient', 'username email');

    // Emit via socket
    if (io) {
      io.to(`user_${recipientId}`).emit('notification', populatedNotification);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

//GET ROUTES
// Get comments for a post
router.get('/post/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId, parentComment: null })
      .populate('author', 'username profileImage')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'username profileImage' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/comments/user
router.get('/user', protect, async (req, res) => {
  try {
    const comments = await Comment.find({ author: req.user.id });
    res.json({ data: comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Like a reply
router.put('/:commentId/replies/:replyId/like', protect, async (req, res) => {
  try {
    const { commentId, replyId } = req.params;
    const userId = req.user.id;

    const reply = await Comment.findById(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    if (reply.parentComment.toString() !== commentId) {
      return res.status(400).json({
        success: false,
        message: 'Reply does not belong to this comment'
      });
    }

    const userIdString = userId.toString();
    const likeIndex = reply.likes.findIndex(id => id.toString() === userIdString);
    
    if (likeIndex === -1) {
      reply.likes.push(userId);
    } else {
      reply.likes.splice(likeIndex, 1);
    }

    await reply.save();

    res.status(200).json({
      success: true,
      data: reply,
      isLiked: likeIndex === -1
    });
  } catch (error) {
    console.error('Error liking reply:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

//Edit a reply (MUST come BEFORE delete)
router.put('/:commentId/replies/:replyId', protect, async (req, res) => {
  try {
    const { commentId, replyId } = req.params;
    const { content } = req.body;

    console.log('Edit reply endpoint hit:', { commentId, replyId, content }); // Debug

    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Content cannot be empty' 
      });
    }

    const reply = await Comment.findById(replyId);
    if (!reply) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reply not found' 
      });
    }

    if (reply.parentComment.toString() !== commentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reply does not belong to this comment' 
      });
    }

    const userId = req.user.id.toString();
    const replyAuthor = (reply.author || '').toString();
    const isAdmin = req.user.role && req.user.role.toUpperCase() === 'ADMIN';

    console.log('Authorization check:', { userId, replyAuthor, isAdmin });

    if (userId !== replyAuthor && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to edit this reply' 
      });
    }

    const previousContent = reply.content;
    reply.content = content.trim();
    reply.isEdited = true;
    
    if (!reply.editHistory) {
      reply.editHistory = [];
    }

    reply.editHistory.push({
      editedAt: new Date(),
      previousContent: previousContent
    });
    
    await reply.save();

    // Populate author before responding
    await reply.populate('author', 'username profileImage');

    res.status(200).json({ 
      success: true,
      message: 'Reply edited successfully',
      data: reply 
    });
  } catch (error) {
    console.error('Error editing reply:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Delete a reply
router.delete('/:commentId/replies/:replyId', protect, async (req, res) => {
  try {
    const { commentId, replyId } = req.params;

    const reply = await Comment.findById(replyId);
    if (!reply) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reply not found' 
      });
    }

    if (reply.parentComment.toString() !== commentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reply does not belong to this comment' 
      });
    }

    const userId = req.user.id.toString();
    const replyAuthor = (reply.author || '').toString();
    const isAdmin = req.user.role && req.user.role.toUpperCase() === 'ADMIN';

    if (userId !== replyAuthor && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    await Comment.findByIdAndDelete(replyId);

    res.status(200).json({ 
      success: true, 
      message: 'Reply deleted' 
    });
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// CREATE ROUTE 
router.post('/', protect, async (req, res) => {
  try {
    const { content, postId, parentCommentId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content cannot be empty'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = await Comment.create({
      content: content.trim(),
      author: req.user.id,
      post: postId,
      parentComment: parentCommentId || null
    });

    post.comments.push(comment._id);
    await post.save();

     if (parentCommentId) {
      // This is a reply to a comment
      const parentComment = await Comment.findById(parentCommentId).populate('author', 'username');
      if (parentComment) {
        parentComment.replies.push(comment._id);
        await parentComment.save();

        // Notify parent comment author about the reply
        if (parentComment.author._id.toString() !== req.user.id.toString()) {
          await createNotification(
            parentComment.author._id,
            'comment_replied',
            'New Reply',
            `${req.user.username} replied to your comment`,
            {
              postId: postId,
              commentId: comment._id,
              repliedBy: req.user.id
            },
            req.io
          );
        }
      }
    } else {
      // This is a top-level comment - notify post owner
      if (post.author._id.toString() !== req.user.id.toString()) {
        await createNotification(
          post.author._id,
          'comment_added',
          'New Comment',
          `${req.user.username} commented on your post`,
          {
            postId: postId,
            commentId: comment._id,
            commentedBy: req.user.id
          },
          req.io
        );
      }
    }


    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username profileImage');

    res.status(201).json({
      success: true,
      data: populatedComment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});


// Delete comment (top-level)
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Comment not found' 
      });
    }

    if (!comment.post) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment does not reference a post' 
      });
    }

    const post = await Post.findById(comment.post);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    const userId = req.user.id.toString();
    const commentAuthor = (comment.author || '').toString();
    const postOwner = (post.author || '').toString();
    const isAdmin = req.user.role && req.user.role.toUpperCase() === 'ADMIN';
    const isCommentAuthor = userId === commentAuthor;
    const isPostOwner = userId === postOwner;

    if (!isCommentAuthor && !isPostOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this comment' 
      });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      success: true, 
      message: 'Comment deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Edit comment (top-level) - uses controller
router.put('/:id', protect, editComment);

// Like comment (top-level) - uses controller
router.put('/:id/like', protect, likeComment);

export default router;

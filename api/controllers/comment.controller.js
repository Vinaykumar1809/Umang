import Comment from '../models/comment.model.js';
import Post from '../models/post.model.js';
import Notification from '../models/notification.model.js';

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

export const createComment = async (req, res, next) => {
  try {
    const { content, postId, userId } = req.body;

    if (userId !== req.user.id) {
      return next(
        errorHandler(403, 'You are not allowed to create this comment')
      );
    }

    const newComment = new Comment({
      content,
      postId,
      userId,
    });
    await newComment.save();

    res.status(200).json(newComment);
  } catch (error) {
    next(error);
  }
};

export const getPostComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({
      createdAt: -1,
    });
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

export const likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const userId = req.user.id;
    const userIndex = comment.likes.indexOf(userId);

    // Toggle like: if already liked, remove; if not liked, add
    if (userIndex === -1) {
      // User hasn't liked yet - add like
      comment.likes.push(userId);
       // Create notification for comment author when someone likes their comment
      if (comment.author._id.toString() !== userId.toString()) {
        await createNotification(
          comment.author._id,
          'comment_liked',
          'Comment Liked',
          `${req.user.username} liked your comment`,
          {
            postId: comment.post,
            commentId: comment._id,
            likedBy: userId
          },
          req.io
        );
      }
    } else {
      // User already liked - remove like
      comment.likes.splice(userIndex, 1);
    }

    await comment.save();

    res.status(200).json({
      success: true,
      data: comment,
      isLiked: userIndex === -1 // true if just liked, false if just unliked
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



export const editComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    const post = await Post.findById(comment.post);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const userId = req.user.id;
    const isCommentAuthor = comment.author.toString() === userId;
    const isAdmin = req.user.role === 'ADMIN';

    // Allow edit if user is comment author OR admin
    if (!isCommentAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to edit this comment'
      });
    }

    // Save edit history (optional)
    comment.editHistory.push({
      editedAt: new Date(),
      previousContent: comment.content,
    });

    comment.content = req.body.content;
    comment.isEdited = true;
    await comment.save();

    res.status(200).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Edit comment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return next(errorHandler(404, 'Comment not found'));
    }

    // Get post to verify post ownership
    const post = await Post.findById(comment.post);
    if (!post) {
      return next(errorHandler(404, 'Post not found'));
    }

    const userId = req.user.id;
    const isCommentAuthor = comment.author.toString() === userId;
    const isPostOwner = post.author.toString() === userId;
    const isAdmin = req.user.isAdmin;

    if (!isCommentAuthor && !isPostOwner && !isAdmin) {
      return next(errorHandler(403, 'You are not allowed to delete this comment'));
    }

    await Comment.findByIdAndDelete(req.params.commentId);

    res.status(200).json({ success: true, message: 'Comment deleted successfully' });

  } catch (error) {
    next(error);
  }
};


export const getcomments = async (req, res, next) => {
  if (!req.user.isAdmin)
    return next(errorHandler(403, 'You are not allowed to get all comments'));
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.sort === 'desc' ? -1 : 1;
    const comments = await Comment.find()
      .sort({ createdAt: sortDirection })
      .skip(startIndex)
      .limit(limit);
    const totalComments = await Comment.countDocuments();
    const now = new Date();
    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const lastMonthComments = await Comment.countDocuments({
      createdAt: { $gte: oneMonthAgo },
    });
    res.status(200).json({ comments, totalComments, lastMonthComments });
  } catch (error) {
    next(error);
  }
};

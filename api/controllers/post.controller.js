import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import Comment from '../models/comment.model.js';
import Notification from '../models/notification.model.js';
import cloudinaryPkg from 'cloudinary';

const cloudinary = cloudinaryPkg.v2;

// Get all published posts
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const search = req.query.search;
    const sort = req.query.sort || '-publishedAt';

    let query = { status: 'published' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const posts = await Post.find(query)
      .populate('author', 'username profileImage')
      .populate('comments')
      .sort(sort)
      .limit(limit)
      .skip(startIndex)
      .exec();

    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      count: posts.length,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      },
      data: posts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get single post
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .where('status').equals('published')
      .populate('author', 'username profileImage email')
      .populate({
        path: 'comments',
        match: { parentCommentId: null },
        populate: {
          path: 'author',
          select: 'username profileImage'
        },
        populate: {
          path: 'replies',
          populate: {
            path: 'author',
            select: 'username profileImage'
          }
        },
        options: { sort: { createdAt: -1 } }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    post.views += 1;
    await post.save();

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get single post by ID for editing
export const getPostById = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format'
      });
    }

    const post = await Post.findById(req.params.id)
      .populate('author', 'username profileImage email')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username profileImage'
        },
        options: { sort: { createdAt: -1 } }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.author._id.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this post'
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error in getPostById:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching post'
    });
  }
};

// Get user's posts with status filtering
export const getUserPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const status = req.query.status; // Get status from query

    // Build query based on status
    let query = { author: userId };
    if (status && status !== 'all') {
      query.status = status; // Filter by status if provided
    }

    const posts = await Post.find(query)
      .populate('author', 'username profileImage')
      .populate('comments')
      .sort('-createdAt')
      .limit(limit)
      .skip(startIndex)
      .exec();

    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      count: posts.length,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      },
      data: posts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


// Create post
export const createPost = async (req, res) => {
  try {
    const { title, content, featuredImage, featuredImagePublicId, status = 'draft' } = req.body;

    let postStatus = status;
    if (req.user.role !== 'ADMIN' && status === 'published') {
      postStatus = 'pending';
    }

    const post = await Post.create({
      title,
      content,
      featuredImage,
      featuredImagePublicId,
      author: req.user.id,
      status: postStatus
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username profileImage');

    if (req.user.role === 'MEMBER' && postStatus === 'pending') {
      const admins = await User.find({ role: 'ADMIN' });
      for (const admin of admins) {
        const notification = await Notification.create({
          recipient: admin._id,
          sender: req.user.id,
          type: 'post_pending',
          title: 'New Post Pending Approval 📝',
          message: `${req.user.username} has submitted a post "${title}" for approval`,
          metadata: { postId: post._id }
        });
        req.io.to(`user_${admin._id}`).emit('notification', notification);
      }
    }

    res.status(201).json({
      success: true,
      data: populatedPost
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update post
export const updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    const { title, content, featuredImage, featuredImagePublicId, status } = req.body;

    // ADMIN WORKFLOW - ADMIN can edit any post directly
    if (req.user.role === 'ADMIN') {
      if (featuredImage !== undefined && featuredImage !== post.featuredImage && post.featuredImagePublicId) {
        try {
          await cloudinary.uploader.destroy(post.featuredImagePublicId);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }

      const updateData = {
        title: title ?? post.title,
        content: content ?? post.content,
        featuredImage: featuredImage !== undefined ? featuredImage : post.featuredImage,
        featuredImagePublicId: featuredImagePublicId !== undefined ? featuredImagePublicId : post.featuredImagePublicId,
        isEdited: true,
        $push: {
          editHistory: {
            editedAt: new Date(),
            editedBy: req.user.id,
            reason: 'Admin edit'
          }
        }
      };

      if (status) updateData.status = status;

      post = await Post.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true
      }).populate('author', 'username profileImage');

      return res.status(200).json({
        success: true,
        data: post
      });
    }

    // MEMBER WORKFLOW - DRAFT POST
    if (post.status === 'draft') {
      if (featuredImage !== undefined && featuredImage !== post.featuredImage && post.featuredImagePublicId) {
        try {
          await cloudinary.uploader.destroy(post.featuredImagePublicId);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }

      const updateData = {
        title: title ?? post.title,
        content: content ?? post.content,
        featuredImage: featuredImage !== undefined ? featuredImage : post.featuredImage,
        featuredImagePublicId: featuredImagePublicId !== undefined ? featuredImagePublicId : post.featuredImagePublicId
      };

      if (status === 'pending') {
        updateData.status = 'pending';
        updateData.$push = {
          editHistory: {
            editedAt: new Date(),
            editedBy: req.user.id,
            reason: 'Submitted for approval'
          }
        };
      }

      post = await Post.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true
      }).populate('author', 'username profileImage');

      if (status === 'pending') {
        const admins = await User.find({ role: 'ADMIN' });
        for (const admin of admins) {
          const notification = await Notification.create({
            recipient: admin._id,
            sender: req.user.id,
            type: 'post_pending',
            title: 'New Post Pending Approval 📝',
            message: `${req.user.username} has submitted a post "${post.title}" for approval`,
            metadata: { postId: post._id }
          });
          req.io.to(`user_${admin._id}`).emit('notification', notification);
        }
      }

      return res.status(200).json({
        success: true,
        data: post
      });
    }

    // MEMBER WORKFLOW - PENDING POST
    if (post.status === 'pending') {
      const updateData = {
        title: title ?? post.title,
        content: content ?? post.content,
        featuredImage: featuredImage !== undefined ? featuredImage : post.featuredImage,
        featuredImagePublicId: featuredImagePublicId !== undefined ? featuredImagePublicId : post.featuredImagePublicId,
        $push: {
          editHistory: {
            editedAt: new Date(),
            editedBy: req.user.id,
            reason: 'Updated pending post'
          }
        }
      };

      if (featuredImage !== undefined && featuredImage !== post.featuredImage && post.featuredImagePublicId) {
        try {
          await cloudinary.uploader.destroy(post.featuredImagePublicId);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }

      post = await Post.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true
      }).populate('author', 'username profileImage');

      await Notification.deleteMany({
        'metadata.postId': post._id,
        type: 'post_pending'
      });

      const admins = await User.find({ role: 'ADMIN' });
      for (const admin of admins) {
        const notification = await Notification.create({
          recipient: admin._id,
          sender: req.user.id,
          type: 'post_pending',
          title: 'Post Updated for Approval 🔄',
          message: `${req.user.username} has updated post "${post.title}" for approval`,
          metadata: { postId: post._id }
        });
        req.io.to(`user_${admin._id}`).emit('notification', notification);
      }

      return res.status(200).json({
        success: true,
        data: post
      });
    }

    // MEMBER WORKFLOW - PUBLISHED POST (Create pending edit request - DO NOT delete images yet)
    if (post.status === 'published') {
      // Just store the pending edit - don't delete anything
      post.pendingEdit = {
        title: title ?? post.title,
        content: content ?? post.content,
        featuredImage: featuredImage ?? post.featuredImage,
        featuredImagePublicId: featuredImagePublicId ?? post.featuredImagePublicId,
        submittedAt: new Date(),
        submittedBy: req.user.id
      };

      await post.save();

      const admins = await User.find({ role: 'ADMIN' });
      for (const admin of admins) {
        const notification = await Notification.create({
          recipient: admin._id,
          sender: req.user.id,
          type: 'post_edit_request',
          title: 'Edit Request for Published Post 📝',
          message: `${req.user.username} has requested to edit published post "${post.title}"`,
          metadata: { postId: post._id }
        });
        req.io.to(`user_${admin._id}`).emit('notification', notification);
      }

      return res.status(200).json({
        success: true,
        message: 'Edit request submitted for admin approval',
        data: post
      });
    }

    // MEMBER WORKFLOW - REJECTED POST
    if (post.status === 'rejected') {
      if (featuredImage !== undefined && featuredImage !== post.featuredImage && post.featuredImagePublicId) {
        try {
          await cloudinary.uploader.destroy(post.featuredImagePublicId);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }

      const updateData = {
        title: title ?? post.title,
        content: content ?? post.content,
        featuredImage: featuredImage !== undefined ? featuredImage : post.featuredImage,
        featuredImagePublicId: featuredImagePublicId !== undefined ? featuredImagePublicId : post.featuredImagePublicId,
        rejectionReason: null
      };

      if (status === 'pending') {
        updateData.status = 'pending';
        updateData.$push = {
          editHistory: {
            editedAt: new Date(),
            editedBy: req.user.id,
            reason: 'Resubmitted after rejection'
          }
        };
      }

      post = await Post.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true
      }).populate('author', 'username profileImage');

      if (status === 'pending') {
        const admins = await User.find({ role: 'ADMIN' });
        for (const admin of admins) {
          const notification = await Notification.create({
            recipient: admin._id,
            sender: req.user.id,
            type: 'post_pending',
            title: 'Post Resubmitted After Rejection 🔄',
            message: `${req.user.username} has resubmitted post "${post.title}" for approval`,
            metadata: { postId: post._id }
          });
          req.io.to(`user_${admin._id}`).emit('notification', notification);
        }
      }

      return res.status(200).json({
        success: true,
        data: post
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Approve edit request - DELETE OLD IMAGE HERE when approving
export const approveEditRequest = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!post.pendingEdit || !post.pendingEdit.submittedAt) {
      return res.status(400).json({
        success: false,
        message: 'No pending edit request for this post'
      });
    }

    // NOW delete the old image when approving - this is the right time
    if (post.pendingEdit.featuredImage !== post.featuredImage && post.featuredImagePublicId) {
      try {
        await cloudinary.uploader.destroy(post.featuredImagePublicId);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }

    post.title = post.pendingEdit.title;
    post.content = post.pendingEdit.content;
    post.featuredImage = post.pendingEdit.featuredImage;
    post.featuredImagePublicId = post.pendingEdit.featuredImagePublicId;
    post.isEdited = true;
    post.editHistory.push({
      editedAt: new Date(),
      editedBy: post.pendingEdit.submittedBy,
      reason: 'Edit approved by admin'
    });

    post.pendingEdit = undefined;
    await post.save();

    const notification = await Notification.create({
      recipient: post.author._id,
      sender: req.user.id,
      type: 'post_edit_approved',
      title: 'Edit Request Approved! ✅',
      message: `Your edit request for post "${post.title}" has been approved`,
      metadata: { postId: post._id }
    });

    req.io.to(`user_${post.author._id}`).emit('notification', notification);

    await Notification.deleteMany({
      'metadata.postId': post._id,
      type: 'post_edit_request'
    });

    res.status(200).json({
      success: true,
      message: 'Edit request approved successfully',
      data: post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Reject edit request - DELETE PENDING IMAGE HERE when rejecting
export const rejectEditRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const post = await Post.findById(req.params.id).populate('author');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!post.pendingEdit || !post.pendingEdit.submittedAt) {
      return res.status(400).json({
        success: false,
        message: 'No pending edit request for this post'
      });
    }

    // Delete the pending edit image when rejecting - the user won't use it
    if (post.pendingEdit.featuredImagePublicId) {
      try {
        await cloudinary.uploader.destroy(post.pendingEdit.featuredImagePublicId);
      } catch (error) {
        console.error('Error deleting pending image:', error);
      }
    }

    post.pendingEdit = undefined;
    await post.save();

    const notification = await Notification.create({
      recipient: post.author._id,
      sender: req.user.id,
      type: 'post_edit_rejected',
      title: 'Edit Request Rejected ❌',
      message: `Your edit request for post "${post.title}" has been rejected`,
      metadata: {
        postId: post._id,
        rejectionReason: reason
      }
    });

    req.io.to(`user_${post.author._id}`).emit('notification', notification);

    await Notification.deleteMany({
      'metadata.postId': post._id,
      type: 'post_edit_request'
    });

    res.status(200).json({
      success: true,
      message: 'Edit request rejected successfully',
      data: post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    if (post.featuredImagePublicId) {
      try {
        await cloudinary.uploader.destroy(post.featuredImagePublicId);
      } catch (error) {
        console.error('Error deleting featured image:', error);
      }
    }

    if (post.pendingEdit?.featuredImagePublicId) {
      try {
        await cloudinary.uploader.destroy(post.pendingEdit.featuredImagePublicId);
      } catch (error) {
        console.error('Error deleting pending edit image:', error);
      }
    }

    await Comment.deleteMany({ post: post._id });
    await Notification.deleteMany({ 'metadata.postId': req.params.id });
    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Approve post
export const approvePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Post is not pending approval'
      });
    }

    post.status = 'published';
    post.publishedAt = new Date();
    await post.save();

    const notification = await Notification.create({
      recipient: post.author._id,
      sender: req.user.id,
      type: 'post_approved',
      title: 'Post Approved! ✅',
      message: `Your post "${post.title}" has been approved and published`,
      metadata: { postId: post._id }
    });

    req.io.to(`user_${post.author._id}`).emit('notification', notification);

    res.status(200).json({
      success: true,
      message: 'Post approved successfully',
      data: post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Reject post
export const rejectPost = async (req, res) => {
  try {
    const { reason } = req.body;
    const post = await Post.findById(req.params.id).populate('author');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Post is not pending approval'
      });
    }

    if (post.featuredImagePublicId) {
      try {
        await cloudinary.uploader.destroy(post.featuredImagePublicId);
      } catch (error) {
        console.error('Error deleting featured image:', error);
      }
    }

    post.status = 'rejected';
    post.rejectionReason = reason;
    await post.save();

    const notification = await Notification.create({
      recipient: post.author._id,
      sender: req.user.id,
      type: 'post_rejected',
      title: 'Post Rejected ❌',
      message: `Your post "${post.title}" has been rejected`,
      metadata: {
        postId: post._id,
        rejectionReason: reason
      }
    });

    req.io.to(`user_${post.author._id}`).emit('notification', notification);

    res.status(200).json({
      success: true,
      message: 'Post rejected successfully',
      data: post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get pending posts
export const getPendingPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: 'pending' })
      .populate('author', 'username email profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get pending edit requests
export const getPendingEditRequests = async (req, res) => {
  try {
    const posts = await Post.find({ 'pendingEdit.submittedAt': { $exists: true } })
      .populate('author', 'username email profileImage')
      .sort({ 'pendingEdit.submittedAt': -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Like post
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const userId = req.user.id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);

      // Send notification if post owner is not the one liking
      if (post.author._id.toString() !== userId) {
        const notification = await Notification.create({
          recipient: post.author._id,
          sender: req.user.id,
          type: 'post_liked',
          title: 'Post Liked ❤️',
          message: `${req.user.username} liked your post "${post.title}"`,
          metadata: { postId: post._id }
        });
        req.io.to(`user_${post.author._id}`).emit('notification', notification);
      }
    }

    await post.save();

    res.status(200).json({
      success: true,
      data: post,
      liked: !isLiked
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

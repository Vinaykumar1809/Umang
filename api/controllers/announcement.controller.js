import Announcement from '../models/announcement.model.js';
import User from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import axios from 'axios';

// Helper function to delete image from Cloudinary
const deleteImageFromCloudinary = async (publicId, token) => {
  try {
    if (publicId) {
      await axios.post('/api/images/delete', { publicId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } catch (error) {
    console.error('Failed to delete image from Cloudinary:', error.message);
  }
};

// Get all active announcements (Public + User role filtering)
export const getAnnouncements = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let query = { isActive: true };

    // If user is authenticated, show announcements for their role too
    if (req.user) {
      query.$or = [
        { targetAudience: 'all' },
        { targetAudience: req.user.role.toLowerCase() }
      ];
    } else {
      // If no user, only show 'all' announcements
      query.targetAudience = 'all';
    }

    const announcements = await Announcement.find(query)
      .populate('author', 'username profileImage')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit)
      .skip(startIndex)
      .exec();

    const total = await Announcement.countDocuments(query);

    res.status(200).json({
      success: true,
      count: announcements.length,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      },
      data: announcements
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get featured announcement for home page
export const getFeaturedAnnouncement = async (req, res) => {
  try {
    const announcements = await Announcement.find({
      isActive: true,
      isFeatured: true,
      $or: [
        { featuredUntil: { $gte: new Date() } },
        { featuredUntil: { $exists: false } }
      ]
    })
      .populate('author', 'username profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: announcements
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Create announcement (Admin only)
export const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      image,
      imagePublicId,
      links,
      isFeatured,
      featuredUntil,
      targetAudience
    } = req.body;

    const announcement = await Announcement.create({
      title,
      content,
      image: image || null,
      imagePublicId: imagePublicId || null,
      links: links || [],
      isFeatured: isFeatured || false,
      featuredUntil: featuredUntil ? new Date(featuredUntil) : null,
      targetAudience: targetAudience || 'all',
      author: req.user.id
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('author', 'username profileImage');

    // Create notifications
    let userQuery = { isActive: true };
    if (targetAudience && targetAudience !== 'all') {
      userQuery.role = targetAudience.toUpperCase();
    }

    const users = await User.find(userQuery);
    const notifications = users.map(user => ({
      recipient: user._id,
      sender: req.user.id,
      type: 'announcement_created',
      title: 'New Announcement 📢',
      message: `New announcement: ${title}`,
      metadata: { announcementId: announcement._id }
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      users.forEach(user => {
        const notification = notifications.find(n => n.recipient.toString() === user._id.toString());
        req.io.to(`user_${user._id}`).emit('notification', notification);
      });
    }

    res.status(201).json({
      success: true,
      data: populatedAnnouncement
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get announcement by ID (Admin only)
export const getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('author', 'username profileImage');

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.status(200).json({ success: true, data: announcement });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update announcement (Admin only)
export const updateAnnouncement = async (req, res) => {
  try {
    let announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    const {
      title,
      content,
      image,
      imagePublicId,
      links,
      isFeatured,
      featuredUntil,
      targetAudience,
      isActive
    } = req.body;

    const oldImagePublicId = announcement.imagePublicId;

    // Case 1: New image provided
    if (image && imagePublicId && imagePublicId !== oldImagePublicId) {
      if (oldImagePublicId) {
        await deleteImageFromCloudinary(oldImagePublicId, req.headers.authorization?.split(' ')[1]);
      }
    }
    // Case 2: Image removed
    else if (!image && !imagePublicId && oldImagePublicId) {
      await deleteImageFromCloudinary(oldImagePublicId, req.headers.authorization?.split(' ')[1]);
    }

    // Update announcement
    announcement.title = title || announcement.title;
    announcement.content = content || announcement.content;
    announcement.image = image !== undefined ? image : announcement.image;
    announcement.imagePublicId = imagePublicId !== undefined ? imagePublicId : announcement.imagePublicId;
    announcement.links = links !== undefined ? links : announcement.links;
    announcement.isFeatured = isFeatured !== undefined ? isFeatured : announcement.isFeatured;
    announcement.targetAudience = targetAudience || announcement.targetAudience;
    announcement.isActive = isActive !== undefined ? isActive : announcement.isActive;

    if (featuredUntil) {
      announcement.featuredUntil = new Date(featuredUntil);
    } else if (isFeatured === false) {
      announcement.featuredUntil = null;
    }

    await announcement.save();

    const updatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('author', 'username profileImage');

    res.status(200).json({
      success: true,
      data: updatedAnnouncement
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete announcement (Admin only)
export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Delete image from Cloudinary if it exists
    if (announcement.imagePublicId) {
      await deleteImageFromCloudinary(announcement.imagePublicId, req.headers.authorization?.split(' ')[1]);
    }

    // Delete the announcement
    await Announcement.findByIdAndDelete(req.params.id);

    // Delete all notifications
    await Notification.deleteMany({
      'metadata.announcementId': req.params.id
    });

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Toggle announcement status (Admin only)
export const toggleAnnouncementStatus = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    announcement.isActive = !announcement.isActive;
    await announcement.save();

    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Toggle featured announcement (Admin only)
export const toggleFeatured = async (req, res) => {
  try {
    const { featuredUntil } = req.body;
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    announcement.isFeatured = !announcement.isFeatured;
    if (announcement.isFeatured && featuredUntil) {
      announcement.featuredUntil = new Date(featuredUntil);
    } else if (!announcement.isFeatured) {
      announcement.featuredUntil = null;
    }

    await announcement.save();

    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export default {
  getAnnouncements,
  getFeaturedAnnouncement,
  createAnnouncement,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementStatus,
  toggleFeatured
};

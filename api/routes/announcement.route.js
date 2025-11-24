import express from 'express';
import {
  getAnnouncements,
  getFeaturedAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
  toggleAnnouncementStatus,
  toggleFeatured
} from '../controllers/announcement.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAnnouncements); // Public announcements
router.get('/featured', getFeaturedAnnouncement); // Featured announcements

// Admin only route to get all announcements (including inactive)
router.get('/all', protect, authorize('ADMIN'), getAnnouncements);

// Admin only routes (require authentication and admin role)
router.post('/', protect, authorize('ADMIN'), createAnnouncement);
router.get('/:id', protect, authorize('ADMIN'), getAnnouncementById);
router.put('/:id', protect, authorize('ADMIN'), updateAnnouncement);
router.delete('/:id', protect, authorize('ADMIN'), deleteAnnouncement);
router.put('/:id/toggle-status', protect, authorize('ADMIN'), toggleAnnouncementStatus);
router.put('/:id/toggle-featured', protect, authorize('ADMIN'), toggleFeatured);

export default router;

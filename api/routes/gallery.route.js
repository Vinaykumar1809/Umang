import express from 'express';
import {
  createEvent,
  getAllEvents,
  getEventById,
  addImageToEvent,
  deleteImageFromEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/gallery.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/events', getAllEvents);
router.get('/events/:eventId', getEventById);

// Protected routes (Admin only)
router.post('/events', protect, createEvent);
router.put('/events/:eventId', protect, updateEvent);
router.post('/events/:eventId/images', protect, addImageToEvent);
router.delete('/events/:eventId/images/:imageId', protect, deleteImageFromEvent);
router.delete('/events/:eventId', protect, deleteEvent);

export default router;

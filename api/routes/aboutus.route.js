import express from 'express';
import { getAboutUs, updateAboutUs } from '../controllers/aboutus.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAboutUs);

// Admin only routes
router.put('/', protect, authorize('ADMIN'), updateAboutUs);

export default router;
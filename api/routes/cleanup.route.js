import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  cleanupOrphanedImages,
  getCleanupStats
} from '../controllers/cleanup.controller.js';

const router = express.Router();

// Get cleanup statistics (preview)
router.get('/stats', protect, authorize('ADMIN'), getCleanupStats);

// Run cleanup
router.post('/orphaned-images', protect, authorize('ADMIN'), cleanupOrphanedImages);

export default router;

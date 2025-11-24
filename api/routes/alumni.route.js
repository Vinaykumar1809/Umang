import express from 'express';
import {
  getAlumni,
  getAlumniByYear,
  getAlumnus,
  createAlumni,
  updateAlumni,
  deleteAlumni,
  toggleAlumniStatus,
  getPassoutYears
} from '../controllers/alumni.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAlumni);
router.get('/years', getPassoutYears);
router.get('/year/:year', getAlumniByYear);
router.get('/:id', getAlumnus);

// Admin only routes
router.post('/', protect, authorize('ADMIN'), createAlumni);
router.put('/:id', protect, authorize('ADMIN'), updateAlumni);
router.delete('/:id', protect, authorize('ADMIN'), deleteAlumni);
router.put('/:id/toggle-status', protect, authorize('ADMIN'), toggleAlumniStatus);

export default router;

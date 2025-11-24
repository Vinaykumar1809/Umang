import express from 'express';
import {
  getTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  toggleTeamMemberStatus
} from '../controllers/team.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getTeamMembers);
router.get('/:id', getTeamMember);

// Admin only routes
router.post('/', protect, authorize('ADMIN'), createTeamMember);
router.put('/:id', protect, authorize('ADMIN'), updateTeamMember);
router.delete('/:id', protect, authorize('ADMIN'), deleteTeamMember);
router.put('/:id/toggle-status', protect, authorize('ADMIN'), toggleTeamMemberStatus);

export default router;
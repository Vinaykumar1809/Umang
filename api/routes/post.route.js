import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getPosts,
  getPost,
  getPostById, 
  createPost,
  updatePost,
  deletePost,
  approvePost,
  rejectPost,
  approveEditRequest,
  rejectEditRequest,
  getPendingEditRequests, // ✅ NEW
  getPendingPosts,
  getUserPosts,
  likePost
} from '../controllers/post.controller.js';

const router = express.Router();


router.get('/pending-edit-requests', protect, authorize('ADMIN'), getPendingEditRequests);

router.get('/', getPosts);
router.get('/user', protect, getUserPosts);
router.get('/pending', protect, authorize('ADMIN'), getPendingPosts);

// Get post by ID for editing (authenticated users only)
router.get('/edit/:id',protect, getPostById);  

router.get('/:id', getPost);

router.post('/', protect, authorize('MEMBER', 'ADMIN'), createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

// Admin approval
router.put('/:id/approve', protect, authorize('ADMIN'), approvePost);
router.put('/:id/reject', protect, authorize('ADMIN'), rejectPost);

// NEW: Edit request approval
router.put('/:id/approve-edit', protect, authorize('ADMIN'), approveEditRequest);
router.put('/:id/reject-edit', protect, authorize('ADMIN'), rejectEditRequest);
router.put('/:id/like', protect, likePost);



export default router;

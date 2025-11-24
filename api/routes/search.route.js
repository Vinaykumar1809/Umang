import express from 'express';
import Post from '../models/post.model.js';
import User from '../models/user.model.js';

const router = express.Router();

// GET /api/posts/search?q=searchTerm
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === '') {
    return res.json({ success: true, data: [] });
  }

  try {
    // Try to find a user with username matching q (case-insensitive)
    const user = await User.findOne({ username: new RegExp(`^${q}$`, 'i') });

    // Build a query to match:
    // 1. Posts by the found user, OR
    // 2. Posts where title or content contains q (case-insensitive)
    const query = user
      ? {
          $or: [
            { author: user._id },
            { title: new RegExp(q, 'i') },
            { content: new RegExp(q, 'i') }
          ],
        }
      : {
          $or: [
            { title: new RegExp(q, 'i') },
            { content: new RegExp(q, 'i') }
          ],
        };

    const posts = await Post.find(query)
      .populate('author', 'username profileImage')
      .sort({ createdAt: -1 })
      .limit(50); // limit for performance

    res.json({ success: true, data: posts });
  } catch (err) {
    console.error('Search failed', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;

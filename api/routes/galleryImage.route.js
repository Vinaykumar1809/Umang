import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cloudinaryPkg from 'cloudinary';
import multer from 'multer';
import { protect } from '../middleware/auth.js';

const cloudinary = cloudinaryPkg.v2;
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/images/upload - Upload image to Cloudinary
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate file size (2 MB)
    if (req.file.size > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size must be less than 2 MB' });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image')) {
      return res.status(400).json({ error: 'Only image files allowed' });
    }

    // Upload to Cloudinary from backend
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          transformation: [
  { fetch_format: "auto", quality: "auto", crop: "limit", width: 2000, height: 2000 }
               ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    res.json({
      success: true,
      secureUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Upload failed',
      details: error.message,
    });
  }
});

// POST /api/images/delete - Delete image from Cloudinary
router.post('/delete', protect, async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: 'publicId required' });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'Image deleted',
      });
    } else {
      res.status(400).json({
        error: 'Failed to delete',
        result,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Deletion failed',
      details: error.message,
    });
  }
});

export default router;

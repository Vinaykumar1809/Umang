import express from 'express';
import User from '../models/user.model.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendAccountSuspensionEmail } from '../utils/emailService.js';
import { checkUsernameAvailability, checkEmailAvailability } from '../controllers/user.controller.js';

const router = express.Router();

router.get('/check/username', checkUsernameAvailability);

// Check email availability
router.get('/check/email', checkEmailAvailability);

// Get all users (Admin only)
router.get('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get single user
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update user role (Admin only)
router.put('/:id/role', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
    if (!['USER', 'MEMBER'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Only USER and MEMBER roles can be assigned.'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent changing admin role
    if (user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify admin role'
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update user active status (Admin only)
router.put('/:id/status', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { isActive, suspensionPeriod } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deactivating admin users
    if (user.role === 'ADMIN' && !isActive) {
      return res.status(403).json({
        success: false,
        message: 'Cannot deactivate admin users'
      });
    }

    // If deactivating user
    if (!isActive) {
      let expirationDate = null;
      let reason = 'INDEFINITE';

      if (suspensionPeriod) {
        reason = suspensionPeriod;
        const now = new Date();

        switch (suspensionPeriod) {
          case '24HOURS':
            expirationDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case '7DAYS':
            expirationDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case '30DAYS':
            expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
          case 'INDEFINITE':
            expirationDate = null;
            break;
          default:
            return res.status(400).json({
              success: false,
              message: 'Invalid suspension period'
            });
        }
      }

      user.isActive = false;
      user.inactivationReason = reason;
      user.inactivationExpire = expirationDate;
      user.inactivatedAt = new Date();

      // Send suspension email
      try {
        await sendAccountSuspensionEmail(user.email, user.username, suspensionPeriod);
      } catch (emailError) {
        console.error('Error sending suspension email:', emailError);
        // Don't fail the request if email fails
      }
    } else {
      // If reactivating user
      user.isActive = true;
      user.inactivationReason = null;
      user.inactivationExpire = null;
      user.inactivatedAt = null;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: isActive ? 'User activated successfully' : 'User deactivated successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete user (Admin only)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting admin
    if (user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin user'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { username, email, profileImage } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update user password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
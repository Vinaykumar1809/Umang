import User from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

// Register user
export const register = async (req, res) => {
  try {
    const { username, email, password, role = 'USER' } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    user = await User.create({
      username,
      email,
      password,
      role: role.toUpperCase()
    });

    // Create welcome notification
    await Notification.create({
      recipient: user._id,
      type: 'welcome',
      title: 'Welcome to our platform!',
      message: `Welcome ${username}! Your account has been created successfully.`
    });

    // Send welcome email
    try {
      console.log("FRONTEND_URL:", process.env.FRONTEND_URL);

      const message =`
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
            <h1 style="color: #333; text-align: center;">Welcome to उमंग! 🎉</h1>
            
            <p style="color: #555; font-size: 16px;">Hi <strong>${username}</strong>,</p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Thank you for joining our community! We're excited to have you here.
            </p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              You can now:
            </p>
            <ul style="color: #555; font-size: 16px;">
              <li>Create and publish blog posts</li>
              <li>Interact with other community members</li>
              <li>Explore amazing content</li>
            </ul>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Go to Dashboard
              </a>
            </p>
            
            <p style="color: #888; font-size: 14px; text-align: center;">
              If you have any questions, feel free to contact us.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #888; font-size: 12px; text-align: center;">
              © 2025 उमंग. All rights reserved.
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        email: user.email,
        subject: 'Welcome to उमंग (Umang) Platform!',
        message
      });
    } catch (err) {
      console.log('Email could not be sent');
    }

    sendTokenResponse(user, 201, res, 'User registered successfully');
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'notifications',
      options: { sort: { createdAt: -1 }, limit: 10 }
    });

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
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'There is no user with that email'
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;
    const clientResetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const message = `
      <h2>Password Reset Request</h2>
      <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
      <p>Please click on the following link to reset your password:</p>
      <a href="${clientResetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <p>This link will expire in 10 minutes.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message
      });

      res.status(200).json({
        success: true,
        message: 'Email sent successfully'
      });
    } catch (err) {
      console.log(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password reset successful');
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        isActive: user.isActive
      }
    });
};

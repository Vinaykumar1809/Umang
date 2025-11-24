import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configure transporter (using Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (email, username) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🎉 Welcome to उमंग (Umang) Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi <strong>${username}</strong>,</h2>
          <p>Thank you for joining our community! We're excited to have you here.</p>
          <p>You can now:</p>
          <ul>
            <li>Create and publish your posts</li>
            <li>Interact with other members</li>
            <li>Participate in discussions</li>
          </ul>
          <p>If you have any questions, feel free to contact us.</p>
          <hr />
          <p>© 2025 उमंग. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};


  //NEW: Send account suspension email
 
export const sendAccountSuspensionEmail = async (email, username, suspensionPeriod) => {
  try {
    let suspensionMessage = '';

    switch (suspensionPeriod) {
      case '24HOURS':
        suspensionMessage = '<strong>24 hours</strong>';
        break;
      case '7DAYS':
        suspensionMessage = '<strong>7 days</strong>';
        break;
      case '30DAYS':
        suspensionMessage = '<strong>30 days</strong>';
        break;
      case 'INDEFINITE':
        suspensionMessage = '<strong>indefinitely</strong> until further notice';
        break;
      default:
        suspensionMessage = 'until further notice';
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '⚠️ Your Account Has Been Suspended',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 8px; padding: 20px;">
          <div style="background-color: #fff3cd; padding: 10px; border-radius: 4px; margin-bottom: 20px;">
            <h2 style="color: #856404; margin: 0;">Account Suspended</h2>
          </div>

          <p>Hello <strong>${username}</strong>,</p>

          <p>We regret to inform you that your account has been suspended by our administrators.</p>

          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0;"><strong>Suspension Duration:</strong></p>
            <p style="margin: 10px 0; font-size: 16px; color: #d9534f;">${suspensionMessage}</p>
          </div>

          <p><strong>What this means:</strong></p>
          <ul style="line-height: 1.8;">
            <li>You will not be able to log in to your account</li>
            <li>You cannot create or edit posts</li>
            <li>Your account will be automatically restored after the suspension period ends</li>
          </ul>

          <p style="margin-top: 30px; margin-bottom: 10px;"><strong>Need Help?</strong></p>
          <p>If you believe this is a mistake or would like to discuss this suspension, please contact our support team at <a href="mailto:${process.env.EMAIL_USER}" style="color: #007bff; text-decoration: none;">${process.env.EMAIL_USER}</a></p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />

          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            © 2025 उमंग. All rights reserved.<br />
            If you have any questions, please don't hesitate to reach out to our support team.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Account suspension email sent to:', email);
  } catch (error) {
    console.error('Error sending account suspension email:', error);
    throw error;
  }
};

/**
 * Send account reactivation email
 */
export const sendAccountReactivationEmail = async (email, username) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '✅ Your Account Has Been Reactivated',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #d4edda; padding: 10px; border-radius: 4px; margin-bottom: 20px;">
            <h2 style="color: #155724; margin: 0;">Account Reactivated</h2>
          </div>

          <p>Hello <strong>${username}</strong>,</p>

          <p>Good news! Your account suspension period has ended and your account is now <strong>active again</strong>.</p>

          <p>You can now:</p>
          <ul style="line-height: 1.8;">
            <li> Log in to your account</li>
            <li> Create and edit posts</li>
            <li>Interact with the community</li>
          </ul>

          <p style="margin-top: 30px;">Thank you for being part of our community. We look forward to seeing you back!</p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />

          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            © 2025 उमंग. All rights reserved.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Account reactivation email sent to:', email);
  } catch (error) {
    console.error('Error sending account reactivation email:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, username, resetLink) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🔐 Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi <strong>${username}</strong>,</h2>

          <p>We received a request to reset your password. Click the button below to create a new password.</p>

          <p style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </p>

          <p>⚠️ <strong>This link will expire in 1 hour</strong> for security reasons.</p>

          <p>Or copy and paste this link in your browser:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${resetLink}
          </p>

          <p>If you didn't request this, please ignore this email. Your password won't change until you click the link above.</p>

          <hr />
          <p style="color: #666; font-size: 12px;">© 2025 उमंग. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};
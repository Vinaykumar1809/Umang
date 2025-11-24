import User from '../models/user.model.js';
import { sendAccountReactivationEmail } from '../utils/emailService.js';
import cron from 'node-cron';

/**
 * Check and reactivate users whose suspension period has expired
 */
export const checkAndReactivateUsers = async () => {
  try {
    const now = new Date();

    // Find all inactive users whose suspension period has expired
    const usersToReactivate = await User.find({
      isActive: false,
      inactivationExpire: { $lte: now },
      inactivationReason: { $ne: 'INDEFINITE' }
    });

    if (usersToReactivate.length === 0) {
      console.log('[Auto-Reactivation Job] No users to reactivate at', now);
      return;
    }

    console.log(`[Auto-Reactivation Job] Found ${usersToReactivate.length} users to reactivate`);

    // Reactivate each user and send email
    for (const user of usersToReactivate) {
      try {
        user.isActive = true;
        user.inactivationReason = null;
        user.inactivationExpire = null;
        user.inactivatedAt = null;
        await user.save();

        // Send reactivation email
        try {
          await sendAccountReactivationEmail(user.email, user.username);
        } catch (emailError) {
          console.error(`Error sending reactivation email to ${user.email}:`, emailError);
          // Don't fail the reactivation if email fails
        }

        console.log(`✅ User ${user.username} has been reactivated`);
      } catch (error) {
        console.error(`Error reactivating user ${user.username}:`, error);
      }
    }
  } catch (error) {
    console.error('[Auto-Reactivation Job] Error:', error);
  }
};

// /**
//  * Start the auto-reactivation cron job
//  * Runs every hour by default
//  * Adjust the cron expression as needed:
//  * - '0 * * * *' = Every hour at minute 0
//  * - '0 */6 * * *' = Every 6 hours
//  * - '*/30 * * * *' = Every 30 minutes
//  * - '0 0 * * *' = Daily at midnight 
// **/
export const startAutoReactivationJob = () => {
  try {
    // Run the job every hour
    const job = cron.schedule('0 * * * *', () => {
      console.log('[Auto-Reactivation Job] Running scheduled check...');
      checkAndReactivateUsers();
    });

    console.log('✅ Auto-reactivation job started (runs every hour)');

    // Optionally run once on startup
    checkAndReactivateUsers();

    return job;
  } catch (error) {
    console.error('Error starting auto-reactivation job:', error);
  }
};

/**
 * Alternative: Using setInterval (if you don't want to use cron)
 * Call this function in your server startup code
 */
export const startAutoReactivationJobWithInterval = (intervalMs = 60 * 60 * 1000) => {
  console.log(` Auto-reactivation job started (runs every ${intervalMs / 1000 / 60} minutes)`);

  // Run once on startup
  checkAndReactivateUsers();

  // Then run periodically
  setInterval(() => {
    console.log('[Auto-Reactivation Job] Running scheduled check...');
    checkAndReactivateUsers();
  }, intervalMs);
};
import cron from 'node-cron';
import CloudinaryCleanupService from '../services/cloudinaryCleanup.service.js';

/**
 * Schedule cleanup job to run automatically
 * 
 * Cron schedule format:
 * ┌────────────── second (optional, 0-59)
 * │ ┌──────────── minute (0-59)
 * │ │ ┌────────── hour (0-23)
 * │ │ │ ┌──────── day of month (1-31)
 * │ │ │ │ ┌────── month (1-12)
 * │ │ │ │ │ ┌──── day of week (0-6, 0=Sunday)
 * │ │ │ │ │ │
 * * * * * * *
 */

class CleanupScheduler {
  /**
   * Run cleanup every day at 2 AM
   */
  static scheduleDailyCleanup() {
    cron.schedule('0 2 * * *', async () => {
      console.log('🕐 Running scheduled daily cleanup at 2 AM...');
      
      try {
        const cleanupService = new CloudinaryCleanupService();
        const result = await cleanupService.runCleanupWithAgeFilter(1); // Only delete images older than 1 day
        
        console.log('✅ Scheduled cleanup completed:', result);
      } catch (error) {
        console.error('❌ Scheduled cleanup failed:', error);
      }
    });

    console.log('📅 Daily cleanup scheduled for 2 AM');
  }

  /**
   * Run cleanup every Sunday at 3 AM
   */
  static scheduleWeeklyCleanup() {
    cron.schedule('0 3 * * 0', async () => {
      console.log('🕐 Running scheduled weekly cleanup at 3 AM Sunday...');
      
      try {
        const cleanupService = new CloudinaryCleanupService();
        const result = await cleanupService.runCleanup();
        
        console.log('✅ Scheduled weekly cleanup completed:', result);
      } catch (error) {
        console.error('❌ Scheduled weekly cleanup failed:', error);
      }
    });

    console.log('📅 Weekly cleanup scheduled for 3 AM every Sunday');
  }

  /**
   * Run cleanup every 6 hours
   */
  static scheduleFrequentCleanup() {
    cron.schedule('0 */6 * * *', async () => {
      console.log('🕐 Running scheduled cleanup every 6 hours...');
      
      try {
        const cleanupService = new CloudinaryCleanupService();
        const result = await cleanupService.runCleanupWithAgeFilter(1);
        
        console.log('✅ Scheduled cleanup completed:', result);
      } catch (error) {
        console.error('❌ Scheduled cleanup failed:', error);
      }
    });

    console.log('📅 Frequent cleanup scheduled every 6 hours');
  }

  /**
   * Initialize all scheduled jobs
   */
  static initializeScheduler() {
    // Choose ONE of these schedules based on your needs:
    
    // Option 1: Daily cleanup at 2 AM
    this.scheduleDailyCleanup();
    
    // Option 2: Weekly cleanup on Sunday at 3 AM
    // this.scheduleWeeklyCleanup();
    
    // Option 3: Frequent cleanup every 6 hours
    // this.scheduleFrequentCleanup();
  }
}

export default CleanupScheduler;

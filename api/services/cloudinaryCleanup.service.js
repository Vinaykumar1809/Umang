import cloudinaryPkg from 'cloudinary';
import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import Announcement from '../models/announcement.model.js';
import { Event } from '../models/gallery.model.js';
import Alumni from '../models/alumni.model.js';
import TeamMember from '../models/team.model.js';
import AboutUs from '../models/aboutus.model.js';

const cloudinary = cloudinaryPkg.v2;

/**
 * Global Cloudinary Orphan Image Cleanup Service
 * 
 * This service scans all schemas in the application and compares
 * the images stored in Cloudinary with the images referenced in
 * the database. Any images in Cloudinary that are not found in
 * any schema will be deleted as orphaned images.
 */

class CloudinaryCleanupService {
  constructor() {
    this.allUsedPublicIds = new Set();
    this.deletedCount = 0;
    this.errorCount = 0;
    this.cloudinaryImages = [];
  }

  /**
   * Extract public ID from Cloudinary URL
   * Example: https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg
   * Returns: sample
   */
  extractPublicIdFromUrl(url) {
    if (!url || typeof url !== 'string') return null;
    
    // Skip default profile images and external URLs
    if (
      url.includes('pixabay.com') ||
      url.includes('placeholder') ||
      !url.includes('cloudinary.com')
    ) {
      return null;
    }

    try {
      // Extract public ID from Cloudinary URL
      // Pattern: .../upload/v{version}/{folder}/{publicId}.{extension}
      const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
      const match = url.match(regex);
      if (match && match) {
        return match;
      }

      // Alternative pattern without version
      const altRegex = /\/upload\/(.+)\.\w+$/;
      const altMatch = url.match(altRegex);
      if (altMatch && altMatch) {
        return altMatch;
      }

      return null;
    } catch (error) {
      console.error('Error extracting public ID from URL:', url, error);
      return null;
    }
  }

  /**
   * Collect all image public IDs from Post schema
   */
  async collectPostImages() {
    try {
      const posts = await Post.find({}).lean();
      
      for (const post of posts) {
        // Main featured image
        if (post.featuredImagePublicId) {
          this.allUsedPublicIds.add(post.featuredImagePublicId);
        }
        
        // Extract from URL if publicId field is missing
        if (post.featuredImage && !post.featuredImagePublicId) {
          const extractedId = this.extractPublicIdFromUrl(post.featuredImage);
          if (extractedId) {
            this.allUsedPublicIds.add(extractedId);
          }
        }

        // Pending edit images
        if (post.pendingEdit) {
          if (post.pendingEdit.featuredImagePublicId) {
            this.allUsedPublicIds.add(post.pendingEdit.featuredImagePublicId);
          }
          
          if (post.pendingEdit.featuredImage && !post.pendingEdit.featuredImagePublicId) {
            const extractedId = this.extractPublicIdFromUrl(post.pendingEdit.featuredImage);
            if (extractedId) {
              this.allUsedPublicIds.add(extractedId);
            }
          }
        }
      }
      
      console.log(`✓ Collected ${posts.length} posts`);
    } catch (error) {
      console.error('Error collecting post images:', error);
      throw error;
    }
  }

  /**
   * Collect all image public IDs from User schema
   */
  async collectUserImages() {
    try {
      const users = await User.find({}).lean();
      
      for (const user of users) {
        if (user.profileImage) {
          const extractedId = this.extractPublicIdFromUrl(user.profileImage);
          if (extractedId) {
            this.allUsedPublicIds.add(extractedId);
          }
        }
      }
      
      console.log(`✓ Collected ${users.length} users`);
    } catch (error) {
      console.error('Error collecting user images:', error);
      throw error;
    }
  }

  /**
   * Collect all image public IDs from Announcement schema
   */
  async collectAnnouncementImages() {
    try {
      const announcements = await Announcement.find({}).lean();
      
      for (const announcement of announcements) {
        if (announcement.imagePublicId) {
          this.allUsedPublicIds.add(announcement.imagePublicId);
        }
        
        if (announcement.image && !announcement.imagePublicId) {
          const extractedId = this.extractPublicIdFromUrl(announcement.image);
          if (extractedId) {
            this.allUsedPublicIds.add(extractedId);
          }
        }
      }
      
      console.log(`✓ Collected ${announcements.length} announcements`);
    } catch (error) {
      console.error('Error collecting announcement images:', error);
      throw error;
    }
  }

  /**
   * Collect all image public IDs from Gallery/Event schema
   */
  async collectGalleryImages() {
    try {
      const events = await Event.find({}).lean();
      
      for (const event of events) {
        if (event.images && Array.isArray(event.images)) {
          for (const image of event.images) {
            if (image.publicId) {
              this.allUsedPublicIds.add(image.publicId);
            }
            
            if (image.url && !image.publicId) {
              const extractedId = this.extractPublicIdFromUrl(image.url);
              if (extractedId) {
                this.allUsedPublicIds.add(extractedId);
              }
            }
          }
        }
      }
      
      console.log(`✓ Collected ${events.length} gallery events`);
    } catch (error) {
      console.error('Error collecting gallery images:', error);
      throw error;
    }
  }

  /**
   * Collect all image public IDs from Alumni schema
   */
  async collectAlumniImages() {
    try {
      const alumni = await Alumni.find({}).lean();
      
      for (const alumnus of alumni) {
        if (alumnus.photoPublicId) {
          this.allUsedPublicIds.add(alumnus.photoPublicId);
        }
        
        if (alumnus.photo && !alumnus.photoPublicId) {
          const extractedId = this.extractPublicIdFromUrl(alumnus.photo);
          if (extractedId) {
            this.allUsedPublicIds.add(extractedId);
          }
        }
      }
      
      console.log(`✓ Collected ${alumni.length} alumni`);
    } catch (error) {
      console.error('Error collecting alumni images:', error);
      throw error;
    }
  }

  /**
   * Collect all image public IDs from Team schema
   */
  async collectTeamImages() {
    try {
      const teamMembers = await TeamMember.find({}).lean();
      
      for (const member of teamMembers) {
        if (member.photoPublicId) {
          this.allUsedPublicIds.add(member.photoPublicId);
        }
        
        if (member.photo && !member.photoPublicId) {
          const extractedId = this.extractPublicIdFromUrl(member.photo);
          if (extractedId) {
            this.allUsedPublicIds.add(extractedId);
          }
        }
      }
      
      console.log(`✓ Collected ${teamMembers.length} team members`);
    } catch (error) {
      console.error('Error collecting team images:', error);
      throw error;
    }
  }

  /**
   * Collect all image public IDs from AboutUs schema
   */
  async collectAboutUsImages() {
    try {
      const aboutUsSections = await AboutUs.find({}).lean();
      
      for (const section of aboutUsSections) {
        if (section.imagePublicId) {
          this.allUsedPublicIds.add(section.imagePublicId);
        }
        
        if (section.image && !section.imagePublicId) {
          const extractedId = this.extractPublicIdFromUrl(section.image);
          if (extractedId) {
            this.allUsedPublicIds.add(extractedId);
          }
        }
      }
      
      console.log(`✓ Collected ${aboutUsSections.length} about us sections`);
    } catch (error) {
      console.error('Error collecting about us images:', error);
      throw error;
    }
  }

  /**
   * Fetch all images from Cloudinary
   * Note: This uses pagination to handle large folders
   */
  async fetchCloudinaryImages(nextCursor = null) {
    try {
      const options = {
        type: 'upload',
        max_results: 500,
        resource_type: 'image'
      };

      if (nextCursor) {
        options.next_cursor = nextCursor;
      }

      const result = await cloudinary.api.resources(options);
      
      // Add all public IDs to the cloudinaryImages array
      this.cloudinaryImages.push(...result.resources.map(r => r.public_id));

      // If there's a next cursor, fetch more images recursively
      if (result.next_cursor) {
        await this.fetchCloudinaryImages(result.next_cursor);
      }
    } catch (error) {
      console.error('Error fetching Cloudinary images:', error);
      throw error;
    }
  }

  /**
   * Delete orphaned images from Cloudinary
   */
  async deleteOrphanedImages() {
    const orphanedImages = this.cloudinaryImages.filter(
      publicId => !this.allUsedPublicIds.has(publicId)
    );

    console.log(`\n📊 Found ${orphanedImages.length} orphaned images to delete`);

    if (orphanedImages.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        errorCount: 0,
        message: 'No orphaned images found'
      };
    }

    // Delete in batches of 100 (Cloudinary API limit)
    const batchSize = 100;
    for (let i = 0; i < orphanedImages.length; i += batchSize) {
      const batch = orphanedImages.slice(i, i + batchSize);
      
      for (const publicId of batch) {
        try {
          const result = await cloudinary.uploader.destroy(publicId);
          
          if (result.result === 'ok' || result.result === 'not found') {
            this.deletedCount++;
            console.log(`✓ Deleted: ${publicId}`);
          } else {
            this.errorCount++;
            console.log(`✗ Failed to delete: ${publicId} - ${result.result}`);
          }
        } catch (error) {
          this.errorCount++;
          console.error(`✗ Error deleting ${publicId}:`, error.message);
        }
      }

      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < orphanedImages.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      success: true,
      deletedCount: this.deletedCount,
      errorCount: this.errorCount,
      totalOrphaned: orphanedImages.length,
      message: `Deleted ${this.deletedCount} orphaned images, ${this.errorCount} errors`
    };
  }

  /**
   * Main cleanup function - orchestrates the entire cleanup process
   */
  async runCleanup() {
    console.log('\n🧹 Starting Global Cloudinary Cleanup...\n');
    
    const startTime = Date.now();
    this.allUsedPublicIds.clear();
    this.deletedCount = 0;
    this.errorCount = 0;
    this.cloudinaryImages = [];

    try {
      // Step 1: Collect all image public IDs from all schemas
      console.log('📋 Step 1: Collecting images from all schemas...');
      await this.collectPostImages();
      await this.collectUserImages();
      await this.collectAnnouncementImages();
      await this.collectGalleryImages();
      await this.collectAlumniImages();
      await this.collectTeamImages();
      await this.collectAboutUsImages();
      
      console.log(`\n✓ Total images in database: ${this.allUsedPublicIds.size}`);

      // Step 2: Fetch all images from Cloudinary
      console.log('\n📋 Step 2: Fetching all images from Cloudinary...');
      await this.fetchCloudinaryImages();
      console.log(`✓ Total images in Cloudinary: ${this.cloudinaryImages.length}`);

      // Step 3: Delete orphaned images
      console.log('\n📋 Step 3: Deleting orphaned images...');
      const result = await this.deleteOrphanedImages();

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log(`\n✅ Cleanup completed in ${duration}s`);
      console.log(`📊 Summary:`);
      console.log(`   - Images in database: ${this.allUsedPublicIds.size}`);
      console.log(`   - Images in Cloudinary: ${this.cloudinaryImages.length}`);
      console.log(`   - Orphaned images deleted: ${result.deletedCount}`);
      console.log(`   - Errors: ${result.errorCount}`);

      return {
        ...result,
        duration: `${duration}s`,
        imagesInDatabase: this.allUsedPublicIds.size,
        imagesInCloudinary: this.cloudinaryImages.length
      };
    } catch (error) {
      console.error('\n❌ Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Run cleanup with age filter (only delete images older than X days)
   * @param {number} minAgeDays - Minimum age in days for images to be considered orphaned
   */
  async runCleanupWithAgeFilter(minAgeDays = 1) {
    console.log(`\n🧹 Starting Global Cloudinary Cleanup (images older than ${minAgeDays} days)...\n`);
    
    const startTime = Date.now();
    this.allUsedPublicIds.clear();
    this.deletedCount = 0;
    this.errorCount = 0;
    this.cloudinaryImages = [];

    try {
      // Step 1: Collect all image public IDs from all schemas
      console.log('📋 Step 1: Collecting images from all schemas...');
      await this.collectPostImages();
      await this.collectUserImages();
      await this.collectAnnouncementImages();
      await this.collectGalleryImages();
      await this.collectAlumniImages();
      await this.collectTeamImages();
      await this.collectAboutUsImages();
      
      console.log(`\n✓ Total images in database: ${this.allUsedPublicIds.size}`);

      // Step 2: Fetch all images from Cloudinary with age filter
      console.log('\n📋 Step 2: Fetching images from Cloudinary...');
      await this.fetchCloudinaryImagesWithAge(minAgeDays);
      console.log(`✓ Total images in Cloudinary (older than ${minAgeDays} days): ${this.cloudinaryImages.length}`);

      // Step 3: Delete orphaned images
      console.log('\n📋 Step 3: Deleting orphaned images...');
      const result = await this.deleteOrphanedImages();

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log(`\n✅ Cleanup completed in ${duration}s`);

      return {
        ...result,
        duration: `${duration}s`,
        imagesInDatabase: this.allUsedPublicIds.size,
        imagesInCloudinary: this.cloudinaryImages.length,
        minAgeDays
      };
    } catch (error) {
      console.error('\n❌ Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Fetch images from Cloudinary that are older than specified days
   */
  async fetchCloudinaryImagesWithAge(minAgeDays, nextCursor = null) {
    try {
      const options = {
        type: 'upload',
        max_results: 500,
        resource_type: 'image'
      };

      if (nextCursor) {
        options.next_cursor = nextCursor;
      }

      const result = await cloudinary.api.resources(options);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - minAgeDays);

      // Filter images by age
      const oldImages = result.resources.filter(r => {
        const uploadedAt = new Date(r.created_at);
        return uploadedAt < cutoffDate;
      });

      this.cloudinaryImages.push(...oldImages.map(r => r.public_id));

      // If there's a next cursor, fetch more images recursively
      if (result.next_cursor) {
        await this.fetchCloudinaryImagesWithAge(minAgeDays, result.next_cursor);
      }
    } catch (error) {
      console.error('Error fetching Cloudinary images with age filter:', error);
      throw error;
    }
  }
}

export default CloudinaryCleanupService;

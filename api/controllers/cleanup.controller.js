import CloudinaryCleanupService from '../services/cloudinaryCleanup.service.js';

/**
 * Run global cleanup - delete all orphaned images
 * @route POST /api/cleanup/orphaned-images
 * @access Admin only
 */
export const cleanupOrphanedImages = async (req, res) => {
  try {
    const { minAgeDays = 0 } = req.body;

    const cleanupService = new CloudinaryCleanupService();
    
    let result;
    if (minAgeDays > 0) {
      result = await cleanupService.runCleanupWithAgeFilter(minAgeDays);
    } else {
      result = await cleanupService.runCleanup();
    }

    res.status(200).json({
      success: true,
      message: 'Cleanup completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in cleanup controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup orphaned images',
      error: error.message
    });
  }
};

/**
 * Get cleanup statistics without deleting anything
 * @route GET /api/cleanup/stats
 * @access Admin only
 */
export const getCleanupStats = async (req, res) => {
  try {
    const cleanupService = new CloudinaryCleanupService();
    
    // Collect all used images
    await cleanupService.collectPostImages();
    await cleanupService.collectUserImages();
    await cleanupService.collectAnnouncementImages();
    await cleanupService.collectGalleryImages();
    await cleanupService.collectAlumniImages();
    await cleanupService.collectTeamImages();
    await cleanupService.collectAboutUsImages();

    // Fetch Cloudinary images
    await cleanupService.fetchCloudinaryImages();

    const orphanedImages = cleanupService.cloudinaryImages.filter(
      publicId => !cleanupService.allUsedPublicIds.has(publicId)
    );

    res.status(200).json({
      success: true,
      data: {
        imagesInDatabase: cleanupService.allUsedPublicIds.size,
        imagesInCloudinary: cleanupService.cloudinaryImages.length,
        orphanedImages: orphanedImages.length,
        orphanedImagesList: orphanedImages.slice(0, 50), // First 50 for preview
        estimatedCleanupTime: `${(orphanedImages.length * 0.5).toFixed(1)}s`
      }
    });
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cleanup statistics',
      error: error.message
    });
  }
};

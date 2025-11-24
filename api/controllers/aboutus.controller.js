import AboutUs from '../models/aboutus.model.js';
import cloudinaryPkg from 'cloudinary';

const cloudinary = cloudinaryPkg.v2;

// Get About Us content
export const getAboutUs = async (req, res) => {
  try {
    let aboutUs = await AboutUs.findOne().populate('updatedBy', 'username');

    // If no AboutUs exists, create default one
    if (!aboutUs) {
      aboutUs = await AboutUs.create({
        vision: '',
        mission: '',
        description: 'Welcome to our vibrant community dedicated to Hindi literature and debate'
      });
    }

    res.status(200).json({
      success: true,
      data: aboutUs
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update About Us content (Admin only)
export const updateAboutUs = async (req, res) => {
  try {
    const { title, vision, mission, description, image, imagePublicId } = req.body;

    // Validate required fields
    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    let aboutUs = await AboutUs.findOne();

    // If updating image and old image exists, delete from Cloudinary
    if (image !== undefined && image !== aboutUs?.image && aboutUs?.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(aboutUs.imagePublicId);
        console.log('Old image deleted from Cloudinary:', aboutUs.imagePublicId);
      } catch (error) {
        console.error('Error deleting old image from Cloudinary:', error);
      }
    }

    if (!aboutUs) {
      // Create new AboutUs document if it doesn't exist
      aboutUs = await AboutUs.create({
        title: title || 'About Us',
        vision: vision || null,
        mission: mission || null,
        description,
        image: image || null,
        imagePublicId: imagePublicId || null,
        updatedBy: req.user.id
      });
    } else {
      // Update existing document
      aboutUs = await AboutUs.findByIdAndUpdate(
        aboutUs._id,
        {
          title: title || aboutUs.title,
          vision: vision || null,
          mission: mission || null,
          description,
          image: image !== undefined ? image : aboutUs.image,
          imagePublicId: imagePublicId !== undefined ? imagePublicId : aboutUs.imagePublicId,
          updatedBy: req.user.id,
          updatedAt: Date.now()
        },
        { new: true, runValidators: true }
      ).populate('updatedBy', 'username');
    }

    res.status(200).json({
      success: true,
      data: aboutUs,
      message: 'About Us updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

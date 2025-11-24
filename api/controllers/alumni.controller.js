import Alumni from '../models/alumni.model.js';
import cloudinaryPkg from 'cloudinary';

const cloudinary = cloudinaryPkg.v2;

// Get all alumni grouped by year
export const getAlumni = async (req, res) => {
  try {
    const alumni = await Alumni.find({ isActive: true })
      .populate('addedBy', 'username')
      .sort({ passoutYear: -1, createdAt: 1 });

    // Group alumni by passout year
    const groupedAlumni = alumni.reduce((groups, alumnus) => {
      const year = alumnus.passoutYear;
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(alumnus);
      return groups;
    }, {});

    res.status(200).json({
      success: true,
      data: groupedAlumni
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get alumni by specific year
export const getAlumniByYear = async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const alumni = await Alumni.find({
      passoutYear: year,
      isActive: true
    })
      .populate('addedBy', 'username')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: alumni.length,
      data: alumni
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get single alumnus
export const getAlumnus = async (req, res) => {
  try {
    const alumnus = await Alumni.findById(req.params.id)
      .populate('addedBy', 'username profileImage');
    if (!alumnus) {
      return res.status(404).json({
        success: false,
        message: 'Alumnus not found'
      });
    }
    res.status(200).json({
      success: true,
      data: alumnus
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Create alumni record (Admin only)
export const createAlumni = async (req, res) => {
  try {
    const {
      name,
      photo,
      photoPublicId,
      passoutYear,
      linkedinUrl,
      githubUrl,
      instagramUrl
    } = req.body;

    const alumnus = await Alumni.create({
      name,
      photo: photo || null,
      photoPublicId: photoPublicId || null,
      passoutYear,
      linkedinUrl,
      githubUrl,
      instagramUrl,
      addedBy: req.user.id
    });

    const populatedAlumnus = await Alumni.findById(alumnus._id)
      .populate('addedBy', 'username');

    res.status(201).json({
      success: true,
      data: populatedAlumnus,
      message: 'Alumni created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update alumni record (Admin only)
export const updateAlumni = async (req, res) => {
  try {
    let alumnus = await Alumni.findById(req.params.id);
    if (!alumnus) {
      return res.status(404).json({
        success: false,
        message: 'Alumnus not found'
      });
    }

    // If photo is being updated and old photo exists in Cloudinary, delete it
    if (req.body.photo !== undefined && req.body.photo !== alumnus.photo && alumnus.photoPublicId) {
      try {
        await cloudinary.uploader.destroy(alumnus.photoPublicId);
        console.log('Old photo deleted from Cloudinary:', alumnus.photoPublicId);
      } catch (error) {
        console.error('Error deleting old photo from Cloudinary:', error);
      }
    }

    alumnus = await Alumni.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('addedBy', 'username');

    res.status(200).json({
      success: true,
      data: alumnus,
      message: 'Alumni updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete alumni record (Admin only)
export const deleteAlumni = async (req, res) => {
  try {
    const alumnus = await Alumni.findById(req.params.id);
    if (!alumnus) {
      return res.status(404).json({
        success: false,
        message: 'Alumnus not found'
      });
    }

    // Delete photo from Cloudinary if it exists
    if (alumnus.photoPublicId) {
      try {
        await cloudinary.uploader.destroy(alumnus.photoPublicId);
        console.log('Photo deleted from Cloudinary:', alumnus.photoPublicId);
      } catch (error) {
        console.error('Error deleting photo from Cloudinary:', error);
      }
    }

    await Alumni.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Alumni record deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Toggle alumni status
export const toggleAlumniStatus = async (req, res) => {
  try {
    const alumnus = await Alumni.findById(req.params.id);
    if (!alumnus) {
      return res.status(404).json({
        success: false,
        message: 'Alumnus not found'
      });
    }

    alumnus.isActive = !alumnus.isActive;
    await alumnus.save();
    res.status(200).json({
      success: true,
      data: alumnus,
      message: `Alumni ${alumnus.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get available passout years
export const getPassoutYears = async (req, res) => {
  try {
    const years = await Alumni.distinct('passoutYear', { isActive: true });
    years.sort((a, b) => b - a);
    res.status(200).json({
      success: true,
      data: years
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
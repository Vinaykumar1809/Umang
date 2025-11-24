import TeamMember from '../models/team.model.js';
import cloudinaryPkg from 'cloudinary';

const cloudinary = cloudinaryPkg.v2;

// Get all active team members
export const getTeamMembers = async (req, res) => {
  try {
    const teamMembers = await TeamMember.find({ isActive: true })
      .populate('addedBy', 'username')
      .sort({ createdAt: 1 });
    res.status(200).json({
      success: true,
      count: teamMembers.length,
      data: teamMembers
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get single team member
export const getTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id)
      .populate('addedBy', 'username');
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }
    res.status(200).json({
      success: true,
      data: teamMember
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Create team member (Admin only)
export const createTeamMember = async (req, res) => {
  try {
    const { name, position, photo, photoPublicId, linkedinUrl, githubUrl, instagramUrl } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const teamMember = await TeamMember.create({
      name,
      position,
      photo: photo || null,
      photoPublicId: photoPublicId || null,
      linkedinUrl,
      githubUrl,
      instagramUrl,
      addedBy: req.user.id
    });

    const populatedTeamMember = await TeamMember.findById(teamMember._id)
      .populate('addedBy', 'username');
    res.status(201).json({
      success: true,
      data: populatedTeamMember,
      message: 'Team member created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update team member (Admin only)
export const updateTeamMember = async (req, res) => {
  try {
    let teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // If photo is being updated and old photo exists in Cloudinary, delete it
    if (req.body.photo !== undefined && req.body.photo !== teamMember.photo && teamMember.photoPublicId) {
      try {
        await cloudinary.uploader.destroy(teamMember.photoPublicId);
        console.log('Old photo deleted from Cloudinary:', teamMember.photoPublicId);
      } catch (error) {
        console.error('Error deleting old photo from Cloudinary:', error);
        // Continue with update even if deletion fails
      }
    }

    teamMember = await TeamMember.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('addedBy', 'username');

    res.status(200).json({
      success: true,
      data: teamMember,
      message: 'Team member updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete team member (Admin only)
export const deleteTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Delete photo from Cloudinary if it exists
    if (teamMember.photoPublicId) {
      try {
        await cloudinary.uploader.destroy(teamMember.photoPublicId);
        console.log('Photo deleted from Cloudinary:', teamMember.photoPublicId);
      } catch (error) {
        console.error('Error deleting photo from Cloudinary:', error);
        // Continue with deletion even if Cloudinary deletion fails
      }
    }

    await TeamMember.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Team member deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Toggle team member status
export const toggleTeamMemberStatus = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    teamMember.isActive = !teamMember.isActive;
    await teamMember.save();
    res.status(200).json({
      success: true,
      data: teamMember,
      message: `Team member ${teamMember.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
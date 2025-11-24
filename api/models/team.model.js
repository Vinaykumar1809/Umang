import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  photo: {
    type: String,
    default: null
  },
  photoPublicId: {
    type: String,
    default: null
  },
  linkedinUrl: String,
  githubUrl: String,
  instagramUrl: String,
  isActive: {
    type: Boolean,
    default: true
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  addedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

teamMemberSchema.index({ position: 1, name: 1 });

export default mongoose.model('TeamMember', teamMemberSchema);
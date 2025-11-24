import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    image: String,
    imagePublicId: String,
    links: [
      {
        title: String,
        url: String,
      },
    ],
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    featuredUntil: Date,
    targetAudience: {
      type: String,
      enum: ['all', 'users', 'members', 'admins'],
      default: 'all',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

announcementSchema.index({ isFeatured: -1, createdAt: -1 });
announcementSchema.index({ isActive: 1, createdAt: -1 });

export default mongoose.model('Announcement', announcementSchema);

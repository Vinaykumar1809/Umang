import mongoose from 'mongoose';

const aboutUsSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'About Us'
  },
  vision: {
    type: String,
    maxlength: 1000,
    default: null
  },
  mission: {
    type: String,
    maxlength: 1000,
    default: null
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  image: {
    type: String,
    default: null
  },
  imagePublicId: {
    type: String,
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('AboutUs', aboutUsSchema);

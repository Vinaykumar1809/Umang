import { Event } from '../models/gallery.model.js';

// Create new event
export const createEvent = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Event title is required',
      });
    }

    const newEvent = new Event({
      title: title.trim(),
      description: description ? description.trim() : '',
      images: [],
      createdBy: req.user.id,
    });

    const savedEvent = await newEvent.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: savedEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating event',
      details: error.message,
    });
  }
};

// Get all events (sorted by newest first)
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username email')
      .lean();

    res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      details: error.message,
    });
  }
};

// Get single event by ID
export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate(
      'createdBy',
      'username email'
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      details: error.message,
    });
  }
};

// Add image to event (new image at the beginning)
export const addImageToEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { imageUrl, publicId } = req.body;

    if (!imageUrl || !publicId) {
      return res.status(400).json({
        success: false,
        message: 'Image URL and publicId are required',
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Add image at the beginning of the array
    event.images.unshift({
      url: imageUrl,
      publicId: publicId,
      uploadedAt: new Date(),
    });

    const updatedEvent = await event.save();

    res.status(200).json({
      success: true,
      message: 'Image added successfully',
      event: updatedEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding image to event',
      details: error.message,
    });
  }
};

// Delete image from event
export const deleteImageFromEvent = async (req, res) => {
  try {
    const { eventId, imageId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Find and remove the image
    const imageIndex = event.images.findIndex(
      (img) => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in event',
      });
    }

    const publicId = event.images[imageIndex].publicId;
    event.images.splice(imageIndex, 1);

    const updatedEvent = await event.save();

    res.status(200).json({
      success: true,
      message: 'Image removed from event',
      publicId,
      event: updatedEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing image from event',
      details: error.message,
    });
  }
};

// Update event title and description
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Event title is required',
      });
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        title: title.trim(),
        description: description ? description.trim() : '',
      },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating event',
      details: error.message,
    });
  }
};

// Delete entire event
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findByIdAndDelete(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Return all publicIds for Cloudinary deletion
    const publicIds = event.images.map((img) => img.publicId);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      publicIds,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting event',
      details: error.message,
    });
  }
};

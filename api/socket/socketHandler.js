import jwt from  'jsonwebtoken';
import User from  '../models/user.model.js';

export const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.userRole = user.role;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
};

export const handleConnection = (io) => {
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join user to role-based rooms
    socket.join(`role_${socket.userRole}`);

    // Handle joining specific rooms
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`User ${socket.userId} joined room: ${room}`);
    });

    // Handle leaving rooms
    socket.on('leave_room', (room) => {
      socket.leave(room);
      console.log(`User ${socket.userId} left room: ${room}`);
    });

    // Handle real-time typing indicators (for comments)
    socket.on('typing_start', (data) => {
      socket.to(data.postId).emit('user_typing', {
        userId: socket.userId,
        postId: data.postId
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(data.postId).emit('user_stopped_typing', {
        userId: socket.userId,
        postId: data.postId
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });

    // Handle notification acknowledgment
    socket.on('notification_read', (notificationId) => {
      // This will be handled by the notification controller
      console.log(`User ${socket.userId} read notification: ${notificationId}`);
    });
  });
};



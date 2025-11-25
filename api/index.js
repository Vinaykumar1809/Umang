import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import connectDB from './config/database.js';
import { handleConnection } from './socket/socketHandler.js';

import authRoutes from './routes/auth.route.js';
import postsRoutes from './routes/post.route.js';
import usersRoutes from './routes/user.route.js';
import commentsRoutes from './routes/comment.route.js';
import announcementsRoutes from './routes/announcement.route.js';
import notificationsRoutes from './routes/notification.route.js';
import postSearchRouter from './routes/search.route.js';
import aboutUsRoutes from './routes/aboutus.route.js';
import teamRoutes from './routes/team.route.js';
import alumniRoutes from './routes/alumni.route.js';
import galleryRoutes from './routes/gallery.route.js';
import galleryImagesRoutes from './routes/galleryImage.route.js';
import imageRoutes from './routes/images.route.js';

import { startAutoReactivationJob } from './utils/userAutoReactivation.js';
import cleanupRoutes from './routes/cleanup.route.js';
import CleanupScheduler from './jobs/cleanupScheduler.js';

const startServer = async () => {

  await connectDB();

  const app = express();
  const server = http.createServer(app);

  const io = new SocketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  handleConnection(io);

  app.set('trust proxy', 1); 
  
  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  app.use(helmet());

  const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100
  });
  app.use(limiter);


  startAutoReactivationJob();
  CleanupScheduler.initializeScheduler();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false }));

  app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  }));

  app.use('/uploads', express.static('uploads'));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/comments', commentsRoutes);
  app.use('/api/announcements', announcementsRoutes);
  app.use('/api/aboutus', aboutUsRoutes);
  app.use('/api/team', teamRoutes);
  app.use('/api/alumni', alumniRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/posts', postSearchRouter);
  app.use('/api/gallery', galleryRoutes);
  app.use('/api/galleryImages/', galleryImagesRoutes);
  app.use('/api/images/', imageRoutes);
  app.use('/api/cleanup', cleanupRoutes);

  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
  });
};

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

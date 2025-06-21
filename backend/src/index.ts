import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/user.js';
import { chatRoutes } from './routes/chat.js';
import { podcastRoutes } from './routes/podcasts.js';
import { playbackRoutes } from './routes/playback.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/podcasts', podcastRoutes);
app.use('/api/playback', playbackRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 SuperPod backend running on port ${PORT}`);
  console.log(`📅 Started at ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
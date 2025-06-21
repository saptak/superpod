import { Request, Response, NextFunction } from 'express';
import { APIError } from '../types/index.js';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  const apiError: APIError = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  // Handle specific error types
  if (error.name === 'ValidationError') {
    apiError.error.code = 'VALIDATION_ERROR';
    apiError.error.message = error.message;
    return res.status(400).json(apiError);
  }

  if (error.message.includes('YouTube API')) {
    apiError.error.code = 'YOUTUBE_API_ERROR';
    apiError.error.message = 'YouTube API error occurred';
    return res.status(502).json(apiError);
  }

  if (error.message.includes('AI service')) {
    apiError.error.code = 'AI_SERVICE_ERROR';
    apiError.error.message = 'AI service error occurred';
    return res.status(502).json(apiError);
  }

  if (error.message.includes('Token expired')) {
    apiError.error.code = 'TOKEN_EXPIRED';
    apiError.error.message = 'Access token has expired';
    return res.status(401).json(apiError);
  }

  if (error.message.includes('Unauthorized')) {
    apiError.error.code = 'AUTH_REQUIRED';
    apiError.error.message = 'Authentication required';
    return res.status(401).json(apiError);
  }

  res.status(500).json(apiError);
};
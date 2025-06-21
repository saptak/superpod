import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, YouTubeUser } from '../types/index.js';

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Access token is required',
      },
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      user: YouTubeUser;
      accessToken: string;
    };
    
    req.user = decoded.user;
    req.accessToken = decoded.accessToken;
    next();
  } catch (error) {
    return res.status(403).json({
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Access token is invalid or expired',
      },
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }
};
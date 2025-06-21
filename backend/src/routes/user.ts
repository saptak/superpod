import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { AuthenticatedRequest, YouTubeUser, UserInterests } from '../types/index.js';

const router = Router();

// GET /api/user/profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTH_REQUIRED',
          message: 'User not authenticated',
        },
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
    }

    const user: YouTubeUser = req.user;
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// GET /api/user/interests
router.get('/interests', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user || !req.accessToken) {
      return res.status(401).json({
        error: {
          code: 'AUTH_REQUIRED',
          message: 'User not authenticated',
        },
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
    }

    // TODO: Implement YouTube API calls to fetch:
    // - User's subscriptions
    // - Watch history
    // - Liked videos
    // - Channel categories
    
    const interests: UserInterests = {
      topChannels: [],
      topCategories: ['Technology', 'Education'],
      recentlyWatched: [],
      subscriptions: [],
      engagementProfile: {
        averageWatchTime: 600, // 10 minutes
        preferredVideoLength: 'medium',
        topicPreferences: ['tech', 'science', 'business'],
      },
    };

    res.json(interests);
  } catch (error) {
    next(error);
  }
});

export { router as userRoutes };
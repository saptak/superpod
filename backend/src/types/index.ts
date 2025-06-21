import { Request } from 'express';

// Core YouTube Types (matching frontend)
export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnail[];
  subscriberCount: number;
  videoCount: number;
  customUrl: string;
  publishedAt: string;
  categories: string[];
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnail[];
  channelId: string;
  channelTitle: string;
  duration: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags: string[];
  categoryId: string;
  liveBroadcastContent: 'none' | 'upcoming' | 'live';
  defaultAudioLanguage?: string;
}

export interface CaptionSegment {
  start: number;
  duration: number;
  text: string;
  confidence?: number;
}

// User Types
export interface YouTubeUser {
  id: string;
  displayName: string;
  email: string;
  profileImageUrl: string;
  channelId: string;
  subscriberCount: number;
}

export interface UserInterests {
  topChannels: YouTubeChannel[];
  topCategories: string[];
  recentlyWatched: YouTubeVideo[];
  subscriptions: YouTubeChannel[];
  engagementProfile: {
    averageWatchTime: number;
    preferredVideoLength: 'short' | 'medium' | 'long';
    topicPreferences: string[];
  };
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    podcastRecommendations?: PodcastRecommendation[];
  };
}

export interface ChatConversation {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// Application-Specific Types
export interface PodcastRecommendation {
  channel?: YouTubeChannel;
  video?: YouTubeVideo;
  reasoningText: string;
  relevanceScore: number;
  matchedInterests: string[];
}

export interface PlaybackState {
  isPlaying: boolean;
  currentVideo?: YouTubeVideo;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  quality: string;
}

// API Request/Response Types
export interface GoogleLoginRequest {
  redirectUri: string;
}

export interface GoogleLoginResponse {
  authUrl: string;
  state: string;
}

export interface GoogleCallbackRequest {
  code: string;
  state: string;
}

export interface GoogleCallbackResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: YouTubeUser;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface ChatMessageRequest {
  message: string;
  conversationId?: string;
  userContext: {
    youtubeProfile: YouTubeUser;
    interests: UserInterests;
  };
}

export interface ChatMessageResponse {
  response: string;
  conversationId: string;
  timestamp: string;
  podcastRecommendations?: PodcastRecommendation[];
}

// Express Extensions
export interface AuthenticatedRequest extends Request {
  user?: YouTubeUser;
  accessToken?: string;
}

// Environment Variables
export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
  LLAMA_API_URL: string;
  LLAMA_API_KEY: string;
  FRONTEND_URL: string;
}

// Error Types
export interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}
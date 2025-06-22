// Core YouTube Types
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

// API Types
export interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}

// Auth Types
export interface AuthState {
  isAuthenticated: boolean;
  user: YouTubeUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}
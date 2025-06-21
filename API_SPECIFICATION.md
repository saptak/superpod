# SuperPod Frontend Service API Specification

## Overview

This document defines the API interface between the SuperPod frontend and the service layer. All endpoints return JSON responses and use TypeScript interfaces for type safety.

## Base Configuration

```typescript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'
```

## Authentication Endpoints

### POST /auth/google/login

Initiate Google OAuth 2.0 flow for YouTube access

```typescript
interface GoogleLoginRequest {
  redirectUri: string;
}

interface GoogleLoginResponse {
  authUrl: string;
  state: string;
}
```

### POST /auth/google/callback

Exchange authorization code for access token

```typescript
interface GoogleCallbackRequest {
  code: string;
  state: string;
}

interface GoogleCallbackResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: YouTubeUser;
}
```

### POST /auth/refresh

Refresh expired access token

```typescript
interface RefreshTokenRequest {
  refreshToken: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}
```

## User Profile Endpoints

### GET /user/profile

Get authenticated user's YouTube profile

```typescript
interface YouTubeUser {
  id: string;
  displayName: string;
  email: string;
  profileImageUrl: string;
  channelId: string;
  subscriberCount: number;
}
```

### GET /user/interests

Extract user interests from YouTube watch history and subscriptions

```typescript
interface UserInterests {
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
```

## Chat Endpoints

### POST /chat/message

Send message to AI with user context

```typescript
interface ChatMessageRequest {
  message: string;
  conversationId?: string;
  userContext: {
    youtubeProfile: YouTubeUser;
    interests: UserInterests;
  };
}

interface ChatMessageResponse {
  response: string;
  conversationId: string;
  timestamp: string;
  podcastRecommendations?: PodcastRecommendation[];
}
```

### GET /chat/conversation/:conversationId

Get chat conversation history

```typescript
interface ChatConversation {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    podcastRecommendations?: PodcastRecommendation[];
  };
}
```

## Podcast Endpoints

### GET /podcasts/search

Search YouTube podcasts with personalized results (query parameters)

```typescript
interface PodcastSearchParams {
  query: string;
  limit?: number;
  offset?: number;
}

interface PodcastSearchResponse {
  podcasts: YouTubeChannel[];
  videos: YouTubeVideo[];
  total: number;
  limit: number;
  offset: number;
}
```

### GET /podcasts/recommendations

Get personalized podcast recommendations (uses authenticated user context)

```typescript
interface PodcastRecommendationsParams {
  limit?: number;
}

interface PodcastRecommendationsResponse {
  recommendations: PodcastRecommendation[];
  reasoning: string;
}
```

### GET /podcasts/channels/:channelId/videos

Get videos for a specific podcast channel

```typescript
interface ChannelVideosResponse {
  videos: YouTubeVideo[];
  total: number;
  limit: number;
  offset: number;
}
```

### POST /podcasts/videos/:videoId/synopsis

Generate AI synopsis for podcast video (uses authenticated user context)

```typescript
interface VideoSynopsisRequest {
  // No body required - uses authenticated user context
}

interface VideoSynopsisResponse {
  synopsis: string;
  keyTopics: string[];
  relevanceScore: number;
  personalizedHighlights: string[];
  estimatedReadTime: number;
  captionHighlights: CaptionSegment[];
}
```

### GET /podcasts/videos/:videoId/captions

Get captions for a specific video

```typescript
interface VideoCaptionsResponse {
  captions: CaptionSegment[];
  language: string;
  duration: number;
}
```

## Playback Endpoints

### POST /playback/initialize

Initialize YouTube Player

```typescript
interface PlaybackInitializeRequest {
  videoId: string;
  playerId: string;
}

interface PlaybackInitializeResponse {
  ready: boolean;
  videoDetails: YouTubeVideo;
}
```

### POST /playback/play

Start playback of podcast video

```typescript
interface PlaybackPlayRequest {
  videoId: string;
  startTime?: number;
}

interface PlaybackPlayResponse {
  success: boolean;
  currentVideo?: YouTubeVideo;
  playbackState: PlaybackState;
}
```

### GET /playback/state

Get current playback state

```typescript
interface PlaybackState {
  isPlaying: boolean;
  currentVideo?: YouTubeVideo;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  quality: string;
}
```

## TypeScript Interfaces

### Core YouTube Types

```typescript
interface YouTubeChannel {
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

interface YouTubeVideo {
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

interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

interface CaptionSegment {
  start: number;
  duration: number;
  text: string;
  confidence?: number;
}
```

### Application-Specific Types

```typescript
interface PodcastRecommendation {
  channel?: YouTubeChannel;
  video?: YouTubeVideo;
  reasoningText: string;
  relevanceScore: number;
  matchedInterests: string[];
}
```

## Error Handling

All endpoints return consistent error responses:

```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}
```

Common error codes:

- `AUTH_REQUIRED`: Authentication required
- `TOKEN_EXPIRED`: Access token expired
- `YOUTUBE_API_ERROR`: YouTube API returned an error
- `AI_SERVICE_ERROR`: Llama 4.0 API error
- `VALIDATION_ERROR`: Request validation failed
- `RATE_LIMIT_EXCEEDED`: API rate limit exceeded
- `QUOTA_EXCEEDED`: YouTube API quota exceeded

## Rate Limiting

- Authentication endpoints: 10 requests per minute
- Chat endpoints: 30 requests per minute
- Podcast endpoints: 100 requests per minute
- Playback endpoints: 60 requests per minute

## Authentication

All endpoints except `/auth/google/login` require authentication via Bearer token:

```http
Authorization: Bearer <access_token>
```
# SuperPod Frontend Service API Specification

## Overview
This document defines the API interface between the SuperPod frontend and the service layer. All endpoints return JSON responses and use TypeScript interfaces for type safety.

## Base Configuration
```typescript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'
```

## Authentication Endpoints

### POST /auth/spotify/login
Initiate Spotify OAuth 2.0 flow with PKCE
```typescript
interface SpotifyLoginRequest {
  redirectUri: string;
}

interface SpotifyLoginResponse {
  authUrl: string;
  codeVerifier: string;
  state: string;
}
```

### POST /auth/spotify/callback
Exchange authorization code for access token
```typescript
interface SpotifyCallbackRequest {
  code: string;
  codeVerifier: string;
  state: string;
}

interface SpotifyCallbackResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: SpotifyUser;
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
Get authenticated user's Spotify profile
```typescript
interface SpotifyUser {
  id: string;
  displayName: string;
  email: string;
  images: SpotifyImage[];
  country: string;
  product: 'free' | 'premium';
}
```

### GET /user/interests
Extract user interests from Spotify listening history
```typescript
interface UserInterests {
  topGenres: string[];
  topArtists: SpotifyArtist[];
  topTracks: SpotifyTrack[];
  recentlyPlayed: SpotifyTrack[];
  musicProfile: {
    danceability: number;
    energy: number;
    valence: number;
    acousticness: number;
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
    spotifyProfile: SpotifyUser;
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
Search Spotify podcasts with personalized results (query parameters)
```typescript
interface PodcastSearchParams {
  query: string;
  limit?: number;
  offset?: number;
}

interface PodcastSearchResponse {
  podcasts: SpotifyPodcast[];
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

### GET /podcasts/:podcastId/episodes
Get episodes for a specific podcast
```typescript
interface PodcastEpisodesResponse {
  episodes: SpotifyEpisode[];
  total: number;
  limit: number;
  offset: number;
}
```

### POST /podcasts/episodes/:episodeId/synopsis
Generate AI synopsis for podcast episode (uses authenticated user context)
```typescript
interface EpisodeSynopsisRequest {
  // No body required - uses authenticated user context
}

interface EpisodeSynopsisResponse {
  synopsis: string;
  keyTopics: string[];
  relevanceScore: number;
  personalizedHighlights: string[];
  estimatedReadTime: number;
}
```

## Playback Endpoints

### POST /playback/initialize
Initialize Spotify Web Playback SDK
```typescript
interface PlaybackInitializeRequest {
  accessToken: string;
  deviceName: string;
}

interface PlaybackInitializeResponse {
  deviceId: string;
  ready: boolean;
}
```

### POST /playback/play
Start playback of podcast episode
```typescript
interface PlaybackPlayRequest {
  episodeUri: string;
  deviceId: string;
  positionMs?: number;
}

interface PlaybackPlayResponse {
  success: boolean;
  currentTrack?: SpotifyEpisode;
}
```

### GET /playback/state
Get current playback state
```typescript
interface PlaybackState {
  isPlaying: boolean;
  currentTrack?: SpotifyEpisode;
  positionMs: number;
  durationMs: number;
  device: SpotifyDevice;
  shuffleState: boolean;
  repeatState: 'off' | 'track' | 'context';
}
```

## TypeScript Interfaces

### Core Spotify Types
```typescript
interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  genres: string[];
}

interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  durationMs: number;
  popularity: number;
}

interface SpotifyPodcast {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  publisher: string;
  totalEpisodes: number;
  languages: string[];
}

interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  durationMs: number;
  releaseDate: string;
  uri: string;
  playable: boolean;
}

interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  volumePercent: number;
  isActive: boolean;
}
```

### Application-Specific Types
```typescript
interface PodcastRecommendation {
  podcast: SpotifyPodcast;
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
- `SPOTIFY_API_ERROR`: Spotify API returned an error
- `AI_SERVICE_ERROR`: Llama 4.0 API error
- `VALIDATION_ERROR`: Request validation failed
- `RATE_LIMIT_EXCEEDED`: API rate limit exceeded

## Rate Limiting
- Authentication endpoints: 10 requests per minute
- Chat endpoints: 30 requests per minute
- Podcast endpoints: 100 requests per minute
- Playback endpoints: 60 requests per minute

## Authentication
All endpoints except `/auth/spotify/login` require authentication via Bearer token:
```
Authorization: Bearer <access_token>
```
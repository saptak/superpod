import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  MediaFile,
  ChatMessageRequest,
  ChatMessageResponse,
  Recommendation,
  SearchResult,
  PlaybackState,
} from '../types/api';

// Mock data
const mockUser: User = {
  id: '1',
  email: 'user@example.com',
  displayName: 'John Doe',
  createdAt: '2024-01-01T00:00:00Z',
  lastLoginAt: '2024-01-15T10:30:00Z',
};

const mockMediaFiles: MediaFile[] = [
  {
    id: '1',
    filename: 'startup-journey.mp3',
    title: 'The Startup Journey: From Idea to IPO',
    description: 'Deep dive into the entrepreneurial journey with successful founders',
    duration: 3600,
    fileSize: 52428800,
    mimeType: 'audio/mpeg',
    transcriptionStatus: 'completed',
    topics: ['entrepreneurship', 'startups', 'business', 'IPO'],
    genre: 'Business',
    uploadedAt: '2024-01-10T08:00:00Z',
    processedAt: '2024-01-10T08:30:00Z',
    streamUrl: '/api/stream/1',
    albumArt: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  },
  {
    id: '2',
    filename: 'ai-revolution.mp3',
    title: 'The AI Revolution: What\'s Next?',
    description: 'Exploring the future of artificial intelligence and its impact on society',
    duration: 2700,
    fileSize: 38400000,
    mimeType: 'audio/mpeg',
    transcriptionStatus: 'completed',
    topics: ['artificial intelligence', 'technology', 'future', 'society'],
    genre: 'Technology',
    uploadedAt: '2024-01-12T14:00:00Z',
    processedAt: '2024-01-12T14:25:00Z',
    streamUrl: '/api/stream/2',
    albumArt: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop',
  },
  {
    id: '3',
    filename: 'meditation-basics.mp3',
    title: 'Meditation Basics: Finding Inner Peace',
    description: 'A beginner\'s guide to meditation and mindfulness practices',
    duration: 1800,
    fileSize: 25600000,
    mimeType: 'audio/mpeg',
    transcriptionStatus: 'completed',
    topics: ['meditation', 'mindfulness', 'wellness', 'mental health'],
    genre: 'Health & Wellness',
    uploadedAt: '2024-01-14T09:00:00Z',
    processedAt: '2024-01-14T09:15:00Z',
    streamUrl: '/api/stream/3',
    albumArt: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
  },
  {
    id: '4',
    filename: 'coding-productivity.mp3',
    title: 'Coding Productivity Hacks',
    description: 'Tips and tricks to boost your programming efficiency',
    duration: 2400,
    fileSize: 34200000,
    mimeType: 'audio/mpeg',
    transcriptionStatus: 'completed',
    topics: ['programming', 'productivity', 'development', 'coding'],
    genre: 'Technology',
    uploadedAt: '2024-01-15T11:00:00Z',
    processedAt: '2024-01-15T11:20:00Z',
    streamUrl: '/api/stream/4',
    albumArt: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop',
  },
  {
    id: '5',
    filename: 'climate-solutions.mp3',
    title: 'Climate Solutions: Technology and Hope',
    description: 'Exploring innovative solutions to climate change',
    duration: 3200,
    fileSize: 45600000,
    mimeType: 'audio/mpeg',
    transcriptionStatus: 'completed',
    topics: ['climate', 'environment', 'technology', 'sustainability'],
    genre: 'Science',
    uploadedAt: '2024-01-16T14:00:00Z',
    processedAt: '2024-01-16T14:30:00Z',
    streamUrl: '/api/stream/5',
    albumArt: 'https://images.unsplash.com/photo-1569163139394-de44cb5894ba?w=400&h=400&fit=crop',
  },
  {
    id: '6',
    filename: 'creative-writing.mp3',
    title: 'The Art of Creative Writing',
    description: 'Unleashing your creativity through storytelling',
    duration: 2800,
    fileSize: 39900000,
    mimeType: 'audio/mpeg',
    transcriptionStatus: 'completed',
    topics: ['writing', 'creativity', 'storytelling', 'literature'],
    genre: 'Arts',
    uploadedAt: '2024-01-17T09:00:00Z',
    processedAt: '2024-01-17T09:25:00Z',
    streamUrl: '/api/stream/6',
    albumArt: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=400&fit=crop',
  },
];

const mockRecommendations: Recommendation[] = [
  {
    file: mockMediaFiles[0],
    reasoningText: 'Based on your interest in entrepreneurship and business growth',
    relevanceScore: 0.92,
    matchedInterests: ['entrepreneurship', 'business'],
  },
  {
    file: mockMediaFiles[1],
    reasoningText: 'You\'ve shown interest in technology and future trends',
    relevanceScore: 0.87,
    matchedInterests: ['technology', 'AI'],
  },
];

// Mock delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock token storage
let mockToken: string | null = null;
let currentConversationId = '1';

export const mockApiService = {
  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    await delay(800);
    
    if (credentials.email === 'user@example.com' && credentials.password === 'password') {
      mockToken = 'mock-jwt-token-12345';
      return {
        accessToken: mockToken,
        refreshToken: 'mock-refresh-token-67890',
        expiresIn: 3600,
        user: mockUser,
      };
    }
    
    throw new Error('Invalid credentials');
  },

  async register(userData: RegisterRequest): Promise<LoginResponse> {
    await delay(1000);
    
    const newUser: User = {
      ...mockUser,
      email: userData.email,
      displayName: userData.displayName,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    
    mockToken = 'mock-jwt-token-new-user';
    return {
      accessToken: mockToken,
      refreshToken: 'mock-refresh-token-new',
      expiresIn: 3600,
      user: newUser,
    };
  },

  async logout(): Promise<void> {
    await delay(300);
    mockToken = null;
  },

  // User endpoints
  async getCurrentUser(): Promise<User> {
    await delay(400);
    if (!mockToken) throw new Error('Not authenticated');
    return mockUser;
  },

  // Media endpoints
  async getMediaFiles(params?: { search?: string; limit?: number; offset?: number }): Promise<{
    files: MediaFile[];
    total: number;
    limit: number;
    offset: number;
  }> {
    await delay(600);
    
    let filteredFiles = [...mockMediaFiles];
    
    if (params?.search) {
      const searchTerm = params.search.toLowerCase();
      filteredFiles = filteredFiles.filter(file => 
        file.title.toLowerCase().includes(searchTerm) ||
        file.description?.toLowerCase().includes(searchTerm) ||
        file.topics.some(topic => topic.toLowerCase().includes(searchTerm))
      );
    }
    
    const limit = params?.limit || 10;
    const offset = params?.offset || 0;
    const paginatedFiles = filteredFiles.slice(offset, offset + limit);
    
    return {
      files: paginatedFiles,
      total: filteredFiles.length,
      limit,
      offset,
    };
  },

  async getMediaFile(fileId: string): Promise<MediaFile> {
    await delay(400);
    const file = mockMediaFiles.find(f => f.id === fileId);
    if (!file) throw new Error('File not found');
    return file;
  },

  // Chat endpoints
  async sendChatMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    await delay(1200);
    
    // Generate mock AI response based on message content
    let response = '';
    let recommendations: Recommendation[] = [];
    
    const message = request.message.toLowerCase();
    
    if (message.includes('startup') || message.includes('business')) {
      response = 'I found some great content about startups and entrepreneurship! The startup journey involves many challenges, but with the right mindset and preparation, success is achievable. Would you like me to recommend some specific episodes about startup funding or scaling strategies?';
      recommendations = [mockRecommendations[0]];
    } else if (message.includes('ai') || message.includes('technology')) {
      response = 'AI and technology are fascinating topics! The current revolution in artificial intelligence is transforming every industry. From machine learning to neural networks, there\'s so much to explore. Let me suggest some episodes that dive deep into these topics.';
      recommendations = [mockRecommendations[1]];
    } else if (message.includes('meditation') || message.includes('wellness')) {
      response = 'Mindfulness and meditation are excellent for mental well-being. Starting with just 10 minutes a day can make a significant difference in your stress levels and overall happiness. I have some beginner-friendly meditation content that might help.';
      recommendations = [{ file: mockMediaFiles[2], reasoningText: 'Perfect for beginners interested in meditation', relevanceScore: 0.95, matchedInterests: ['meditation', 'wellness'] }];
    } else {
      response = 'That\'s an interesting question! Based on your listening history and interests, I can help you discover relevant podcast content. What specific topics are you most curious about right now?';
      recommendations = mockRecommendations.slice(0, 2);
    }
    
    return {
      response,
      conversationId: request.conversationId || currentConversationId,
      timestamp: new Date().toISOString(),
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  },

  // Search endpoints
  async searchContent(query: string): Promise<SearchResult[]> {
    await delay(800);
    
    const results: SearchResult[] = mockMediaFiles
      .filter(file => 
        file.title.toLowerCase().includes(query.toLowerCase()) ||
        file.description?.toLowerCase().includes(query.toLowerCase()) ||
        file.topics.some(topic => topic.toLowerCase().includes(query.toLowerCase()))
      )
      .map(file => ({
        file,
        relevanceScore: Math.random() * 0.3 + 0.7, // 0.7-1.0
        matchedSegments: [],
        context: `Found match in "${file.title}" - ${file.description?.substring(0, 100)}...`,
      }));
    
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  },

  async getRecommendations(): Promise<Recommendation[]> {
    await delay(700);
    return mockRecommendations;
  },

  // Playback endpoints
  async startPlayback(fileId: string, startTime?: number): Promise<PlaybackState> {
    await delay(500);
    
    const file = mockMediaFiles.find(f => f.id === fileId);
    if (!file) throw new Error('File not found');
    
    return {
      sessionId: `session-${Date.now()}`,
      file,
      currentTime: startTime || 0,
      duration: file.duration,
      isPlaying: true,
      lastUpdated: new Date().toISOString(),
    };
  },

  // Utility
  isAuthenticated(): boolean {
    return !!mockToken;
  },

  getToken(): string | null {
    return mockToken;
  },
};
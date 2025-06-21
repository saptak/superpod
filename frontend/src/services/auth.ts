import { apiClient } from '../api/client';
import type { YouTubeUser, AuthState } from '../types';

interface GoogleLoginResponse {
  authUrl: string;
  state: string;
}

interface GoogleCallbackResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: YouTubeUser;
}

interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const stored = localStorage.getItem('superpod-auth');
    if (stored) {
      try {
        this.authState = JSON.parse(stored);
        if (this.authState.accessToken) {
          apiClient.setAccessToken(this.authState.accessToken);
        }
      } catch (error) {
        console.error('Failed to load auth state from storage:', error);
        this.clearAuth();
      }
    }
  }

  private saveToStorage() {
    localStorage.setItem('superpod-auth', JSON.stringify(this.authState));
  }

  private clearAuth() {
    this.authState = {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    };
    localStorage.removeItem('superpod-auth');
    apiClient.setAccessToken(null);
  }

  async initiateLogin(redirectUri: string): Promise<GoogleLoginResponse> {
    const response = await apiClient.post<GoogleLoginResponse>('/auth/google/login', {
      redirectUri,
    });
    return response;
  }

  async handleCallback(code: string, state: string): Promise<void> {
    const response = await apiClient.post<GoogleCallbackResponse>('/auth/google/callback', {
      code,
      state,
    });

    this.authState = {
      isAuthenticated: true,
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt: Date.now() + response.expiresIn * 1000,
    };

    apiClient.setAccessToken(response.accessToken);
    this.saveToStorage();
  }

  async refreshToken(): Promise<void> {
    if (!this.authState.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken: this.authState.refreshToken,
    });

    this.authState.accessToken = response.accessToken;
    this.authState.expiresAt = Date.now() + response.expiresIn * 1000;

    apiClient.setAccessToken(response.accessToken);
    this.saveToStorage();
  }

  async logout(): Promise<void> {
    this.clearAuth();
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  isTokenExpired(): boolean {
    if (!this.authState.expiresAt) return true;
    return Date.now() >= this.authState.expiresAt - 60000; // 1 minute buffer
  }

  async ensureValidToken(): Promise<void> {
    if (this.isTokenExpired() && this.authState.refreshToken) {
      await this.refreshToken();
    }
  }
}

export const authService = new AuthService();
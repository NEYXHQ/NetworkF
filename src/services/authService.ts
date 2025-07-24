import type { User, LoginCredentials, RegisterData } from '../types/auth';
import type { ApiResponse } from '../types/api';
import config from '../config/env';
import { apiClient } from './apiClient';

class AuthService {
  private readonly STORAGE_KEY = 'auth_token';

  async login(credentials: LoginCredentials): Promise<User> {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/login', credentials);
    
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
      return response.data.data.user;
    }
    
    throw new Error(response.data.message || 'Login failed');
  }

  async register(data: RegisterData): Promise<User> {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
    
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
      return response.data.data.user;
    }
    
    throw new Error(response.data.message || 'Registration failed');
  }

  async loginWithLinkedIn(): Promise<void> {
    // Construct LinkedIn OAuth URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.linkedinClientId,
      redirect_uri: config.linkedinRedirectUri,
      scope: 'openid profile email',
      state: this.generateRandomState(),
    });

    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    
    // Store state for verification
    sessionStorage.setItem('linkedin_oauth_state', params.get('state') || '');
    
    // Redirect to LinkedIn
    window.location.href = linkedinAuthUrl;
  }

  async handleLinkedInCallback(code: string, state: string): Promise<User> {
    // Verify state parameter
    const storedState = sessionStorage.getItem('linkedin_oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid OAuth state parameter');
    }

    // Exchange code for access token and user data
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/linkedin/callback', {
      code,
      redirectUri: config.linkedinRedirectUri,
    });

    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
      sessionStorage.removeItem('linkedin_oauth_state');
      return response.data.data.user;
    }

    throw new Error(response.data.message || 'LinkedIn authentication failed');
  }

  async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Failed to get current user');
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      this.removeToken();
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.STORAGE_KEY, token);
  }

  private removeToken(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export const authService = new AuthService(); 
import type { ApiResponse, ApiError } from '../types/api';
import config from '../config/env';

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(config: RequestConfig): Promise<{ data: T }> {
    const { method, url, data, headers = {} } = config;
    
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Set content type for requests with data
    if (data) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          message: errorData.message || response.statusText || 'Request failed',
          status: response.status,
          code: errorData.code,
        };
        throw error;
      }

      const responseData = await response.json();
      return { data: responseData };
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        throw error; // Re-throw API errors
      }
      
      // Handle network errors
      const apiError: ApiError = {
        message: 'Network error occurred',
        status: 0,
      };
      throw apiError;
    }
  }

  async get<T = ApiResponse>(url: string, headers?: Record<string, string>) {
    return this.request<T>({ method: 'GET', url, headers });
  }

  async post<T = ApiResponse>(url: string, data?: unknown, headers?: Record<string, string>) {
    return this.request<T>({ method: 'POST', url, data, headers });
  }

  async put<T = ApiResponse>(url: string, data?: unknown, headers?: Record<string, string>) {
    return this.request<T>({ method: 'PUT', url, data, headers });
  }

  async patch<T = ApiResponse>(url: string, data?: unknown, headers?: Record<string, string>) {
    return this.request<T>({ method: 'PATCH', url, data, headers });
  }

  async delete<T = ApiResponse>(url: string, headers?: Record<string, string>) {
    return this.request<T>({ method: 'DELETE', url, headers });
  }
}

export const apiClient = new ApiClient(config.apiUrl); 
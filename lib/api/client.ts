import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { supabase } from '../supabase';

// Define a custom error type for API errors
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private static instance: ApiClient;
  private client: AxiosInstance;
  private baseURL: string;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  private constructor() {
    // Store the base URL as provided
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || '';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });
    
    // Ensure URLs are properly formed
    this.client.interceptors.request.use(config => {
      // Only modify the URL if it's not an absolute URL and doesn't start with a slash
      if (config.url && !config.url.startsWith('http') && !config.url.startsWith('/')) {
        config.url = config.url.replace(/^\/+/, '');
      }
      return config;
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  private async refreshToken() {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push((token) => {
          resolve(token);
        });
      });
    }

    this.isRefreshing = true;
    
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        throw new ApiError('Failed to refresh session', 401, 'TOKEN_REFRESH_FAILED');
      }
      
      this.isRefreshing = false;
      this.onRefreshed(data.session.access_token);
      return data.session.access_token;
    } catch (error) {
      this.isRefreshing = false;
      this.refreshSubscribers = [];
      throw error;
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return null;
      return data.session?.access_token || null;
    } catch (error) {
      return null;
    }
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        // Skip adding auth header for auth-related endpoints
        if (config.url?.includes('/auth/')) {
          return config;
        }

        try {
          const token = await this.getAuthToken();
          
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          
          return config;
        } catch (error) {
          console.error('[API] Error setting up request:', error);
          throw error;
        }
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        
        // Error handling

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest?._retry) {
          if (originalRequest?.url?.includes('/auth/refresh')) {
            return Promise.reject(new ApiError('Session expired. Please log in again.', 401, 'SESSION_EXPIRED'));
          }

          // Mark request as retried to prevent infinite loops
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            return Promise.reject(new ApiError('Session expired. Please log in again.', 401, 'SESSION_EXPIRED'));
          }
        }

        // Handle other errors
        if (error.response?.data) {
          const { data } = error.response;
          const errorData = data as Record<string, unknown>;
          let errorMessage = 'An unknown error occurred';
          let errorCode = 'API_ERROR';
          
          if (typeof errorData === 'object' && errorData !== null) {
            errorMessage = 
              (typeof errorData.message === 'string' ? errorData.message : '') ||
              (typeof errorData.error === 'string' ? errorData.error : '') ||
              'An unknown error occurred';
              
            if (typeof errorData.code === 'string') {
              errorCode = errorData.code;
            }
          } else {
            errorMessage = String(data);
          }
          
          return Promise.reject(new ApiError(
            errorMessage,
            error.response.status,
            errorCode,
            data
          ));
        }

        return Promise.reject(new ApiError(
          error.message || 'Network error',
          error.response?.status,
          error.code || 'NETWORK_ERROR'
        ));
      }
    );
  }

  // HTTP Methods
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = ApiClient.getInstance();

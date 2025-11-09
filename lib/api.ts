/**
 * API Client for Django REST Framework
 * Handles authentication, CSRF tokens, and session cookies
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiError {
  error?: string;
  message?: string;
  [key: string]: any;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_superuser: boolean;
  };
  session_expiry?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Get CSRF token from Django
   */
  private async getCsrfToken(): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseURL}/api/`, {
        method: 'GET',
        credentials: 'include',
      });
      
      // CSRF token is usually in a cookie, but we can also get it from response headers
      const cookies = document.cookie.split(';');
      const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrftoken='));
      
      if (csrfCookie) {
        return csrfCookie.split('=')[1];
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      return null;
    }
  }

  /**
   * Make an API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get CSRF token for POST, PUT, DELETE, PATCH requests
    let csrfToken: string | null = null;
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || '')) {
      csrfToken = await this.getCsrfToken();
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Important for session cookies
    };

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return {} as T;
      }

      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = data || { error: 'An error occurred' };
        throw error;
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Login endpoint
   */
  async login(loginIdentifier: string, password: string, rememberMe: boolean = false): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/authentication/owner/login/', {
      method: 'POST',
      body: JSON.stringify({
        login_identifier: loginIdentifier,
        password,
        remember_me: rememberMe,
      }),
    });
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<LoginResponse['user'] | null> {
    try {
      const response = await this.request<{ user: LoginResponse['user'] }>('/api/authentication/user/', {
        method: 'GET',
      });
      return response.user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Logout endpoint
   */
  async logout(): Promise<void> {
    try {
      await this.request('/api/authentication/logout/', {
        method: 'POST',
      });
    } catch (error) {
      // Even if logout fails, clear local state
      console.error('Logout error:', error);
    }
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);


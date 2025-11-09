/**
 * API Client for Django REST Framework
 * Handles authentication, CSRF tokens, and session cookies
 */

// Get API URL from environment variable or use default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Log API URL for debugging (in both development and production if needed)
if (typeof window !== 'undefined') {
  if (process.env.NODE_ENV === 'development') {
    console.log('[API Client] Base URL:', API_BASE_URL);
  }
  // In production, log if API URL is still localhost (indicates misconfiguration)
  if (process.env.NODE_ENV === 'production' && API_BASE_URL.includes('localhost')) {
    console.error('[API Client] WARNING: Using localhost URL in production! Check NEXT_PUBLIC_API_URL environment variable.');
  }
}

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
    is_staff: boolean;
  };
  session_expiry?: string;
}

export interface ExpiringAMC {
  client_name: string;
  amc_expiry_date: string; // ISO date string
  expiry_count_days: number;
  amc_number: string;
}

export interface RecentActivity {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  description: string;
  created_at: string; // ISO datetime string
  created_by: number | null;
  created_by_username: string | null;
}

export interface DashboardStatsResponse {
  total_clients: number;
  active_amcs_count: number;
  active_tenders_count: number;
  in_progress_tasks_count: number;
  expiring_amcs: ExpiringAMC[];
  recent_activities: RecentActivity[];
}

// Document Management Interfaces
export interface DocumentTemplateVersion {
  id: number;
  version_number: number;
  file: string; // File path
  file_url: string; // Full URL
  file_type: 'pdf' | 'docx';
  is_published: boolean;
  created_at: string;
  created_by: number | null;
  created_by_username: string | null;
}

export interface DocumentTemplate {
  id: number;
  title: string;
  category: string | null;
  description: string | null;
  firm: number | null;
  firm_name: string | null;
  versions: DocumentTemplateVersion[];
  published_version: DocumentTemplateVersion | null;
  created_at: string;
  created_by: number | null;
  created_by_username: string | null;
}

export interface DocumentTemplateListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DocumentTemplate[];
}

export interface DocumentUploadResponse {
  message: string;
  template: DocumentTemplate;
  version: DocumentTemplateVersion;
}

export interface Firm {
  id: number;
  firm_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface FirmListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Firm[];
}

export interface BulkDownloadRequest {
  version_ids?: number[];
  template_ids?: number[];
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Get CSRF token from cookies
   * Django automatically sets csrftoken cookie on first request
   */
  private getCsrfToken(): string | null {
    if (typeof document === 'undefined') {
      // Server-side rendering - no cookies available
      return null;
    }
    
    try {
      // Get CSRF token from cookies
      const cookies = document.cookie.split(';');
      const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrftoken='));
      
      if (csrfCookie) {
        return decodeURIComponent(csrfCookie.split('=')[1].trim());
      }
      
      return null;
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      return null;
    }
  }
  
  /**
   * Ensure CSRF token is available by making a request if needed
   */
  private async ensureCsrfToken(): Promise<void> {
    if (typeof document === 'undefined') {
      return;
    }
    
    // If we already have a CSRF token, no need to fetch
    if (this.getCsrfToken()) {
      return;
    }
    
    // Try to get CSRF token by making a request to a public endpoint
    // For login, we can skip this as Django will set the token on the first POST
    // But we'll try anyway for better UX
    try {
      // Try swagger endpoint first (usually public)
      const response = await fetch(`${this.baseURL}/swagger/`, {
        method: 'GET',
        credentials: 'include',
        mode: 'cors',
      }).catch(() => {
        // If swagger fails, try API root (might require auth, but that's ok for CSRF)
        return fetch(`${this.baseURL}/api/`, {
          method: 'GET',
          credentials: 'include',
          mode: 'cors',
        }).catch(() => null);
      });
      
      if (response && !response.ok && response.status !== 401 && response.status !== 403) {
        // If we get a non-auth error, the server is reachable but something else is wrong
        console.warn('[API] Server responded but CSRF token might not be set');
      }
    } catch (error) {
      // Ignore errors - Django will set CSRF token on the actual login request
      // This is just a best-effort attempt
      if (process.env.NODE_ENV === 'development') {
        console.debug('[API] CSRF token pre-fetch failed (this is usually ok):', error);
      }
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
    const method = options.method || 'GET';
    
    // Log the request for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${method} ${url}`);
    }
    
    // Ensure CSRF token is available for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      await this.ensureCsrfToken();
    }
    
    // Get CSRF token for POST, PUT, DELETE, PATCH requests
    const csrfToken = this.getCsrfToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      headers['X-CSRFToken'] = csrfToken;
    }

    const config: RequestInit = {
      ...options,
      method,
      headers,
      credentials: 'include', // Important for session cookies
    };

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          // Try to parse as JSON anyway for error messages
          try {
            const errorData = await response.json();
            throw errorData;
          } catch {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }
        return {} as T;
      }

      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = data || { error: 'An error occurred' };
        // If it's a 403, it might be a CSRF issue - try to get a new token
        if (response.status === 403 && method !== 'GET') {
          console.warn('CSRF token might be invalid, retrying...');
        }
        throw error;
      }

      return data;
    } catch (error) {
      // Enhanced error handling
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // Network error - API server might be down or CORS issue
        const networkError: ApiError = {
          error: 'Network Error',
          message: `Unable to connect to the API server. Please check:
1. Is the Django server running at ${this.baseURL}?
2. Are CORS settings correctly configured?
3. Is the API URL correct? (Current: ${this.baseURL})`,
        };
        console.error('[API Error]', networkError.message);
        throw networkError;
      }
      
      if (error instanceof Error) {
        console.error('[API Error]', error.message);
        throw error;
      }
      
      const unknownError: ApiError = {
        error: 'Unknown Error',
        message: 'An unexpected error occurred',
      };
      throw unknownError;
    }
  }

  /**
   * Login endpoint
   * Special handling for login - Django will set CSRF token on first request if needed
   */
  async login(loginIdentifier: string, password: string, rememberMe: boolean = false): Promise<LoginResponse> {
    const url = `${this.baseURL}/api/owner/login/`;
    
    // For login, try to get CSRF token but don't fail if we can't
    // Django will handle CSRF validation and set the token
    let csrfToken = this.getCsrfToken();
    
    // If we don't have CSRF token, try to get it (but don't block)
    if (!csrfToken) {
      try {
        // Make a quick GET request to get CSRF token
        await fetch(`${this.baseURL}/swagger/`, {
          method: 'GET',
          credentials: 'include',
        }).catch(() => {
          // If that fails, try API root
          return fetch(`${this.baseURL}/api/`, {
            method: 'GET',
            credentials: 'include',
          });
        });
        // Try to get token again
        csrfToken = this.getCsrfToken();
      } catch (error) {
        // Ignore - we'll proceed without CSRF token
        // Django might accept the request and set the token
        console.debug('[API] Could not pre-fetch CSRF token for login, proceeding anyway');
      }
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          login_identifier: loginIdentifier,
          password,
          remember_me: rememberMe,
        }),
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        throw new Error('Invalid response from server');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        // If we get a 403, it might be CSRF - but also could be authorization
        if (response.status === 403 && data.error) {
          throw data;
        }
        const error: ApiError = data || { error: 'Login failed' };
        throw error;
      }
      
      return data;
    } catch (error: any) {
      // Enhanced error handling for network issues
      if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message?.includes('fetch'))) {
        // Get hostname safely
        let hostname = 'unknown';
        try {
          hostname = new URL(this.baseURL).hostname;
        } catch (e) {
          // Invalid URL, use baseURL as-is
          hostname = this.baseURL;
        }
        
        // Get current origin for CORS check
        const frontendOrigin = typeof window !== 'undefined' ? window.location.origin : 'your frontend domain';
        
        const networkError: ApiError = {
          error: 'Network Error',
          message: `Cannot connect to API server at ${this.baseURL}.\n\nPossible causes:
- Backend server is not running or not accessible
- DNS cannot resolve the domain: ${hostname}
- SSL/TLS certificate issue (check if backend has valid SSL certificate)
- Firewall or network blocking the connection
- Backend is on a different port or path
- CORS preflight request is failing

Please verify:
1. Backend server is running and accessible
2. Backend URL is correct: ${this.baseURL}
3. DNS resolves correctly (try: ping ${hostname} or curl ${this.baseURL}/api/)
4. Backend has valid SSL certificate (for HTTPS)
5. CORS settings in backend .env include: ${frontendOrigin}
6. For production: NEXT_PUBLIC_API_URL is set in Vercel environment variables`,
        };
        throw networkError;
      }
      
      // Handle other fetch errors
      if (error instanceof Error) {
        throw error;
      }
      
      throw error;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<LoginResponse['user'] | null> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[API] Getting current user from:', `${this.baseURL}/api/user/`);
      }
      const response = await this.request<{ user: LoginResponse['user'] }>('/api/user/', {
        method: 'GET',
      });
      if (process.env.NODE_ENV === 'development') {
        console.log('[API] Current user response:', response);
      }
      return response.user;
    } catch (error: any) {
      // If it's a 403, user is not authorized (not staff/superuser)
      // If it's a 401, user is not authenticated
      // In both cases, return null
      if (process.env.NODE_ENV === 'development') {
        console.error('[API] getCurrentUser error:', error);
        if (error?.status) {
          console.error('[API] Response status:', error.status);
        }
        if (error?.error || error?.message) {
          console.error('[API] Error message:', error.error || error.message);
        }
      }
      return null;
    }
  }

  /**
   * Logout endpoint
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint to clear server-side session
      await this.request('/api/logout/', {
        method: 'POST',
      });
      
      // Clear CSRF token from cookies
      if (typeof document !== 'undefined') {
        // Clear CSRF token cookie
        document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        // Clear session cookie (if any)
        document.cookie = 'sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    } catch (error) {
      // Even if logout fails, clear local state and cookies
      console.error('Logout error:', error);
      
      // Clear cookies even if request failed
      if (typeof document !== 'undefined') {
        document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    return this.request<DashboardStatsResponse>('/api/dashboard/all-stats/', {
      method: 'GET',
    });
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

  /**
   * Document Management APIs
   */

  /**
   * Get all document templates with optional filters
   */
  async getDocumentTemplates(params?: {
    category?: string;
    firm?: number;
    search?: string;
    page?: number;
  }): Promise<DocumentTemplateListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.firm) queryParams.append('firm', params.firm.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/documents/templates/${queryString ? `?${queryString}` : ''}`;
    
    return this.request<DocumentTemplateListResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get a specific document template by ID
   */
  async getDocumentTemplate(id: number): Promise<DocumentTemplate> {
    return this.request<DocumentTemplate>(`/api/documents/templates/${id}/`, {
      method: 'GET',
    });
  }

  /**
   * Upload a new document template
   */
  async uploadDocumentTemplate(data: {
    title: string;
    category?: string;
    firm?: number;
    upload_file: File;
    notes?: string;
  }): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.category) formData.append('category', data.category);
    if (data.firm) formData.append('firm', data.firm.toString());
    formData.append('upload_file', data.upload_file);
    if (data.notes) formData.append('notes', data.notes);

    // Get CSRF token
    const csrfToken = this.getCsrfToken();
    
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    const response = await fetch(`${this.baseURL}/api/documents/templates/upload-template/`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw error;
    }

    return response.json();
  }

  /**
   * Delete a document template
   */
  async deleteDocumentTemplate(id: number): Promise<void> {
    await this.request(`/api/documents/templates/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Download published version of a template
   */
  async downloadPublishedVersion(templateId: number): Promise<Blob> {
    const response = await fetch(
      `${this.baseURL}/api/documents/templates/${templateId}/download-published/`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }));
      throw error;
    }

    return response.blob();
  }

  /**
   * Download a specific version by version ID
   */
  async downloadVersion(versionId: number): Promise<Blob> {
    const response = await fetch(
      `${this.baseURL}/api/documents/templates/download-version/?version_id=${versionId}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }));
      throw error;
    }

    return response.blob();
  }

  /**
   * Bulk download documents
   */
  async bulkDownloadDocuments(data: BulkDownloadRequest): Promise<Blob> {
    const csrfToken = this.getCsrfToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    const response = await fetch(`${this.baseURL}/api/documents/templates/bulk-download/`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Bulk download failed' }));
      throw error;
    }

    return response.blob();
  }

  /**
   * Get all firms (for document template firm selection)
   */
  async getFirms(params?: {
    search?: string;
    page?: number;
  }): Promise<FirmListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/firms/${queryString ? `?${queryString}` : ''}`;
    
    return this.request<FirmListResponse>(endpoint, {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

/**
 * Test API connection
 * Useful for debugging connection issues
 */
export async function testApiConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/swagger/`, {
      method: 'GET',
      credentials: 'include',
      mode: 'cors',
    });
    return { connected: response.ok || response.status < 500 };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message || 'Cannot connect to API server',
    };
  }
}


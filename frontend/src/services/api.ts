import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiError extends Error {
  public status: number;
  public data: any;
  
  constructor(status: number, data: any, message: string = 'API Error') {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/**
 * Core API Client that automatically handles JWT injection and error wrapping.
 */
export const apiClient = {
  async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };
    }
    return { 'Content-Type': 'application/json' };
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = await this.getAuthHeaders();
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Attempt to parse JSON response
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const detail = typeof data === 'object' && data?.detail ? String(data.detail) : `Request failed (${response.status})`;
        throw new ApiError(response.status, data, detail);
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        // Here we could centralize 401 handling, dispatch events, etc.
        if (error.status === 401) {
          console.warn('Unauthorized request - session may have expired.');
        }
        throw error;
      }
      
      console.error('Network Error:', error);
      throw error;
    }
  },

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body: any, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
  },
  
  patch<T>(endpoint: string, body: any, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
  },

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  /**
   * Upload method specifically for FormData (e.g. file uploads).
   * It prevents setting Content-Type so the browser sets the correct multipart boundary.
   */
  async upload<T>(endpoint: string, formData: FormData, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get headers but strip Content-Type
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    const config: RequestInit = {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        ...headers,
        ...(options?.headers || {}),
      },
    };

    try {
      const response = await fetch(url, config);
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const detail = typeof data === 'object' && data?.detail ? String(data.detail) : `Request failed (${response.status})`;
        throw new ApiError(response.status, data, detail);
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        console.warn('Unauthorized request - session may have expired.');
      }
      throw error;
    }
  }
};

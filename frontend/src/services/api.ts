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

async function authHeaders(): Promise<HeadersInit> {
  let { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    const refreshed = await supabase.auth.refreshSession();
    session = refreshed.data.session;
  }
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

async function performRequest<T>(url: string, options: RequestInit): Promise<{ response: Response; data: T }> {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type');
  const data = (contentType?.includes('application/json') ? await response.json() : await response.text()) as T;
  return { response, data };
}

export const apiClient = {
  async getAuthHeaders(): Promise<HeadersInit> {
    return authHeaders();
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    let headers = await authHeaders();
    let config: RequestInit = { ...options, headers: { ...headers, ...options.headers } };

    try {
      let { response, data } = await performRequest<T>(url, config);

      // Recover once from an expired JWT without forcing the user back to login.
      if (response.status === 401) {
        const refreshed = await supabase.auth.refreshSession();
        if (refreshed.data.session?.access_token) {
          headers = {
            ...headers,
            Authorization: `Bearer ${refreshed.data.session.access_token}`,
          };
          config = { ...config, headers: { ...headers, ...options.headers } };
          ({ response, data } = await performRequest<T>(url, config));
        }
      }

      if (!response.ok) {
        const detail = typeof data === 'object' && data && 'detail' in data
          ? String((data as any).detail)
          : `Request failed (${response.status})`;
        throw new ApiError(response.status, data, detail);
      }
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
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

  async upload<T>(endpoint: string, formData: FormData, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};

    let response = await fetch(url, {
      ...options,
      method: 'POST',
      body: formData,
      headers: { ...headers, ...(options?.headers || {}) },
    });

    if (response.status === 401) {
      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.data.session?.access_token) {
        response = await fetch(url, {
          ...options,
          method: 'POST',
          body: formData,
          headers: { Authorization: `Bearer ${refreshed.data.session.access_token}`, ...(options?.headers || {}) },
        });
      }
    }

    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) {
      const detail = typeof data === 'object' && data?.detail ? String(data.detail) : `Request failed (${response.status})`;
      throw new ApiError(response.status, data, detail);
    }
    return data as T;
  },
};

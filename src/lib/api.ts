'use client';

import { useState, useCallback } from 'react';

interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

interface ApiResponse<T = unknown> {
  data: T;
  error?: ApiError;
}

const createApi = () => ({
  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      // Add authentication header if token exists
      const token = localStorage.getItem('token');
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }

      // Add default headers
      options.headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Use relative path for Next.js API routes
      // Remove any leading slashes from endpoint to prevent double slashes
      const cleanEndpoint = endpoint.replace(/^\/+/, '');
      const response = await fetch(`/${cleanEndpoint}`, options);

      // Handle non-200 responses
      if (!response.ok) {
        const error: ApiError = new Error(response.statusText);
        error.status = response.status;
        try {
          error.data = await response.json();
        } catch {
          error.data = await response.text();
        }
        throw error;
      }

      // Return JSON response
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        // Handle token expiration
        if ((error as ApiError).status === 401) {
          localStorage.removeItem('token');
          // You might want to redirect to login page here
          window.location.href = '/login';
        }
        return { data: null as T, error: error as ApiError };
      }
      return { data: null as T, error: new Error('An unknown error occurred') };
    }
  },

  // Helper methods for common HTTP methods
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' });
  },

  async post<T>(endpoint: string, data: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async put<T>(endpoint: string, data: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
  },
});

export type Api = ReturnType<typeof createApi>;

export const api = createApi();

export const useApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const wrappedApi = useCallback(() => {
    const instance = createApi();

    const wrapMethod = async <T,>(
      method: keyof Api,
      ...args: Parameters<Api[typeof method]>
    ): Promise<ApiResponse<T>> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await (instance[method] as (...args: unknown[]) => Promise<ApiResponse<T>>)(...args);
        if (result.error) {
          setError(result.error);
        }
        return result;
      } finally {
        setIsLoading(false);
      }
    };

    return {
      get: <T,>(...args: Parameters<Api['get']>) => wrapMethod<T>('get', ...args) as Promise<ApiResponse<T>>,
      post: <T,>(...args: Parameters<Api['post']>) => wrapMethod<T>('post', ...args) as Promise<ApiResponse<T>>,
      put: <T,>(...args: Parameters<Api['put']>) => wrapMethod<T>('put', ...args) as Promise<ApiResponse<T>>,
      delete: <T,>(...args: Parameters<Api['delete']>) => wrapMethod<T>('delete', ...args) as Promise<ApiResponse<T>>,
      isLoading,
      error,
    };
  }, []);

  return wrappedApi();
};

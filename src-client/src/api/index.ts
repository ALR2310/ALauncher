import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

type Params = Record<string, any>;

export interface ApiError {
  message: string;
  error: string;
  status: number;
}

function stringifyParams(params: Params): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
      });
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }

  return parts.join('&');
}

export class APIService {
  private instance: AxiosInstance;

  constructor(baseUrl: string) {
    this.instance = axios.create({
      baseURL: baseUrl || '',
      responseType: 'json',
      headers: { 'Content-Type': 'application/json' },
    });

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response.data,
      (error: AxiosError) => {
        const data = error.response?.data;
        if (data && typeof data === 'object') {
          return Promise.reject(data as ApiError);
        }
        return Promise.reject({
          message: error.message || 'Unknown error',
          error: 'NetworkError',
          status: 0,
        } as ApiError);
      },
    );
  }

  getInstance(): AxiosInstance {
    return this.instance;
  }

  async get<T>(url: string, params?: Params): Promise<T> {
    const query = params ? stringifyParams(params) : '';
    const path = query ? `${url}?${query}` : url;
    return this.instance.get<T, T>(path);
  }

  async post<T, D = any>(url: string, body?: D, params?: Params): Promise<T> {
    const query = params ? stringifyParams(params) : '';
    const path = query ? `${url}?${query}` : url;
    return this.instance.post<T, T, D>(path, body);
  }

  async put<T, D = any>(url: string, body?: D, params?: Params): Promise<T> {
    const query = params ? stringifyParams(params) : '';
    const path = query ? `${url}?${query}` : url;
    return this.instance.put<T, T, D>(path, body);
  }

  async patch<T, D = any>(url: string, body?: D, params?: Params): Promise<T> {
    const query = params ? stringifyParams(params) : '';
    const path = query ? `${url}?${query}` : url;
    return this.instance.patch<T, T, D>(path, body);
  }

  async delete<T>(url: string, params?: Params): Promise<T> {
    const query = params ? stringifyParams(params) : '';
    const path = query ? `${url}?${query}` : url;
    return this.instance.delete<T, T>(path);
  }
}

export const API_URL = `http://localhost:${import.meta.env.VITE_PORT ?? 1421}/api`;
export const API = new APIService(API_URL);
export * from './app.api';
export * from './category.api';
export * from './content.api';
export * from './instance.api';
export * from './version.api';

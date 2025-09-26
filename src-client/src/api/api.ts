import axios, { AxiosInstance, AxiosResponse } from 'axios';
import qs from 'qs';

type Params = Record<string, any>;

const responseBody = (response: AxiosResponse) => response.data;

export class APIService {
  private instance: AxiosInstance;

  constructor(baseUrl: string) {
    this.instance = axios.create({
      baseURL: baseUrl || '',
      responseType: 'json',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  getInstance(): AxiosInstance {
    return this.instance;
  }

  async get<T>(url: string, params?: Params): Promise<T> {
    const query = qs.stringify(params, { arrayFormat: 'repeat' });
    const path = query ? `${url}?${query}` : url;
    return this.instance.get<T>(path).then(responseBody);
  }

  async post<T>(url: string, body?: any, params?: Params): Promise<T> {
    const query = qs.stringify(params, { arrayFormat: 'repeat' });
    const path = query ? `${url}?${query}` : url;
    return this.instance.post<T>(path, body).then(responseBody);
  }

  async put<T>(url: string, body?: any, params?: Params): Promise<T> {
    const query = qs.stringify(params, { arrayFormat: 'repeat' });
    const path = query ? `${url}?${query}` : url;
    return this.instance.put<T>(path, body).then(responseBody);
  }

  async patch<T>(url: string, body?: any, params?: Params): Promise<T> {
    const query = qs.stringify(params, { arrayFormat: 'repeat' });
    const path = query ? `${url}?${query}` : url;
    return this.instance.patch<T>(path, body).then(responseBody);
  }

  async delete<T>(url: string, params?: Params): Promise<T> {
    const query = qs.stringify(params, { arrayFormat: 'repeat' });
    const path = query ? `${url}?${query}` : url;
    return this.instance.delete<T>(path).then(responseBody);
  }
}

export const API_URL = `http://localhost:${import.meta.env.VITE_SERVER_PORT ?? 1421}/api`;
export const API = new APIService(API_URL);

import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

type Query = Record<string, any>;

export interface APIError {
  message: string;
  error: string;
  status: number;
}

function stringifyQuery(query: Query): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(query)) {
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

export class FetchEventSource {
  private controller = new AbortController();
  private emitter = new EventTarget();

  onmessage?: (e: MessageEvent) => void;
  onerror?: (e: MessageEvent) => void;
  onopen?: (e: MessageEvent) => void;

  constructor(
    private url: string,
    private options?: RequestInit,
  ) {
    this.start();
  }

  private async start() {
    try {
      const res = await fetch(this.url, {
        ...this.options,
        signal: this.controller.signal,
        headers: { Accept: 'text/event-stream', ...(this.options?.headers || {}) },
      });
      if (!res.ok || !res.body) throw new Error(`SSE failed: ${res.status} ${res.statusText}`);

      const openEvt = new MessageEvent('open');
      this.emitter.dispatchEvent(openEvt);
      this.onopen?.(openEvt);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        try {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          buffer = this.parseBuffer(buffer);
          if (buffer.length > 10_000) buffer = buffer.slice(-5_000);
        } catch (e) {
          if ((e as any)?.name === 'AbortError') break;
          const errEvt = new MessageEvent('error', { data: String(e) });
          this.emitter.dispatchEvent(errEvt);
          this.onerror?.(errEvt);
          break;
        }
      }
    } catch (e) {
      const errEvt = new MessageEvent('error', { data: String(e) });
      this.emitter.dispatchEvent(errEvt);
      this.onerror?.(errEvt);
    }
  }

  private parseBuffer(buffer: string): string {
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 2);
      if (!raw) continue;

      const lines = raw.split('\n');
      let type = 'message';
      let data = '';

      for (const line of lines) {
        if (line.startsWith('event:')) type = line.slice(6).trim();
        else if (line.startsWith('data:')) data += (data ? '\n' : '') + line.slice(5).trim();
      }

      const evt = new MessageEvent(type, { data });
      this.emitter.dispatchEvent(evt);
      if (type === 'message') this.onmessage?.(evt);
    }
    return buffer;
  }

  addEventListener(event: string, listener: (e: MessageEvent) => void) {
    this.emitter.addEventListener(event, listener as EventListener);
  }

  removeEventListener(event: string, listener: (e: MessageEvent) => void) {
    this.emitter.removeEventListener(event, listener as EventListener);
  }

  close() {
    this.controller.abort();
  }
}

export class APIService {
  private baseUrl: string;
  private instance: AxiosInstance;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
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
          return Promise.reject(data as APIError);
        }
        return Promise.reject({
          message: error.message || 'Unknown error',
          error: 'NetworkError',
          status: 0,
        } as APIError);
      },
    );
  }

  getInstance(): AxiosInstance {
    return this.instance;
  }

  async get<T>(url: string, query?: Query): Promise<T> {
    const qs = query ? stringifyQuery(query) : '';
    const path = qs ? `${url}?${qs}` : url;
    return this.instance.get<T, T>(path);
  }

  async post<T, D = any>(url: string, body?: D, query?: Query): Promise<T> {
    const qs = query ? stringifyQuery(query) : '';
    const path = qs ? `${url}?${qs}` : url;
    return this.instance.post<T, T, D>(path, body);
  }

  async put<T, D = any>(url: string, body?: D, query?: Query): Promise<T> {
    const qs = query ? stringifyQuery(query) : '';
    const path = qs ? `${url}?${qs}` : url;
    return this.instance.put<T, T, D>(path, body);
  }

  async patch<T, D = any>(url: string, body?: D, query?: Query): Promise<T> {
    const qs = query ? stringifyQuery(query) : '';
    const path = qs ? `${url}?${qs}` : url;
    return this.instance.patch<T, T, D>(path, body);
  }

  async delete<T>(url: string, query?: Query): Promise<T> {
    const qs = query ? stringifyQuery(query) : '';
    const path = qs ? `${url}?${qs}` : url;
    return this.instance.delete<T, T>(path);
  }

  getSSE(url: string, query?: Query): FetchEventSource {
    const qs = query ? stringifyQuery(query) : '';
    const path = qs ? `${this.baseUrl}/${url}?${qs}` : `${this.baseUrl}/${url}`;
    return new FetchEventSource(path);
  }

  postSSE(url: string, body?: any, query?: Query): FetchEventSource {
    const qs = query ? stringifyQuery(query) : '';
    const path = qs ? `${this.baseUrl}/${url}?${qs}` : `${this.baseUrl}/${url}`;
    return new FetchEventSource(path, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  putSSE(url: string, body?: any, query?: Query): FetchEventSource {
    const qs = query ? stringifyQuery(query) : '';
    const path = qs ? `${this.baseUrl}/${url}?${qs}` : `${this.baseUrl}/${url}`;
    return new FetchEventSource(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  patchSSE(url: string, body?: any, query?: Query): FetchEventSource {
    const qs = query ? stringifyQuery(query) : '';
    const path = qs ? `${this.baseUrl}/${url}?${qs}` : `${this.baseUrl}/${url}`;
    return new FetchEventSource(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  deleteSSE(url: string, query?: Query): FetchEventSource {
    const qs = query ? stringifyQuery(query) : '';
    const path = qs ? `${this.baseUrl}/${url}?${qs}` : `${this.baseUrl}/${url}`;
    return new FetchEventSource(path, {
      method: 'DELETE',
    });
  }
}

export const API_URL = `http://localhost:${import.meta.env.VITE_PORT ?? 1421}/api`;
export const API = new APIService(API_URL);
export * from './app.api';
export * from './category.api';
export * from './content.api';
export * from './instance.api';
export * from './version.api';

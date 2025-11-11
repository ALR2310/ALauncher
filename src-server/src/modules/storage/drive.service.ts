import axios from 'axios';
import FormData from 'form-data';
import { PassThrough, Readable } from 'stream';

import { BadRequestException } from '~/common/filters/exception.filter';

interface UploadOptions {
  data: Buffer | Readable;
  fileName: string;
  mimeType?: string;
  parents?: string[];
  properties?: Record<string, any>;
  appProperties?: Record<string, any>;
}

export interface FileResponse {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  modifiedTime: string;
  [key: string]: any;
}

interface ListOptions<F extends string = string> {
  q?: string;
  fields?: F[];
  spaces?: 'drive' | 'appDataFolder';
  orderBy?: string;
  pageSize?: number;
  pageToken?: string;
}

const defaultFields = ['id', 'name', 'size', 'mimeType', 'modifiedTime'];

export const googleDriveService = new (class GoogleDriveService {
  private readonly API_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
  private readonly API_URL = 'https://www.googleapis.com/drive/v3';
  private readonly TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry - 60_000) {
      return this.accessToken;
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', process.env.GOOGLE_CLIENT_ID!);
    params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET!);
    params.append('refresh_token', process.env.GOOGLE_REFRESH_TOKEN!);

    const { data } = await axios.post(this.TOKEN_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    return this.accessToken!;
  }

  async upload(options: UploadOptions): Promise<string> {
    const { data, fileName, mimeType, parents = [], properties, appProperties } = options;

    const token = await this.getToken();

    const metadata = {
      name: fileName,
      ...(parents.length > 0 ? { parents } : {}),
      ...(properties ? { properties } : {}),
      ...(appProperties ? { appProperties } : {}),
    };

    const form = new FormData();
    form.append('metadata', JSON.stringify(metadata), { contentType: 'application/json' });

    const pass = new PassThrough();

    if (Buffer.isBuffer(data)) {
      pass.end(data);
    } else {
      data.pipe(pass);
    }

    form.append('file', pass, {
      filename: fileName,
      contentType: mimeType ?? 'application/octet-stream',
    });

    const response = await axios.post(`${this.API_UPLOAD_URL}?uploadType=multipart`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.id;
  }

  async download(fileId: string): Promise<Readable> {
    const token = await this.getToken();

    const response = await axios.get(`${this.API_URL}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'stream',
    });

    const pass = new PassThrough();
    response.data.pipe(pass);

    return pass;
  }

  async delete(fileId: string): Promise<boolean> {
    try {
      const token = await this.getToken();

      await axios.delete(`${this.API_URL}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async get(fileId: string, fields?: string[]): Promise<FileResponse> {
    const fieldsQuery = Array.from(new Set([...defaultFields, ...(fields ?? [])])).join(',');
    const token = await this.getToken();

    const { data } = await axios.get(`${this.API_URL}/files/${fileId}?fields=${fieldsQuery}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return data;
  }

  async list<F extends string = never>(options: ListOptions<F>): Promise<Array<FileResponse & Record<F, any>>> {
    const { q, fields, spaces = 'drive', orderBy, pageSize = 100, pageToken } = options;
    try {
      const token = await this.getToken();

      const fieldsQuery = Array.from(new Set([...defaultFields, ...(fields ?? [])])).join(',');

      const params = new URLSearchParams();
      if (q) params.append('q', q);
      if (orderBy) params.append('orderBy', orderBy);
      if (pageToken) params.append('pageToken', pageToken);
      params.append('spaces', spaces);
      params.append('pageSize', pageSize.toString());
      params.append('fields', `files(${fieldsQuery})`);

      const { data } = await axios.get(`${this.API_URL}/files?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return data.files;
    } catch (err: any) {
      console.dir(err.response?.data || err.message, { depth: null });
      throw new BadRequestException(err.message);
    }
  }
})();

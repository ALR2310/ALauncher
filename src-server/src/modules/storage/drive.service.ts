import axios from 'redaxios';
import { PassThrough, Readable } from 'stream';

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

    try {
      const { data } = await axios.post(this.TOKEN_URL, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;

      return this.accessToken!;
    } catch (err: any) {
      console.log(err);
      throw new Error('Failed to obtain access token from Google OAuth2');
    }
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
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));

    const pass = new PassThrough();
    if (Buffer.isBuffer(data)) pass.end(data);
    else data.pipe(pass);

    form.append(
      'file',
      new Blob([await this.streamToBuffer(pass)], { type: mimeType ?? 'application/octet-stream' }),
      fileName,
    );

    const res = await fetch(`${this.API_UPLOAD_URL}?uploadType=multipart`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (!res.ok) throw await res.json();
    const json = await res.json();
    return json.id;
  }

  async download(fileId: string): Promise<Readable> {
    const token = await this.getToken();

    try {
      const res = await fetch(`${this.API_URL}/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
      if (!res.body) throw new Error('No body received');

      const nodeStream = Readable.fromWeb(res.body as any);

      const pass = new PassThrough();
      nodeStream.pipe(pass);
      return pass;
    } catch (err: any) {
      throw err.response?.data.error || err;
    }
  }

  async delete(fileId: string): Promise<void> {
    try {
      const token = await this.getToken();

      await axios.delete(`${this.API_URL}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err: any) {
      throw err.response?.data.error || err;
    }
  }

  async get(fileId: string, fields?: string[]): Promise<FileResponse> {
    const fieldsQuery = Array.from(new Set([...defaultFields, ...(fields ?? [])])).join(',');
    const token = await this.getToken();

    try {
      const { data } = await axios.get(`${this.API_URL}/files/${fileId}?fields=${fieldsQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return data;
    } catch (err: any) {
      throw err.response?.data.error || err;
    }
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
      throw err.response?.data.error || err.data.error || err;
    }
  }

  private async streamToBuffer(stream: NodeJS.ReadableStream) {
    const chunks: any[] = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
  }
})();

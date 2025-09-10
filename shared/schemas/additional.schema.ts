import { z } from 'zod';

export const contentSchema = z.object({
  id: z.number(),
  name: z.string(),
  author: z.string(),
  logoUrl: z.url(),
  fileId: z.number(),
  fileName: z.string(),
  fileUrl: z.url(),
  fileSize: z.number(),
  enabled: z.boolean(),
  dependencies: z.array(z.number()).optional(),
});
export type Content = z.infer<typeof contentSchema>;

export const contentQuerySchema = z.object({
  instanceId: z.string().optional(),
  gameId: z.coerce.number().optional(),
  classId: z.coerce.number().optional(),
  categoryIds: z.string().optional(),
  gameVersion: z.string().optional(),
  searchFilter: z.string().optional(),
  sortField: z.coerce.number().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  modLoaderType: z.coerce.number().optional(),
  slug: z.string().optional(),
  index: z.coerce.number().min(0).optional(),
  pageSize: z.coerce.number().max(100).optional(),
});
export type ContentQuery = z.infer<typeof contentQuerySchema>;
export interface ContentResponse {
  data: Array<{
    id: number;
    name: string;
    slug: string;
    link: string;
    summary: string;
    downloadCount: number;
    fileSize: string;
    authors: Array<{
      id: number;
      name: string;
      url: string;
      avatarUrl: string;
    }>;
    logoUrl: string;
    categories: Array<{
      id: number;
      name: string;
      slug: string;
      url: string;
    }>;
    status?: 'not_installed' | 'outdated' | 'latest';
    dateCreated: string;
    dateModified: string;
    dateReleased: string;
    latestFilesIndexes: Array<{
      gameVersion: string;
      fileId: number;
      filename: string;
      releaseType: number;
      gameVersionTypeId: number;
      modLoader: number;
    }>;
  }>;
  pagination: {
    index: number;
    pageSize: number;
    resultCount: number;
    totalCount: number;
  };
}

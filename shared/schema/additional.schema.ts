import { z } from 'zod';

export const getAdditionalSchema = z.object({
  instanceId: z.string().optional(),
  gameId: z
    .string()
    .transform((v) => Number(v))
    .optional(),
  classId: z.string().optional(),
  categoryIds: z.string().optional(),
  gameVersion: z.string().optional(),
  searchFilter: z.string().optional(),
  sortField: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  modLoaderType: z.string().optional(),
  slug: z.string().min(2).max(100).optional(),
  index: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => v >= 0, { message: 'index must be >= 0' })
    .optional(),

  pageSize: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => v <= 100, { message: 'pageSize must be <= 100' })
    .optional(),
});
export type GetAdditionalPayload = z.infer<typeof getAdditionalSchema>;
export interface GetAdditionalResponse {
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

export const downloadAdditionalSchema = z.object({
  id: z.string().transform((v) => Number(v)),
  instanceId: z.string().optional(),
  type: z.enum(['mods', 'resourcepacks', 'shaderpacks']).default('mods'),
});
export type DownloadAdditionalPayload = z.infer<typeof downloadAdditionalSchema>;

export const removeAdditionalSchema = downloadAdditionalSchema;
export type RemoveAdditionalPayload = z.infer<typeof removeAdditionalSchema>;
export interface RemoveAdditionalResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    fileName: string;
  };
}

export const canRemoveAdditionalSchema = downloadAdditionalSchema.omit({ type: true });
export type CanRemoveAdditionalPayload = z.infer<typeof canRemoveAdditionalSchema>;
export interface CanRemoveAdditionalResponse {
  canRemove: boolean;
  message: string;
  dependents?: string[];
}

export const toggleAdditionalSchema = z.object({
  ids: z.array(z.number()),
  instanceId: z.string().optional(),
  enabled: z.boolean().optional(),
});
export type ToggleAdditionalPayload = z.infer<typeof toggleAdditionalSchema>;

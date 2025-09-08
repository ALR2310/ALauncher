import { z } from 'zod';

export const additionalQuerySchema = z.object({
  classId: z.string().optional(),
  categoryIds: z.string().optional(),
  gameVersion: z.string().optional(),
  searchFilter: z.string().optional(),
  sortField: z.string().optional(),
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
export type AdditionalQuery = z.infer<typeof additionalQuerySchema>;

export const downloadAdditionalSchema = z.object({
  id: z.string().transform((v) => Number(v)),
  instanceId: z.string().optional(),
  type: z.enum(['mods', 'resourcepacks', 'shaderpacks']).default('mods'),
});
export type DownloadAdditionalPayload = z.infer<typeof downloadAdditionalSchema>;

export const toggleAdditionalSchema = z.object({
  ids: z.array(z.number()),
  instanceId: z.string().optional(),
  enabled: z.boolean().optional(),
});
export type ToggleAdditionalPayload = z.infer<typeof toggleAdditionalSchema>;

export interface AdditionalResponse {
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
    dateCreated: string;
    dateModified: string;
    dateReleased: string;
  }>;
  pagination: {
    index: number;
    pageSize: number;
    resultCount: number;
    totalCount: number;
  };
}

import { z } from 'zod';

import { createZodDto } from '../utils/zod.dto';

export const contentSchema = z.object({
  id: z.number(),
  name: z.string(),
  fileId: z.number(),
  fileName: z.string(),
  fileUrl: z.url(),
  fileSize: z.number(),
  enabled: z.boolean(),
  dependencies: z.array(z.number()).optional(),
});

const contentQuerySchema = z.object({
  ids: z.string().optional(),
  instanceId: z.string().optional(),
  gameId: z.coerce.number().optional(),
  classId: z.coerce.number().optional(),
  categoryIds: z.string().optional(),
  gameVersion: z.string().optional(),
  searchFilter: z.string().optional(),
  sortField: z.coerce.number().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
  modLoaderType: z.coerce.number().optional(),
  slug: z.string().optional(),
  index: z.coerce.number().min(0).optional(),
  pageSize: z.coerce.number().max(100).optional(),
});

const contentResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
      link: z.url(),
      summary: z.string(),
      downloadCount: z.number(),
      fileSize: z.string(),
      fileName: z.string().optional(),
      authors: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          url: z.url(),
          avatarUrl: z.url(),
        }),
      ),
      logoUrl: z.url(),
      categories: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          slug: z.string(),
          url: z.url(),
        }),
      ),
      status: z.enum(['not_installed', 'outdated', 'latest']).optional(),
      enabled: z.boolean().optional(),
      dateCreated: z.string(),
      dateModified: z.string(),
      dateReleased: z.string(),
      latestFilesIndexes: z.array(
        z.object({
          gameVersion: z.string(),
          fileId: z.number(),
          filename: z.string(),
          releaseType: z.number(),
          gameVersionTypeId: z.number(),
          modLoader: z.number(),
        }),
      ),
    }),
  ),
  pagination: z.object({
    index: z.number(),
    pageSize: z.number(),
    resultCount: z.number(),
    totalCount: z.number(),
  }),
});

const detailContentQuerySchema = z.object({
  slug: z.string(),
  instance: z.string().optional(),
});

const detailContentResponseSchema = z.object({
  screenshots: z.array(
    z.object({
      title: z.string(),
      thumbnailUrl: z.url(),
      url: z.url(),
    }),
  ),
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  links: z.object({
    websiteUrl: z.url(),
    wikiUrl: z.url(),
    issuesUrl: z.url(),
    sourceUrl: z.url(),
  }),
  summary: z.string(),
  description: z.string().nullish(),
  downloadCount: z.number(),
  categories: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
      url: z.url(),
      iconUrl: z.url(),
    }),
  ),
  classId: z.number(),
  authors: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      url: z.url(),
      avatarUrl: z.url(),
    }),
  ),
  logo: z.object({
    title: z.string(),
    thumbnailUrl: z.string(),
    url: z.string(),
  }),
  gameVersions: z.array(z.string()),
  loaderTypes: z.array(z.string()),
  dateCreated: z.string(),
  dateModified: z.string(),
  dateReleased: z.string(),
});

export class ContentDto extends createZodDto(contentSchema) {}
export class ContentQueryDto extends createZodDto(contentQuerySchema) {}
export class ContentResponseDto extends createZodDto(contentResponseSchema) {}
export class DetailContentQueryDto extends createZodDto(detailContentQuerySchema) {}
export class DetailContentResponseDto extends createZodDto(detailContentResponseSchema) {}

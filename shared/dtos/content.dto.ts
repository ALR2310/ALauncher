import { CurseForgeFileReleaseType, CurseForgeModLoaderType } from 'curseforge-api';
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
    issuesUrl: z.url().nullish(),
    sourceUrl: z.url().nullish(),
  }),
  summary: z.string(),
  description: z.string().nullish(),
  downloadCount: z.number(),
  fileSize: z.string(),
  categories: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
      url: z.url(),
      iconUrl: z.url(),
    }),
  ),
  classId: z.number().nullable(),
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
  dateCreated: z.date(),
  dateModified: z.date(),
  dateReleased: z.date(),
  latestFilesIndexes: z
    .array(
      z.object({
        gameVersion: z.string(),
        fileId: z.number(),
        filename: z.string(),
        releaseType: z.enum(CurseForgeFileReleaseType),
        gameVersionTypeId: z.number().nullish(),
        modLoader: z.enum(CurseForgeModLoaderType),
      }),
    )
    .nullish(),
  instance: z
    .object({
      status: z.string(),
      enabled: z.boolean(),
      fileName: z.string().nullable(),
    })
    .nullish(),
});

const contentQuerySchema = z.object({
  ids: z.string().optional(),
  instance: z.string().optional(),
  // For curseforge search mods
  classId: z.coerce.number().optional(),
  categoryId: z.coerce.number().optional(),
  categoryIds: z.string().optional(),
  gameVersion: z.string().optional(),
  gameVersions: z.string().optional(),
  searchFilter: z.string().optional(),
  sortField: z.coerce.number().optional(),
  sortOrder: z.string().optional(),
  modLoaderType: z.coerce.number().optional(),
  modLoaderTypes: z.string().optional(),
  gameVersionTypeId: z.coerce.number().optional(),
  authorId: z.coerce.number().optional(),
  primaryAuthorId: z.coerce.number().optional(),
  slug: z.string().optional(),
  index: z.coerce.number().min(0).optional(),
  pageSize: z.coerce.number().max(100).optional(),
});

const contentResponseSchema = z.object({
  data: z.array(detailContentResponseSchema),
  pagination: z.object({
    index: z.number(),
    pageSize: z.number(),
    resultCount: z.number(),
    totalCount: z.number(),
  }),
});

const contentFindFilesQuerySchema = z.object({
  slug: z.string(),
});

export class ContentDto extends createZodDto(contentSchema) {}
export class ContentQueryDto extends createZodDto(contentQuerySchema) {}
export class ContentResponseDto extends createZodDto(contentResponseSchema) {}
export class DetailContentQueryDto extends createZodDto(detailContentQuerySchema) {}
export class DetailContentResponseDto extends createZodDto(detailContentResponseSchema) {}
export class ContentFindFilesQueryDto extends createZodDto(contentFindFilesQuerySchema) {}

import { createZodDto } from '@shared/utils/zod.dto';
import {
  CurseForgeFileReleaseType,
  CurseForgeFileStatus,
  CurseForgeModLoaderType,
  CurseForgeModsSearchSortField,
  CurseForgeSortOrder,
} from 'curseforge-api';
import z from 'zod';

import { baseResponseSchema } from './base.dto';

const contentSchema = z.object({
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
  dateCreated: z.date(),
  dateModified: z.date(),
  dateReleased: z.date(),
  latestFilesIndexes: z
    .array(
      z.object({
        gameVersion: z.string(),
        fileId: z.number(),
        filename: z.string(),
        releaseType: z.number().enum(CurseForgeFileReleaseType),
        gameVersionTypeId: z.number().nullish(),
        modLoader: z.number().enum(CurseForgeModLoaderType),
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

const contentResponseSchema = baseResponseSchema.extend({
  data: z.array(contentSchema),
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
  sortField: z.coerce.number().enum(CurseForgeModsSearchSortField).optional(),
  sortOrder: z.enum(CurseForgeSortOrder).optional(),
  modLoaderType: z.coerce.number().enum(CurseForgeModLoaderType).optional(),
  modLoaderTypes: z.string().optional(),
  gameVersionTypeId: z.coerce.number().optional(),
  authorId: z.coerce.number().optional(),
  primaryAuthorId: z.coerce.number().optional(),
  slug: z.string().optional(),
  index: z.coerce.number().min(0).optional(),
  pageSize: z.coerce.number().max(50).optional(),
});

const contentFileSchema = z.object({
  id: z.number(),
  contentId: z.number(),
  releaseType: z.enum(Object.keys(CurseForgeFileReleaseType)),
  fileName: z.string(),
  fileStatus: z.enum(Object.keys(CurseForgeFileStatus)),
  fileDate: z.date(),
  fileLength: z.number(),
  fileSize: z.string(),
  downloadCount: z.number(),
  downloadUrl: z.url(),
  gameVersions: z.array(z.string()),
  dependencies: z.array(
    z.object({
      modId: z.number(),
      relationType: z.number(),
    }),
  ),
});

const contentFileResponseSchema = baseResponseSchema.extend({
  data: z.array(contentFileSchema),
});

const contentFileQuerySchema = z.object({
  id: z.coerce.number(),
  gameVersion: z.string().optional(),
  modLoaderType: z.coerce.number().enum(CurseForgeModLoaderType).optional(),
  gameVersionTypeId: z.coerce.number().optional(),
  index: z.coerce.number().min(0).optional(),
  pageSize: z.coerce.number().max(50).optional(),
});

export class ContentDto extends createZodDto(contentSchema) {}
export class ContentQueryDto extends createZodDto(contentQuerySchema) {}
export class ContentResponseDto extends createZodDto(contentResponseSchema) {}
export class ContentFileDto extends createZodDto(contentFileSchema) {}
export class ContentFileQueryDto extends createZodDto(contentFileQuerySchema) {}
export class ContentFileResponseDto extends createZodDto(contentFileResponseSchema) {}

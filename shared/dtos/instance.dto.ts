import { CurseForgeModLoaderType } from 'curseforge-api';
import z from 'zod';

import { createZodDto } from '../utils/zod.dto';

export enum InstanceContentType {
  MODS = 'mods',
  RESOURCEPACKS = 'resourcepacks',
  SHADERPACKS = 'shaderpacks',
  DATAPACKS = 'datapacks',
  WORLDS = 'worlds',
}

const instanceContentSchema = z.object({
  id: z.number(),
  name: z.string(),
  fileId: z.number(),
  fileName: z.string(),
  fileUrl: z.url(),
  fileLength: z.number(),
  enabled: z.boolean(),
  dependencies: z.array(z.number()).optional(),
});

const instanceSchema = z.object({
  // Metadata
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  lastPlayed: z.string().optional(),
  // Version
  version: z.string(),
  loader: z
    .object({
      type: z.coerce.number().enum(CurseForgeModLoaderType),
      version: z.string(),
    })
    .nullish(),
  // Game Contents
  mods: z.array(instanceContentSchema).nullish(),
  resourcepacks: z.array(instanceContentSchema).nullish(),
  shaderpacks: z.array(instanceContentSchema).nullish(),
  datapacks: z.array(instanceContentSchema).nullish(),
  worlds: z.array(instanceContentSchema).nullish(),
});

const instanceQuerySchema = z.object({
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'lastPlayed', 'version']).default('lastPlayed'),
});

const instanceWorldSchema = z.object({
  instanceId: z.string().nullish(),
  name: z.string(),
  folderName: z.string(),
  version: z.string(),
  icon: z.string().nullish(),
  gameType: z.number(),
  path: z.string(),
});

const instanceContentQuerySchema = z.object({
  id: z.string(),
  contentType: z.enum(InstanceContentType).default(InstanceContentType.MODS),
});

const instanceContentAddQuerySchema = instanceContentQuerySchema.extend({
  contentId: z.coerce.number(),
  worlds: z.string().nullish(),
});

const instanceContentRemoveQuerySchema = instanceContentAddQuerySchema.omit({ worlds: true });

const instanceContentRemoveResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    id: z.number(),
    fileName: z.string(),
  }),
});

const instanceContentDownloadQuerySchema = z.object({
  groupedContents: z.record(z.string(), z.array(instanceContentSchema)),
  instanceId: z.string(),
  worlds: z.array(z.string()).optional(),
});

const instanceContentToggleQuerySchema = instanceContentQuerySchema.extend({
  contentIds: z.array(z.number()),
  enable: z.boolean().optional(),
});

export class InstanceDto extends createZodDto(instanceSchema) {}
export class InstanceQueryDto extends createZodDto(instanceQuerySchema) {}
export class InstanceWorldDto extends createZodDto(instanceWorldSchema) {}
export class InstanceContentDto extends createZodDto(instanceContentSchema) {}
export class InstanceContentQueryDto extends createZodDto(instanceContentQuerySchema) {}
export class InstanceContentAddQueryDto extends createZodDto(instanceContentAddQuerySchema) {}
export class InstanceContentRemoveQueryDto extends createZodDto(instanceContentRemoveQuerySchema) {}
export class InstanceContentRemoveResponseDto extends createZodDto(instanceContentRemoveResponseSchema) {}
export class InstanceContentToggleQueryDto extends createZodDto(instanceContentToggleQuerySchema) {}
export class InstanceContentDownloadQueryDto extends createZodDto(instanceContentDownloadQuerySchema) {}

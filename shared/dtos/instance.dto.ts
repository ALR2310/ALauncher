import { createZodDto } from '@shared/utils/zod.dto';
import { CurseForgeModLoaderType } from 'curseforge-api';
import z from 'zod';

export enum INSTANCE_CONTENT_TYPE {
  MODS = 'mods',
  RESOURCEPACKS = 'resourcepacks',
  SHADERPACKS = 'shaderpacks',
  DATAPACKS = 'datapacks',
  WORLDS = 'worlds',
}

export enum INSTANCE_CONTENT_STATUS {
  NOT_INSTALLED = 'not_installed',
  OUTDATED = 'outdated',
  INSTALLED = 'installed',
  INCOMPATIBLE = 'incompatible',
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
      type: z.enum(Object.keys(CurseForgeModLoaderType)),
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

const instanceContentQuerySchema = z.object({
  id: z.string(),
  contentType: z.enum(INSTANCE_CONTENT_TYPE).default(INSTANCE_CONTENT_TYPE.MODS),
});

const instanceContentAddQuerySchema = instanceContentQuerySchema.extend({
  contentId: z.coerce.number(),
  worlds: z.string().nullish(),
});

const instanceContentDownloadQuerySchema = z.object({
  groupedContents: z.record(z.string(), z.array(instanceContentSchema)),
  instanceId: z.string(),
  worlds: z.array(z.string()).optional(),
});

export class InstanceDto extends createZodDto(instanceSchema) {}
export class InstanceQueryDto extends createZodDto(instanceQuerySchema) {}
export class InstanceContentDto extends createZodDto(instanceContentSchema) {}
export class InstanceContentQueryDto extends createZodDto(instanceContentQuerySchema) {}
export class InstanceContentAddQueryDto extends createZodDto(instanceContentAddQuerySchema) {}
export class InstanceContentDownloadQueryDto extends createZodDto(instanceContentDownloadQuerySchema) {}

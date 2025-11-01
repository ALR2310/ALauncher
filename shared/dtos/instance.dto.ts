import { InstanceContentEnum } from '@shared/enums/general.enum';
import { CurseForgeModLoaderType } from 'curseforge-api';
import z from 'zod';

import { createZodDto } from '../utils/zod.dto';

const instanceContentSchema = z.object({
  id: z.number(),
  name: z.string(),
  fileId: z.number(),
  fileName: z.string(),
  fileUrl: z.url(),
  fileLength: z.number(),
  enabled: z.boolean(),
  hash: z.hash('sha1'),
  dependencies: z.array(z.number()).optional(),
});

export const instanceSchema = z.object({
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
      type: z.enum(CurseForgeModLoaderType),
      build: z.string(),
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

const instanceUpdateBodySchema = z.object({
  id: z.string(),
  data: instanceSchema.partial(),
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
  contentType: z.enum(InstanceContentEnum).default(InstanceContentEnum.Mods),
});

const instanceContentAddQuerySchema = z.object({
  id: z.string(),
  contentId: z.number(),
  worlds: z.array(z.string()).optional(),
  fileId: z.number().optional(),
});

const instanceContentRemoveQuerySchema = instanceContentQuerySchema.extend({
  contentIds: z.union([z.coerce.number(), z.array(z.coerce.number())]).transform((v) => (Array.isArray(v) ? v : [v])),
});

const instanceContentRemoveResponseSchema = z.object({
  message: z.string(),
  data: z.array(instanceContentSchema),
});

const instanceContentToggleQuerySchema = instanceContentRemoveQuerySchema.extend({
  contentIds: z.array(z.number()),
  enable: z.boolean().optional(),
});

const instanceContentToggleResponseSchema = instanceContentRemoveResponseSchema;

const instanceContentDownloadQuerySchema = z.object({
  id: z.string(),
  grouped: z.partialRecord(z.enum(InstanceContentEnum), z.array(instanceContentSchema)),
  worlds: z.array(z.string()).optional(),
});

export class InstanceDto extends createZodDto(instanceSchema) {}
export class InstanceQueryDto extends createZodDto(instanceQuerySchema) {}
export class InstanceUpdateBodyDto extends createZodDto(instanceUpdateBodySchema) {}
export class InstanceWorldDto extends createZodDto(instanceWorldSchema) {}
export class InstanceContentDto extends createZodDto(instanceContentSchema) {}
export class InstanceContentQueryDto extends createZodDto(instanceContentQuerySchema) {}
export class InstanceContentAddQueryDto extends createZodDto(instanceContentAddQuerySchema) {}
export class InstanceContentRemoveQueryDto extends createZodDto(instanceContentRemoveQuerySchema) {}
export class InstanceContentRemoveResponseDto extends createZodDto(instanceContentRemoveResponseSchema) {}
export class InstanceContentToggleQueryDto extends createZodDto(instanceContentToggleQuerySchema) {}
export class InstanceContentToggleResponseDto extends createZodDto(instanceContentToggleResponseSchema) {}
export class InstanceContentDownloadQueryDto extends createZodDto(instanceContentDownloadQuerySchema) {}

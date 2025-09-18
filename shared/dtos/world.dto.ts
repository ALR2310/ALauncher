import z from 'zod';

import { createZodDto } from '../utils/zod.dto';

export const WorldSchema = z.object({
  name: z.string(),
  folderName: z.string(),
  version: z.string(),
  icon: z.string().nullish(),
  instanceId: z.string().nullish(),
  gameType: z.number(),
  path: z.string(),
});

export const WorldsQuerySchema = z.object({
  instanceId: z.string().nullish(),
});

export class WorldDto extends createZodDto(WorldSchema) {}
export class WorldsQueryDto extends createZodDto(WorldsQuerySchema) {}

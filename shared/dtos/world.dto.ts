import z from 'zod';

import { createZodDto } from '../utils/zod.dto';

export const WorldSchema = z.object({
  name: z.string(),
  version: z.string(),
  seed: z.string(),
  icon: z.string().optional(),
  gameType: z.number(),
  path: z.string(),
});

export const WorldsQuerySchema = z.object({
  instanceId: z.string().optional(),
});

export class WorldDto extends createZodDto(WorldSchema) {}
export class WorldsQueryDto extends createZodDto(WorldsQuerySchema) {}

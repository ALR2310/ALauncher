import z from 'zod';

import { contentSchema } from './additional.schema';
import { loaderSchema } from './version.schema';

export const instanceSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string(),
  loader: loaderSchema,
  mods: z.array(contentSchema).optional(),
  resourcepacks: z.array(contentSchema).optional(),
  shaderpacks: z.array(contentSchema).optional(),
  datapacks: z.array(contentSchema).optional(),
  worlds: z.array(contentSchema).optional(),
  last_updated: z.string().optional(),
  game_options: z.string().optional(),
});
export type Instance = z.infer<typeof instanceSchema>;

export const updateInstanceSchema = z.object({
  id: z.string(),
  instance: instanceSchema.partial(),
});
export type UpdateInstancePayload = z.infer<typeof updateInstanceSchema>;

export const instanceRemoveContentQuerySchema = z.object({
  id: z.string(),
  type: z.enum(['mods', 'resourcepacks', 'shaderpacks', 'datapacks', 'worlds']).default('mods'),
  contentId: z.coerce.number(),
});
export type InstanceRemoveContentQuery = z.infer<typeof instanceRemoveContentQuerySchema>;

export const instanceAddContentQuerySchema = instanceRemoveContentQuerySchema.extend({
  worldName: z.string().optional(),
  name: z.string(),
  author: z.string(),
  logoUrl: z.url(),
});
export type InstanceAddContentQuery = z.infer<typeof instanceAddContentQuerySchema>;

export const instanceToggleContentPayloadSchema = instanceRemoveContentQuerySchema
  .pick({
    id: true,
    type: true,
  })
  .extend({
    contentIds: z.array(z.number()),
    enabled: z.boolean().optional(),
  });
export type InstanceToggleContentPayload = z.infer<typeof instanceToggleContentPayloadSchema>;

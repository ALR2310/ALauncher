import z from 'zod';

import { createZodDto } from '../../src-server/common/zod-dto';
import { contentSchema } from './content.dto';
import { loaderSchema } from './version.dto';

const instanceSchema = z.object({
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

const updateInstanceSchema = z.object({
  id: z.string(),
  instance: instanceSchema.partial(),
});

const removeContentInstanceSchema = z.object({
  id: z.string(),
  type: z.enum(['mods', 'resourcepacks', 'shaderpacks', 'datapacks', 'worlds']).default('mods'),
  contentId: z.coerce.number(),
});

const addContentInstanceSchema = removeContentInstanceSchema.extend({
  worldName: z.string().optional(),
  name: z.string(),
  author: z.string(),
  logoUrl: z.url(),
});

const toggleContentInstanceSchema = removeContentInstanceSchema
  .pick({
    id: true,
    type: true,
  })
  .extend({
    contentIds: z.array(z.number()),
    enabled: z.boolean().optional(),
  });

export class InstanceDto extends createZodDto(instanceSchema) {}
export class UpdateInstanceDto extends createZodDto(updateInstanceSchema) {}
export class RemoveContentInstanceDto extends createZodDto(removeContentInstanceSchema) {}
export class AddContentInstanceDto extends createZodDto(addContentInstanceSchema) {}
export class ToggleContentInstanceDto extends createZodDto(toggleContentInstanceSchema) {}

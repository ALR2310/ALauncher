import z from 'zod';

import { additionalSchema } from './additional.schema';

const loaderSchema = z.object({
  type: z.string(),
  version: z.string().or(z.literal('latest')).or(z.literal('recommended')),
});

export const instanceSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string(),
  loader: loaderSchema,
  mods: z.array(additionalSchema).optional(),
  resourcepacks: z.array(additionalSchema).optional(),
  datapacks: z.array(additionalSchema).optional(),
  worlds: z.array(additionalSchema).optional(),
  last_updated: z.string().optional(),
  game_options: z.string().optional(),
});

export type Instance = z.infer<typeof instanceSchema>;

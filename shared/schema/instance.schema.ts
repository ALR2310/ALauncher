import z from 'zod';

const loaderSchema = z.object({
  type: z.string(),
  version: z.string().or(z.literal('latest')).or(z.literal('recommended')),
});

export const additionalSchema = z.object({
  id: z.number(),
  fileId: z.number(),
  name: z.string(),
  fileName: z.string(),
  fileUrl: z.url(),
  fileSize: z.number(),
  enabled: z.boolean(),
  dependencies: z.array(z.number()).optional(),
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
export type Additional = z.infer<typeof additionalSchema>;

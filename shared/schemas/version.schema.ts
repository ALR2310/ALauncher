import z from 'zod';

export const loaderSchema = z.object({
  type: z.enum(['forge', 'fabric', 'quilt', 'neoforge']),
  version: z.string(),
});
export type Loader = z.infer<typeof loaderSchema>;

export const versionSchema = z.object({
  name: z.string(),
  type: z.enum(['release', 'modified']),
  version: z.string(),
  loader: loaderSchema.optional(),
  instance: z.string().optional(),
  downloaded: z.boolean().default(false).optional(),
});
export type Version = z.infer<typeof versionSchema>;

export const releaseNoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  version: z.string(),
  type: z.string(),
  image: z.object({
    title: z.string(),
    url: z.url(),
  }),
  date: z.date(),
  body: z.string(),
});
export type ReleaseNote = z.infer<typeof releaseNoteSchema>;

export const releaseNoteQuerySchema = z.object({
  pageIndex: z.coerce.number().min(0).default(0),
  pageSize: z.coerce.number().min(1).max(50).default(1),
});
export type ReleaseNoteQuery = z.infer<typeof releaseNoteQuerySchema>;

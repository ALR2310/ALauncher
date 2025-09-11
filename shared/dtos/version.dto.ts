import z from 'zod';

import { createZodDto } from '../../src-server/common/zod-dto';

export const loaderSchema = z.object({
  type: z.enum(['forge', 'fabric', 'quilt', 'neoforge']),
  version: z.string(),
});

export const versionSchema = z.object({
  name: z.string(),
  type: z.enum(['release', 'modified']),
  version: z.string(),
  loader: loaderSchema.optional(),
  instance: z.string().optional(),
  downloaded: z.boolean().default(false).optional(),
});

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

export const releaseNoteQuerySchema = z.object({
  pageIndex: z.coerce.number().min(0).default(0),
  pageSize: z.coerce.number().min(1).max(50).default(1),
});

export class LoaderDto extends createZodDto(loaderSchema) {}
export class VersionDto extends createZodDto(versionSchema) {}
export class ReleaseNoteDto extends createZodDto(releaseNoteSchema) {}
export class ReleaseNoteQueryDto extends createZodDto(releaseNoteQuerySchema) {}

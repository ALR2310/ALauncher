import { CurseForgeModLoaderType } from 'curseforge-api';
import z from 'zod';

import { createZodDto } from '../utils/zod.dto';
import { baseResponseSchema } from './base.dto';

export enum VERSION_TYPE {
  RELEASE = 'release',
  MODIFIED = 'modified',
}

const versionSchema = z.object({
  name: z.string(),
  type: z.enum(VERSION_TYPE),
  version: z.string(),
  loader: z
    .object({
      type: z.string(),
      version: z.string(),
    })
    .nullish(),
});

const loaderQuerySchema = z.object({
  version: z.string().optional(),
  type: z.coerce.number().enum(CurseForgeModLoaderType).optional(),
});

const releaseNoteQuerySchema = z.object({
  index: z.coerce.number().min(0).optional(),
  pageSize: z.coerce.number().min(1).max(50).optional(),
});

const releaseNoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  version: z.string(),
  type: z.string(),
  image: z.object({
    title: z.string(),
    url: z.url(),
  }),
  contentPath: z.string(),
  date: z.string(),
  shortText: z.string(),
});

const releaseNoteResponseSchema = baseResponseSchema.extend({
  data: z.array(releaseNoteSchema),
});

const releaseNoteDetailQuerySchema = z.object({
  version: z.string(),
});

const releaseNoteDetailsSchema = releaseNoteSchema.extend({
  content: z.string(),
});

export class VersionDto extends createZodDto(versionSchema) {}
export class LoaderQueryDto extends createZodDto(loaderQuerySchema) {}
export class ReleaseNoteDto extends createZodDto(releaseNoteSchema) {}
export class ReleaseNoteQueryDto extends createZodDto(releaseNoteQuerySchema) {}
export class ReleaseNoteResponseDto extends createZodDto(releaseNoteResponseSchema) {}
export class ReleaseNoteDetailQueryDto extends createZodDto(releaseNoteDetailQuerySchema) {}
export class ReleaseNoteDetailsDto extends createZodDto(releaseNoteDetailsSchema) {}

import * as z from 'zod';

import { createZodDto } from '../utils/zod.utils';

export const baseResponseSchema = z.object({
  message: z.string().optional(),
  data: z.any().optional(),
});

export const paginateResponseSchema = baseResponseSchema.extend({
  pagination: z.object({
    index: z.number(),
    pageSize: z.number(),
    resultCount: z.number(),
    totalCount: z.number(),
  }),
});

export class BaseResponseDto extends createZodDto(baseResponseSchema) {}
export class PaginateResponseDto extends createZodDto(paginateResponseSchema) {}

import z from 'zod';

export const baseResponseSchema = z.object({
  data: z.any(),
  pagination: z.object({
    index: z.number(),
    pageSize: z.number(),
    resultCount: z.number(),
    totalCount: z.number(),
  }),
});

import { z } from 'zod';

export const categorySchema = z.object({
  id: z.number(),
  gameId: z.number(),
  name: z.string(),
  slug: z.string(),
  url: z.url(),
  iconUrl: z.url(),
  dateModified: z.date().optional(),
  classId: z.number().optional(),
  parentCategoryId: z.number().optional(),
  isClass: z.boolean().optional(),
  displayIndex: z.number().optional(),
});
export type Category = z.infer<typeof categorySchema>;

export const categoryQuerySchema = z.object({
  classId: z.coerce.number().optional(),
  classesOnly: z.coerce.boolean().optional().default(false),
});
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;
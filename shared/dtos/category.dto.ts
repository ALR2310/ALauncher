import { z } from 'zod';

import { createZodDto } from '../utils/zod.dto';

const categorySchema = z.object({
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

const categoryQuerySchema = z.object({
  classId: z.coerce.number().optional(),
  classesOnly: z.coerce.boolean().optional().default(false),
});

export class CategoryDto extends createZodDto(categorySchema) {}
export class CategoryQueryDto extends createZodDto(categoryQuerySchema) {}

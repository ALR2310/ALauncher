import { z } from 'zod';

import { createZodDto } from '../utils/zod.dto';

const categoryQuerySchema = z.object({
  classId: z.coerce.number().optional(),
  classesOnly: z.coerce.boolean().optional().default(false),
});

export class CategoryQueryDto extends createZodDto(categoryQuerySchema) {}

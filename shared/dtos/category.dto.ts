import { z } from 'zod';

import { createZodDto } from '../utils/zod.dto';

export const categoryMap = {
  keyToText: {
    'mc-mods': 'Mods',
    'data-packs': 'Data Packs',
    'texture-packs': 'Resource Packs',
    shaders: 'Shader Packs',
    worlds: 'Worlds',
  },
  keyToId: {
    'mc-mods': 6,
    'data-packs': 6945,
    'texture-packs': 12,
    shaders: 6552,
    worlds: 17,
  },
  idToText: {
    6: 'Mods',
    6945: 'Data Packs',
    12: 'Resource Packs',
    6552: 'Shader Packs',
    17: 'Worlds',
  },
  idToKey: {
    6: 'mc-mods',
    6945: 'data-packs',
    12: 'texture-packs',
    6552: 'shaders',
    17: 'worlds',
  },
};

const categoryQuerySchema = z.object({
  classId: z.coerce.number().optional(),
  classesOnly: z.coerce.boolean().optional().default(false),
});

export class CategoryQueryDto extends createZodDto(categoryQuerySchema) {}

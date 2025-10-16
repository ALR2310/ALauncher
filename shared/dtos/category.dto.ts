import { z } from 'zod';

import { createZodDto } from '../utils/zod.dto';

export const categoryMap = {
  keyToText: {
    'mc-mods': 'Mods',
    'data-packs': 'Data Packs',
    'texture-packs': 'Resource Packs',
    shaders: 'Shader Packs',
    worlds: 'Worlds',
    modpacks: 'Modpacks',
    customization: 'Customization',
    'mc-addons': 'Addons',
    'bukkit-plugins': 'Bukkit Plugins',
  },
  keyToId: {
    'mc-mods': 6,
    'data-packs': 6945,
    'texture-packs': 12,
    shaders: 6552,
    worlds: 17,
    modpacks: 4471,
    customization: 4546,
    'mc-addons': 4559,
    'bukkit-plugins': 5,
  },
  idToText: {
    6: 'Mods',
    6945: 'Data Packs',
    12: 'Resource Packs',
    6552: 'Shader Packs',
    17: 'Worlds',
    4471: 'Modpacks',
    4546: 'Customization',
    4559: 'Addons',
    5: 'Bukkit Plugins',
  },
  idToKey: {
    6: 'mc-mods',
    6945: 'data-packs',
    12: 'texture-packs',
    6552: 'shaders',
    17: 'worlds',
    4471: 'modpacks',
    4546: 'customization',
    4559: 'mc-addons',
    5: 'bukkit-plugins',
  },
};

const categoryQuerySchema = z.object({
  classId: z.coerce.number().optional(),
  classesOnly: z.coerce.boolean().optional().default(false),
});

export class CategoryQueryDto extends createZodDto(categoryQuerySchema) {}

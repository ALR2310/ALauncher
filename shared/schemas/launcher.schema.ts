import z from 'zod';

import { extractPaths } from '../utils/general.utils';
import { versionSchema } from './version.schema';

export const launcherConfigSchema = z.object({
  minecraft: z.object({
    gamedir: z.string(),
    java: z.object({
      path: z.string().optional(),
      version: z.string().optional(),
      type: z
        .enum(['jdk', 'jre', 'testimage', 'debugimage', 'staticlibs', 'sources', 'sbom'])
        .optional()
        .default('jdk'),
    }),
    ram: z.number().min(512).default(1024),
    language: z.string().default('en_US'),
    width: z.number(),
    height: z.number(),
    fullscreen: z.boolean().default(false),
  }),
  profile_selected: versionSchema,
  auth: z.object({
    type: z.enum(['offline', 'microsoft', 'mojang']).default('offline'),
    username: z.string().default('Player'),
  }),
  download_multiple: z.number().min(1).max(10).default(3),
  theme: z.string().default('system'),
  language: z.string().default('en_US'),
  auto_updates: z.boolean().default(true),
});
export type LauncherConfig = z.infer<typeof launcherConfigSchema>;

export const setConfigSchema = z.object({
  key: z.enum([...extractPaths(launcherConfigSchema)] as [string, ...string[]]),
  value: z.any(),
});
export type SetConfigPayload = z.infer<typeof setConfigSchema>;

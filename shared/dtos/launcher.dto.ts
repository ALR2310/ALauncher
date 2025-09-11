import z from 'zod';

import { createZodDto } from '../../src-server/common/zod-dto';
import { versionSchema } from './version.dto';

export const launcherConfigSchema = z.object({
  minecraft: z.object({
    gamedir: z.string(),
    java: z.object({
      path: z.string().optional(),
      version: z.string().optional(),
      type: z.enum(['jdk', 'jre', 'testimage', 'debugimage', 'staticlibs', 'sources', 'sbom']).default('jdk'),
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

export const LauncherConfigKeys = [
  // minecraft
  'minecraft',
  'minecraft.gamedir',
  'minecraft.java',
  'minecraft.java.path',
  'minecraft.java.version',
  'minecraft.java.type',
  'minecraft.ram',
  'minecraft.language',
  'minecraft.width',
  'minecraft.height',
  'minecraft.fullscreen',

  // profile
  'profile_selected',

  // auth
  'auth',
  'auth.type',
  'auth.username',

  // global
  'download_multiple',
  'theme',
  'language',
  'auto_updates',
] as const;

export type LauncherConfigKey = (typeof LauncherConfigKeys)[number];

export const updateLauncherConfigSchema = z.object({
  key: z.enum(LauncherConfigKeys),
  value: z.any(),
});

export class LauncherConfigDto extends createZodDto(launcherConfigSchema) {}
export class UpdateLauncherConfigDto extends createZodDto(updateLauncherConfigSchema) {}

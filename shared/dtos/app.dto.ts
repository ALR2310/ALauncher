import z from 'zod';

import { createZodDto } from '../utils/zod.dto';

export enum JAVA_TYPE {
  JDK = 'jdk',
  JRE = 'jre',
  TESTIMAGE = 'testimage',
  DEBUGIMAGE = 'debugimage',
  STATICLIBS = 'staticlibs',
  SOURCES = 'sources',
  SBOM = 'sbom',
}

const appConfigSchema = z.object({
  // General
  language: z.string().default('en_US'),
  theme: z.string().default('system'),
  autoUpdate: z.boolean().default(true),
  downloadMultiple: z.number().min(1).max(10).default(3),
  // Auth
  auth: z.object({
    type: z.enum(['offline', 'microsoft', 'mojang', 'elyby']).default('offline'),
    username: z.string().default('Player'),
    uuid: z.uuid().optional(),
    accessToken: z.string().optional(),
  }),
  // Minecraft
  minecraft: z.object({
    verify: z.boolean().default(false),
    gameDir: z.string().default('.minecraft'),
    java: z.object({
      path: z.string().optional(),
      version: z.string().optional(),
      type: z.enum(JAVA_TYPE).default(JAVA_TYPE.JDK),
    }),
    memory: z.object({
      min: z.number().min(512).default(512),
      max: z.number().min(512).default(1024),
    }),
    screen: z.object({
      width: z.number(),
      height: z.number(),
      fullscreen: z.boolean().default(false),
    }),
  }),
});

const appConfigKeys = [
  // general
  'language',
  'theme',
  'autoUpdate',
  'downloadMultiple',
  // auth
  'auth',
  'auth.type',
  'auth.username',
  'auth.uuid',
  'auth.accessToken',
  // minecraft
  'minecraft',
  'minecraft.verify',
  'minecraft.gameDir',
  'minecraft.java',
  'minecraft.java.path',
  'minecraft.java.version',
  'minecraft.java.type',
  'minecraft.memory',
  'minecraft.memory.min',
  'minecraft.memory.max',
  'minecraft.screen',
  'minecraft.screen.width',
  'minecraft.screen.height',
  'minecraft.screen.fullscreen',
] as const;

const setConfigSchema = z.object({
  key: z.enum(appConfigKeys),
  value: z.any(),
});

export type AppConfigKey = (typeof appConfigKeys)[number];
export class AppConfigDto extends createZodDto(appConfigSchema) {}
export class SetConfigDto extends createZodDto(setConfigSchema) {}

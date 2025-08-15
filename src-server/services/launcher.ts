import EventEmitter from 'events';

import { Launch, Mojang } from '../libs/minecraft-java-core/build/Index';
import { appConfig } from './appConfig';

let launcherInstance: Launch | null = null;

export async function launch() {
  const emitter = new EventEmitter();
  const config = appConfig();
  launcherInstance = new Launch();
  const auth = await Mojang.login(config.username);

  launcherInstance
    .on('progress', (p, s) => emitter.emit('progress', p, s))
    .on('data', (line) => emitter.emit('log', line.toString()))
    .on('speed', (s) => emitter.emit('speed', s))
    .on('estimated', (t) => emitter.emit('estimated', t))
    .on('extract', (e) => emitter.emit('extract', e))
    .on('patch', (e) => emitter.emit('patch', e))
    .on('close', () => emitter.emit('close'))
    .on('error', (err) => emitter.emit('error', err));

  launcherInstance.Launch({
    path: config.minecraft.gamedir,
    version: config.version_selected,
    bypassOffline: true,
    authenticator: auth,
    loader: {
      path: '.',
      type: 'forge',
      build: 'latest',
      enable: false,
    },
    instance: '',
    mcp: undefined,
    verify: false,
    ignored: [],
    java: {
      type: config.minecraft.java,
    },
    screen: {
      width: config.minecraft.width,
      height: config.minecraft.height,
      fullscreen: config.minecraft.fullscreen,
    },
    memory: {
      min: config.minecraft.ram,
      max: config.minecraft.ram,
    },
    downloadFileMultiple: 5,
    JVM_ARGS: [],
    GAME_ARGS: [],
  });

  return emitter;
}

export function cancel() {
  if (launcherInstance) {
    launcherInstance.cancel();
    launcherInstance = null;
  }
  return true;
}

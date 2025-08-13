import EventEmitter from 'events';
import { Launch, Mojang } from 'minecraft-java-core';

import { appConfig } from './appConfig';

export async function launch() {
  const emitter = new EventEmitter();
  const config = appConfig();
  const launcher = new Launch();
  const auth = await Mojang.login(config.username);

  launcher
    .on('progress', (p, s) => emitter.emit('progress', p, s))
    .on('data', (line) => emitter.emit('log', line.toString()))
    .on('speed', (s) => emitter.emit('speed', s))
    .on('estimated', (t) => emitter.emit('estimated', t))
    .on('extract', (e) => emitter.emit('extract', e))
    .on('patch', (e) => emitter.emit('patch', e))
    .on('close', () => emitter.emit('close'))
    .on('error', (err) => emitter.emit('error', err));

  launcher.Launch({
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

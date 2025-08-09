import fs from 'fs';
import get from 'lodash/get';
import set from 'lodash/set';
import path from 'path';

const defaultConfig = {
  window: {
    width: 400,
    height: 250,
    fullscreen: false,
    title: 'ALauncher',
  },
  theme: 'dark',
  language: 'vi',
  download_multiple: 5,
  username: '',
  version_selected: 'latest',
  minecraft: {
    width: 400,
    height: 250,
    fullscreen: false,
    gamedir: './minecraft',
    java: '',
    language: 'vi',
    ram: {
      value: 1,
      unit: 'GB',
    },
  },
  modpack: [
    {
      id: '123456',
      name: 'test',
      slug: 'test',
      version: '1.0.0',
      minecraft: '1.21.1',
      loader: 'neoforge',
      description: 'abc',
      icon: '',
      url: 'https:example.com',
      author: 'an',
      last_updated: '2024-01-01T00:00:00Z',
    },
  ],
  auto_updates: true,
};

export function appConfig(keyPath?: string, value?: string | number | boolean) {
  const jsonPath = path.join('launcher.json');

  let config: any;
  if (fs.existsSync(jsonPath)) {
    config = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } else {
    config = defaultConfig;
    fs.writeFileSync(jsonPath, JSON.stringify(config, null, 2));
  }

  if (keyPath === undefined) {
    return config;
  }

  if (value === undefined) {
    return get(config, keyPath);
  }

  set(config, keyPath, value);
  fs.writeFileSync(jsonPath, JSON.stringify(config, null, 2), 'utf8');

  return config;
}

type THEME = 'light' | 'dark';
type LANGUAGE = 'en' | 'vi';
type JAVA = 'jdk' | 'jre';

export interface LauncherConfigType {
  window: {
    width: number;
    height: number;
    fullscreen: boolean;
    title: string;
  };
  theme: THEME;
  language: LANGUAGE;
  download_multiple: number;
  username: string;
  version_selected: string;
  minecraft: {
    width: number;
    height: number;
    fullscreen: boolean;
    gamedir: string;
    java: JAVA;
    language: LANGUAGE;
    ram: string;
  };
  auto_updates: boolean;
}

export interface ManifestType {
  instances: Array<{
    id: string;
    name: string;
    slug: string;
    version: string;
    minecraft: string;
    loader: string;
    description: string;
    icon: string;
    url: string;
    author: string;
    last_updated: string;
  }>;
}

export type InstanceType = {
  id: string;
  name: string;
  slug: string;
  version: string;
  minecraft: string;
  loader: {
    name: string;
    version: string;
  };
  last_updated: string;
  mods: Array<{
    id: string;
    name: string;
    file_name: string;
    download_url: string;
  }>;
};

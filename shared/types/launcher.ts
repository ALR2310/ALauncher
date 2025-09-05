export interface LauncherConfig {
  minecraft: {
    gamedir: string;
    java: {
      path?: string;
      version?: string;
      type?: 'jdk' | 'jre' | 'testimage' | 'debugimage' | 'staticlibs' | 'sources' | 'sbom';
    };
    ram: number;
    language: string;
    width: number;
    height: number;
    fullscreen: boolean;
  };
  profile_selected: {
    name: string;
    type: 'release' | 'modified';
    version: string;
    loader?: { type: string; version: string };
    instance?: string;
  };
  auth: {
    type: 'offline' | 'microsoft' | 'mojang';
    username: string;
  };
  download_multiple: number;
  theme: string;
  language: string;
  auto_updates: boolean;
}

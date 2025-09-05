export interface Version {
  name: string;
  type: 'release' | 'modified';
  version: string;
  loader?: { type: string; version: string };
  instance?: string;
  downloaded?: boolean;
}

export interface ReleaseNote {
  id: string;
  title: string;
  version: string;
  type: string;
  image: {
    title: string;
    url: string;
  };
  date: string;
  body: string;
}

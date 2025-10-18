export function formatToSlug(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function abbreviateNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1_000_000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  if (num < 1_000_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

  return `${value} ${sizes[i]}`;
}

export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function compareVersion(a: string, b: string): number {
  const toNums = (v: string) => {
    const main = v.split('-')[0];
    const parts = main.split('.').map((s) => parseInt(s, 10));
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0] as const;
  };

  const [aMaj, aMin, aPatch] = toNums(a);
  const [bMaj, bMin, bPatch] = toNums(b);

  if (aMaj !== bMaj) return bMaj - aMaj;
  if (aMin !== bMin) return bMin - aMin;
  if (aPatch !== bPatch) return bPatch - aPatch;

  const aPre = a.includes('-');
  const bPre = b.includes('-');
  if (aPre !== bPre) return aPre ? 1 : -1;

  return 0;
}

export function invertObject<T extends Record<string, string | number>>(obj: T): { [K in keyof T as `${T[K]}`]: K } {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k])) as any;
}

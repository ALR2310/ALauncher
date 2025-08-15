import { ManifestType } from '@shared/launcher.type';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const MANIFEST_PATH = path.join('manifest.json');
const TMP_PATH = MANIFEST_PATH + '.tmp';

function ensureDirSync(p: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
}

function safeParseJSON<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export async function readManifest(): Promise<ManifestType> {
  ensureDirSync(MANIFEST_PATH);
  try {
    const buf = await fsp.readFile(MANIFEST_PATH, 'utf-8');
    const parsed = safeParseJSON<ManifestType>(buf, { instances: [] });
    if (!Array.isArray(parsed.instances)) return { instances: [] };
    return parsed;
  } catch (e: any) {
    if (e?.code === 'ENOENT') {
      const initial: ManifestType = { instances: [] };
      await writeManifest(initial);
      return initial;
    }
    try {
      await fsp.rename(MANIFEST_PATH, MANIFEST_PATH + `.corrupt-${Date.now()}`);
    } catch {}
    const fresh: ManifestType = { instances: [] };
    await writeManifest(fresh);
    return fresh;
  }
}

export async function writeManifest(manifest: ManifestType): Promise<void> {
  ensureDirSync(MANIFEST_PATH);
  const data = JSON.stringify(manifest, null, 2);
  await fsp.writeFile(TMP_PATH, data, 'utf-8');
  await fsp.rename(TMP_PATH, MANIFEST_PATH);
}

export async function getModpack(params: { id?: string; slug?: string; name?: string }) {
  const manifest = await readManifest();
  if (params.id) return manifest.instances.find((i) => i.id === params.id);
  if (params.slug) return manifest.instances.find((i) => i.slug.toLowerCase() === params.slug!.toLowerCase());
  if (params.name) return manifest.instances.find((i) => i.name === params.name);
  return undefined;
}

export async function addModpack(modpack: ManifestType['instances'][number]) {
  const manifest = await readManifest();

  const byId = manifest.instances.find((i) => i.id === modpack.id);
  const bySlug = manifest.instances.find((i) => i.slug.toLowerCase() === modpack.slug.toLowerCase());
  const byName = manifest.instances.find((i) => i.name === modpack.name);

  if (byId) return { success: false as const, message: `ID "${modpack.id}" đã tồn tại.` };
  if (bySlug) return { success: false as const, message: `Slug "${modpack.slug}" đã tồn tại.` };
  if (byName) return { success: false as const, message: `Tên "${modpack.name}" đã tồn tại.` };

  manifest.instances.push(modpack);
  await writeManifest(manifest);
  return { success: true as const, message: 'Thêm modpack thành công.' };
}

export async function updateModpack(modpack: ManifestType['instances'][number]) {
  const manifest = await readManifest();
  const idx = manifest.instances.findIndex((i) => i.id === modpack.id);
  if (idx === -1) return { success: false as const, message: 'Modpack không tồn tại.' };

  manifest.instances[idx] = modpack;

  const dupSlug = manifest.instances.some((i, j) => j !== idx && i.slug.toLowerCase() === modpack.slug.toLowerCase());
  if (dupSlug) return { success: false as const, message: `Slug "${modpack.slug}" đã được dùng.` };

  const dupName = manifest.instances.some((i, j) => j !== idx && i.name === modpack.name);
  if (dupName) return { success: false as const, message: `Tên "${modpack.name}" đã được dùng.` };

  await writeManifest(manifest);
  return { success: true as const, message: 'Cập nhật modpack thành công.' };
}

export async function removeModpack(params: { id?: string; slug?: string; name?: string }) {
  const manifest = await readManifest();
  const idx = manifest.instances.findIndex(
    (i) => i.id === params.id || i.slug.toLowerCase() === params.slug?.toLowerCase() || i.name === params.name,
  );
  if (idx === -1) return { success: false as const, message: 'Modpack không tồn tại.' };

  manifest.instances.splice(idx, 1);
  await writeManifest(manifest);
  return { success: true as const, message: 'Xoá modpack thành công.' };
}

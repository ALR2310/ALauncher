import { InstanceMeta, InstanceType, ManifestType } from '@shared/launcher.type';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

type Mod = InstanceType['mods'][number];

const MANIFEST_PATH = path.join('manifest.json');
const INSTANCES_DIR = path.join('instances');

const instancePath = (slug: string) => path.join(INSTANCES_DIR, `${slug}.json`);

function ensureParentDirSync(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

async function readJSON<T>(file: string, fallback: T): Promise<T> {
  ensureParentDirSync(file);
  try {
    const txt = await fsp.readFile(file, 'utf-8');
    return JSON.parse(txt) as T;
  } catch (e: any) {
    if (e?.code === 'ENOENT') return fallback;
    try {
      await fsp.rename(file, file + `.corrupt-${Date.now()}`);
    } catch {}
    return fallback;
  }
}

async function writeJSONAtomic(file: string, data: unknown) {
  ensureParentDirSync(file);
  const tmp = file + '.tmp';
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
  await fsp.rename(tmp, file);
}

async function readManifest(): Promise<ManifestType> {
  const mf = await readJSON<ManifestType>(MANIFEST_PATH, { instances: [] });
  if (!Array.isArray(mf.instances)) return { instances: [] };
  return mf;
}

async function writeManifest(mf: ManifestType) {
  await writeJSONAtomic(MANIFEST_PATH, mf);
}

function metaFromInstance(inst: InstanceType): InstanceMeta {
  const { mods, ...meta } = inst;
  return meta;
}

function hasSlug(mf: ManifestType, slug: string, excludeSlug?: string) {
  return mf.instances.some((i) => {
    return i.slug === slug && i.slug !== excludeSlug;
  });
}

class InstanceService {
  async get(slug?: string) {
    if (slug) {
      const filePath = instancePath(slug);
      const full = await readJSON<InstanceType | null>(filePath, null as any);
      return full ?? null;
    } else {
      const manifest = await readManifest();
      return manifest.instances ?? [];
    }
  }

  async create(instance: InstanceMeta) {
    const slug = instance.slug;
    const filePath = instancePath(slug);

    try {
      await fsp.access(filePath, fs.constants.F_OK);
      return { success: false, message: 'Tên Modpack đã tồn tại.' };
    } catch {}

    const mf = await readManifest();
    if (hasSlug(mf, slug)) return { success: false, message: 'Tên Modpack đã tồn tại trong manifest.' };

    const full: InstanceType = { ...instance, slug, mods: [] };
    await writeJSONAtomic(filePath, full);

    const meta = metaFromInstance(full);
    mf.instances.push(meta);
    await writeManifest(mf);

    return { success: true, meta, filePath };
  }

  async update(currentSlug: string, instance: Partial<InstanceMeta>) {
    const curPath = instancePath(currentSlug);

    const full = await readJSON<InstanceType | null>(curPath, null as any);
    if (!full) return { success: false, message: 'Modpack không tồn tại.' };

    const mf = await readManifest();
    const idx = mf.instances.findIndex((i) => i.slug === currentSlug);
    if (idx < 0) return { success: false, message: 'Modpack không tồn tại trong manifest.' };

    const { id, ...rest } = instance;

    const nextMeta: InstanceMeta = { ...metaFromInstance(full), ...rest };
    if (rest.slug) nextMeta.slug = rest.slug;

    let nextPath = curPath;
    if (nextMeta.slug !== currentSlug) {
      if (hasSlug(mf, nextMeta.slug, currentSlug)) {
        return { success: false, message: 'Tên modpack đã tồn tại.' };
      }
      nextPath = instancePath(nextMeta.slug);
      try {
        await fsp.access(nextPath, fs.constants.F_OK);
        return { success: false, message: 'Tên modpack mới đã tồn tại.' };
      } catch {}
      ensureParentDirSync(nextPath);
      await fsp.rename(curPath, nextPath);
    }

    const updatedFull: InstanceType = { ...full, ...nextMeta, mods: full.mods ?? [] };
    await writeJSONAtomic(nextPath, updatedFull);

    mf.instances[idx] = { ...nextMeta, id: full.id };
    await writeManifest(mf);

    return { success: true, meta: nextMeta, filePath: nextPath };
  }

  async delete(slug: string) {
    const filePath = instancePath(slug);

    try {
      await fsp.rm(filePath, { force: true });
    } catch {}

    const mf = await readManifest();
    const idx = mf.instances.findIndex((i) => i.slug === slug);
    if (idx >= 0) {
      mf.instances.splice(idx, 1);
      await writeManifest(mf);
    }

    return { success: true, message: 'Modpack đã được xoá.' };
  }

  async addMods(slug: string, mods: Mod | Mod[]) {
    const filePath = instancePath(slug);
    const full = await readJSON<InstanceType | null>(filePath, null as any);
    if (!full) return { success: false, message: 'Modpack không tồn tại.' };

    const incoming = Array.isArray(mods) ? mods : [mods];
    const byId = new Map<string, Mod>();
    for (const m of full.mods ?? []) byId.set(m.id, m);
    for (const m of incoming) byId.set(m.id, m);

    const nextMods = Array.from(byId.values());
    const updated: InstanceType = { ...full, mods: nextMods };
    await writeJSONAtomic(filePath, updated);

    return { success: true, count: nextMods.length };
  }

  async removeMods(slug: string, ids: string | string[]) {
    const filePath = instancePath(slug);
    const full = await readJSON<InstanceType | null>(filePath, null as any);
    if (!full) return { success: false, message: 'Modpack không tồn tại.' };

    const toRemove = new Set(Array.isArray(ids) ? ids : [ids]);
    const nextMods = (full.mods ?? []).filter((m) => !toRemove.has(m.id));

    const updated: InstanceType = { ...full, mods: nextMods };
    await writeJSONAtomic(filePath, updated);

    return { success: true, count: nextMods.length };
  }
}

export const instanceService = new InstanceService();

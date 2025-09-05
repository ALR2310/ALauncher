import { loaderTypeToId } from '@shared/constants/launcher.constant';
import { Additional, Instance } from '@shared/schema/instance.schema';
import { formatToSlug } from '@shared/utils/general.utils';
import fs from 'fs';
import { mkdir, readdir, readFile, rename, rm, unlink, writeFile } from 'fs/promises';
import pLimit from 'p-limit';
import path from 'path';

import { Downloader } from '~s/libraries/minecraft-java-core/build/Index';
import { DownloadOptions } from '~s/libraries/minecraft-java-core/build/utils/Downloader';
import { BadRequestException, NotFoundException } from '~s/middlewares/exception';

import { curseForgeService } from '../curseforge/curseforge.service';
import { launcherService } from '../launcher/launcher.service';

class InstanceService {
  private instanceDir: string | null = null;

  async findAll() {
    await this.ensureInstanceDir();

    const dirs = await readdir(this.instanceDir!, { withFileTypes: true });
    const dirList = dirs.filter((d) => d.isDirectory());

    const limiter = pLimit(5);

    const instances = await Promise.all(
      dirList.map((dir) =>
        limiter(async () => {
          const instancePath = path.join(this.instanceDir!, dir.name, 'instance.json');
          try {
            const data = await readFile(instancePath, 'utf-8');
            return JSON.parse(data) as Instance;
          } catch (err) {
            console.warn(`An error occurred while reading instance ${dir.name}:`, err);
            return null;
          }
        }),
      ),
    );

    return instances.filter((i): i is Instance => i !== null);
  }

  async findOne(id: string) {
    if (!id) throw new NotFoundException('Instance ID is required');

    await this.ensureInstanceDir();

    const filePath = path.join(this.instanceDir!, id, 'instance.json');
    try {
      const data = await readFile(filePath, 'utf-8');
      return JSON.parse(data) as Instance;
    } catch (err) {
      throw new BadRequestException(`An error occurred while reading instance ${id}`);
    }
  }

  async create(instance: Instance) {
    await this.ensureInstanceDir();

    if (!instance.id) instance.id = formatToSlug(instance.name);

    const dirPath = path.join(this.instanceDir!, instance.id);
    const filePath = path.join(dirPath, 'instance.json');

    await mkdir(dirPath, { recursive: true });
    await writeFile(filePath, JSON.stringify(instance, null, 2), 'utf-8');
    return instance;
  }

  async update(id: string, instance: Partial<Instance>) {
    await this.ensureInstanceDir();

    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException('Instance not found');

    const updated: Instance = { ...existing, ...instance };
    const filePath = path.join(this.instanceDir!, id, 'instance.json');
    await writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  }

  async delete(id: string) {
    await this.ensureInstanceDir();

    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException('Instance not found');

    const dirPath = path.join(this.instanceDir!, id);
    await rm(dirPath, { recursive: true, force: true });
    return existing;
  }

  async addMod(id: string, modId: number) {
    const instance = await this.findOne(id);
    if (!instance) throw new NotFoundException('Instance not found');

    const existingMods = instance.mods || [];
    const modMap = new Map(existingMods.map((m) => [m.id, m]));

    const modsToDownload: Additional[] = [];

    const resolveMod = async (modId: number): Promise<Additional | null> => {
      if (modMap.has(modId)) {
        return modMap.get(modId)!;
      }

      const modFiles = await curseForgeService.getModFiles(
        modId,
        instance.version,
        loaderTypeToId[instance.loader.type],
      );

      if (!modFiles.data.length) return null;

      const file = modFiles.data[0];

      const newMod: Additional = {
        id: file.modId,
        name: file.displayName,
        fileName: file.fileName,
        fileUrl: file.downloadUrl,
        fileSize: file.fileLength,
        enabled: true,
        dependencies: [],
      };

      modMap.set(newMod.id, newMod);
      modsToDownload.push(newMod);

      if (file.dependencies?.length) {
        const deps = await Promise.all(
          file.dependencies
            .filter((dep: { relationType: number }) => dep.relationType === 3)
            .map(async (dep: { modId: number }) => {
              const depMod = await resolveMod(dep.modId);
              return depMod?.id ?? null;
            }),
        );

        newMod.dependencies = deps.filter((id): id is number => id !== null);
      }

      return newMod;
    };

    await resolveMod(modId);

    instance.mods = Array.from(modMap.values());
    await this.update(id, instance);

    return this.handleDownloadMod(id, modsToDownload);
  }

  async removeMod(id: string, modId: number) {
    const instance = await this.findOne(id);
    if (!instance) throw new NotFoundException('Instance not found');
    if (!instance.mods) return instance;

    const targetMod = instance.mods.find((m) => m.id === modId);
    if (!targetMod) throw new NotFoundException(`Mod ${modId} not found`);

    const config = await launcherService.getConfig();
    const modsDir = path.resolve(config.minecraft.gamedir, 'versions', id, 'mods');

    const normalPath = path.resolve(modsDir, targetMod.fileName);
    const disabledPath = normalPath + '.disabled';

    try {
      if (fs.existsSync(normalPath)) {
        await unlink(normalPath);
      } else if (fs.existsSync(disabledPath)) {
        await unlink(disabledPath);
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }

    instance.mods = instance.mods.filter((m) => m.id !== modId);

    return this.update(id, instance);
  }

  async canRemoveMod(id: string, modId: number) {
    const instance = await this.findOne(id);
    if (!instance) throw new NotFoundException('Instance not found');
    if (!instance.mods) {
      return { success: false, message: 'Instance has no mods' };
    }

    const targetMod = instance.mods.find((m) => m.id === modId);
    if (!targetMod) {
      return { success: false, message: `Mod ${modId} not found` };
    }

    const dependents = instance.mods
      .filter((m) => m.id !== modId && m.dependencies?.includes(modId))
      .map((m) => m.name);

    if (dependents.length > 0) {
      return {
        success: false,
        message: 'This mod cannot be removed because other mods depend on it',
        data: { dependents },
      };
    }

    return { success: true, message: 'Safe to remove', data: { dependents } };
  }

  async toggleMods(id: string, modIds: number[], enabled?: boolean) {
    const instance = await this.findOne(id);
    if (!instance) throw new NotFoundException('Instance not found');
    if (!instance.mods || !modIds.length) return instance;

    const config = await launcherService.getConfig();
    const modsDir = path.resolve(config.minecraft.gamedir, 'versions', id, 'mods');

    const toggleSet = new Set(modIds);

    instance.mods = await Promise.all(
      instance.mods.map(async (mod) => {
        if (!toggleSet.has(mod.id)) return mod;

        const shouldEnable = enabled ?? !mod.enabled;

        const currentPath = path.resolve(modsDir, shouldEnable ? mod.fileName + '.disabled' : mod.fileName);
        const targetPath = path.resolve(modsDir, shouldEnable ? mod.fileName : mod.fileName + '.disabled');

        try {
          if (fs.existsSync(currentPath)) {
            await rename(currentPath, targetPath);
          }
        } catch (err) {
          console.error(`Failed to rename mod file ${mod.fileName}:`, err);
        }

        return { ...mod, enabled: shouldEnable };
      }),
    );

    return this.update(id, instance);
  }

  private async ensureInstanceDir() {
    if (!this.instanceDir) {
      const config = await launcherService.getConfig();
      this.instanceDir = path.resolve(config.minecraft.gamedir, 'versions');
    }
    await mkdir(this.instanceDir, { recursive: true });
  }

  private async handleDownloadMod(id: string, mods: Additional[]) {
    if (!mods.length) throw new BadRequestException('No mods to download');

    const config = await launcherService.getConfig();
    const modsDir = path.resolve(config.minecraft.gamedir, 'versions', id, 'mods');
    await mkdir(modsDir, { recursive: true });

    const results = await Promise.all(
      mods.map(async (mod) => {
        const modPath = path.resolve(modsDir, mod.fileName);

        let needDownload = true;
        if (fs.existsSync(modPath)) {
          try {
            const stat = await fs.promises.stat(modPath);
            if (stat.size === mod.fileSize) {
              needDownload = false;
            }
          } catch {
            needDownload = true;
          }
        }

        if (needDownload) {
          return {
            url: mod.fileUrl,
            path: modPath,
            folder: modsDir,
            length: mod.fileSize,
            type: 'mod',
          } as DownloadOptions;
        }
        return null;
      }),
    );

    const filesToDownload = results.filter((f): f is DownloadOptions => f !== null);

    if (filesToDownload.length === 0) {
      return null;
    }

    const downloader = new Downloader();
    const totalSize = filesToDownload.reduce((acc, f) => acc + (f.length ?? 0), 0);

    downloader.downloadFileMultiple(filesToDownload, totalSize, config.download_multiple);

    return downloader;
  }
}

export const instanceService = new InstanceService();

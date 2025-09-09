import { Instance } from '@shared/schemas/instance.schema';
import { formatToSlug } from '@shared/utils/general.utils';
import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises';
import pLimit from 'p-limit';
import path from 'path';

import { BadRequestException, NotFoundException } from '~s/middlewares/exception';

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

  private async ensureInstanceDir() {
    if (!this.instanceDir) {
      const config = await launcherService.getConfig();
      this.instanceDir = path.resolve(config.minecraft.gamedir, 'versions');
    }
    await mkdir(this.instanceDir, { recursive: true });
  }
}

export const instanceService = new InstanceService();

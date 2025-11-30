import { InstanceContentDto, InstanceFolderTreeDto } from '@shared/dtos/instance.dto';
import { InstanceContentEnum } from '@shared/enums/general.enum';
import { spawn } from 'child_process';
import { readdir, stat } from 'fs/promises';
import path from 'path';

import { BadRequestException } from '~/common/filters/exception.filter';

import { instanceService } from './instance.service';

const excludedDirs = new Set([
  'server-resource-packs',
  'waypoints',
  'saves',
  'downloads',
  'data',
  'journeymap',
  'screenshots',
  'logs',
  'crash-reports',
  'natives',
]);

const excludedExts = new Set(['.tmp', '.log']);

export const instanceFolderService = new (class InstanceFolderService {
  async openFolder(id: string): Promise<{ message: string }> {
    try {
      const instanceDir = await instanceService.getDir(id);

      const platform = process.platform;
      let command: string;
      let args: string[] = [];

      if (platform === 'win32') {
        command = 'explorer';
        args = [instanceDir.replace(/\//g, '\\')];
      } else if (platform === 'darwin') {
        command = 'open';
        args = [instanceDir];
      } else {
        command = 'xdg-open';
        args = [instanceDir];
      }

      const child = spawn(command, args, { detached: true, stdio: 'ignore' });
      child.unref();

      return { message: 'Folder opened successfully' };
    } catch (err: any) {
      throw new BadRequestException(`Failed to open folder: ${err.message}`);
    }
  }

  async getFolderTree(id: string): Promise<InstanceFolderTreeDto> {
    const instance = await instanceService.findOne(id);
    const instanceDir = await instanceService.getDir(id);

    const stats = await stat(instanceDir).catch(() => {
      throw new BadRequestException('Instance folder does not exist');
    });

    if (!stats.isDirectory()) {
      throw new BadRequestException('Instance folder is not a directory');
    }

    const knownFiles = new Map<string, number>();

    const registerKnown = (items?: InstanceContentDto[] | null, folder?: string) => {
      if (!items) return;
      for (const item of items) {
        if (!item.fileName || !item.fileLength) continue;
        const filePath = path.resolve(instanceDir, folder ?? '', item.fileName);
        knownFiles.set(filePath.toLowerCase(), Number(item.fileLength));
      }
    };

    registerKnown(instance.mods, InstanceContentEnum.Mods);
    registerKnown(instance.resourcepacks, InstanceContentEnum.ResourcePacks);
    registerKnown(instance.shaderpacks, InstanceContentEnum.ShaderPacks);

    const buildTree = async (dirPath: string): Promise<InstanceFolderTreeDto> => {
      const dirents = await readdir(dirPath, { withFileTypes: true });

      dirents.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });

      const children = await Promise.all(
        dirents
          .filter((d) => {
            const name = d.name.toLowerCase();
            const ext = path.extname(name);
            return !name.startsWith('.') && !excludedDirs.has(name) && !excludedExts.has(ext);
          })
          .map(async (dirent) => {
            const res = path.resolve(dirPath, dirent.name);
            if (dirent.isDirectory()) {
              return await buildTree(res);
            } else {
              const relative = path.relative(instanceDir, res);
              const topFolder = relative.split(path.sep)[0];

              if (
                [InstanceContentEnum.Mods, InstanceContentEnum.ResourcePacks, InstanceContentEnum.ShaderPacks].includes(
                  topFolder as InstanceContentEnum,
                )
              ) {
                const fileStat = await stat(res).catch(() => null);
                const knownLength = knownFiles.get(res.toLowerCase());

                if (knownLength && fileStat?.size === knownLength) return null;
              }

              return {
                name: dirent.name,
                path: res,
                type: 'file' as const,
              };
            }
          }),
      ).then((results) => results.filter((r): r is InstanceFolderTreeDto => r !== null));

      return {
        name: path.basename(dirPath),
        path: dirPath,
        type: 'directory' as const,
        children,
      };
    };

    return await buildTree(instanceDir);
  }
})();

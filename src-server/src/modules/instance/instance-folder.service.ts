import { spawn } from 'child_process';

import { BadRequestException } from '~/common/filters/exception.filter';

import { instanceService } from './instance.service';

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

  async getFolderTree(id: string): Promise<any> {
    return id;
  }
})();

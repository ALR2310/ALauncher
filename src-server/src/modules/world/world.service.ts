import { WorldDto, WorldsQueryDto } from '@shared/dtos/world.dto';
import fs from 'fs';
import pLimit from 'p-limit';
import path from 'path';
import { parse } from 'prismarine-nbt';

import { configService } from '../config/config.service';
import { instanceService } from '../instance/instance.service';

class WorldService {
  async findAll(payload: WorldsQueryDto): Promise<WorldDto[]> {
    const { instanceId } = payload;

    const config = await configService.getConfig();
    const baseDir = config.minecraft.gamedir;
    let worldPath = path.resolve(baseDir, 'saves');

    if (instanceId) worldPath = await instanceService.getPathByContentType(instanceId, 'worlds');

    const dirs = fs.readdirSync(worldPath, { withFileTypes: true });

    const limit = pLimit(5);

    const tasks = dirs
      .filter((dir) => dir.isDirectory())
      .map((dir) =>
        limit(async () => {
          const levelDatPath = path.join(worldPath, dir.name, 'level.dat');
          try {
            const buffer = fs.readFileSync(levelDatPath);
            const { parsed } = await parse(buffer);

            const data: any = parsed.value.Data?.value;
            if (!data || typeof data !== 'object' || Array.isArray(data)) {
              console.warn(`World ${dir.name} does not have Data property in level.dat or Data is not an object`);
              return null;
            }

            const iconPath = path.join(worldPath, dir.name, 'icon.png');
            let icon: string | null = null;

            if (fs.existsSync(iconPath)) {
              const buf = fs.readFileSync(iconPath);
              icon = `data:image/png;base64,${buf.toString('base64')}`;
            }

            const result: WorldDto = {
              name: data.LevelName?.value ?? 'Unknown',
              folderName: dir.name,
              version: data.Version?.value?.Name?.value ?? 'Unknown',
              icon,
              gameType: data.GameType?.value ?? null,
              instanceId: instanceId ?? null,
              path: path.join(worldPath, dir.name),
            };

            return result;
          } catch (err) {
            console.warn(`Failed to read or parse level.dat for world ${dir.name}:`, err);
            return null;
          }
        }),
      );

    const worlds = (await Promise.all(tasks)).filter((w): w is WorldDto => w !== null);

    return worlds;
  }
}

export const worldService = new WorldService();

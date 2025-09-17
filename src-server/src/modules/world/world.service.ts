import { WorldDto, WorldsQueryDto } from '@shared/dtos/world.dto';
import fs from 'fs';
import path from 'path';
import { parse } from 'prismarine-nbt';

import { configService } from '../config/config.service';
import { instanceService } from '../instance/instance.service';

function parseNbtLong(val: unknown): string | null {
  if (Array.isArray(val) && val.length === 2) {
    const [a, b] = val as [number, number];
    const n1 = (BigInt(b) << 32n) | BigInt(a >>> 0);
    const n2 = (BigInt(a) << 32n) | BigInt(b >>> 0);
    return Math.abs(Number(n1)) > Math.abs(Number(n2)) ? n1.toString() : n2.toString();
  }
  return null;
}

class WorldService {
  async findAll(payload: WorldsQueryDto): Promise<WorldDto[]> {
    const { instanceId } = payload;

    const config = await configService.getConfig();
    const baseDir = config.minecraft.gamedir;
    let worldPath = path.resolve(baseDir, 'saves');

    if (instanceId) worldPath = await instanceService.getPathByContentType(instanceId, 'worlds');

    const dirs = fs.readdirSync(worldPath, { withFileTypes: true });

    const worlds: any[] = [];

    for (const dir of dirs) {
      if (!dir.isDirectory()) continue;

      const levelDatPath = path.join(worldPath, dir.name, 'level.dat');
      try {
        const buffer = fs.readFileSync(levelDatPath);
        const { parsed } = await parse(buffer);

        const data: any = parsed.value.Data?.value;
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          console.warn(`World ${dir.name} does not have Data property in level.dat or Data is not an object`);
          continue;
        }

        const iconPath = path.join(worldPath, dir.name, 'icon.png');
        const icon = fs.existsSync(iconPath) ? iconPath : null;

        const rawSeed = data.WorldGenSettings?.value?.seed?.value;
        const seed = parseNbtLong(rawSeed) ?? rawSeed;

        worlds.push({
          name: data.LevelName?.value ?? dir.name,
          version: data.Version?.value?.Name?.value ?? 'Unknown',
          seed,
          icon,
          gameType: data.GameType?.value ?? null,
          instanceId: instanceId ?? null,
          path: path.join(worldPath, dir.name),
        });
      } catch (err) {
        console.warn(`Failed to read or parse level.dat for world ${dir.name}:`, err);
      }
    }

    return worlds;
  }
}

export const worldService = new WorldService();

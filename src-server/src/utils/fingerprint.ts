import { open } from 'fs/promises';
import pLimit from 'p-limit';

function isWhitespace(byte: number) {
  return byte === 9 || byte === 10 || byte === 13 || byte === 32;
}

async function computeFingerprintStream(filePath: string): Promise<number> {
  const multiplex = 1540483477 >>> 0;
  const CHUNK_SIZE = 64 * 1024; // 64KB
  const buf = Buffer.alloc(CHUNK_SIZE);

  let normalizedLength = 0;
  {
    const fh = await open(filePath, 'r');
    try {
      while (true) {
        const { bytesRead } = await fh.read(buf, 0, CHUNK_SIZE, null);
        if (bytesRead === 0) break;
        for (let i = 0; i < bytesRead; i++) {
          if (!isWhitespace(buf[i])) normalizedLength++;
        }
      }
    } finally {
      await fh.close();
    }
  }

  let hash = 1 ^ normalizedLength;
  let acc = 0;
  let bitOffset = 0;

  {
    const fh = await open(filePath, 'r');
    try {
      while (true) {
        const { bytesRead } = await fh.read(buf, 0, CHUNK_SIZE, null);
        if (bytesRead === 0) break;

        for (let i = 0; i < bytesRead; i++) {
          const b = buf[i];
          if (isWhitespace(b)) continue;

          acc |= b << bitOffset;
          bitOffset += 8;

          if (bitOffset === 32) {
            const k = Math.imul(acc, multiplex);
            const m = Math.imul(k ^ (k >>> 24), multiplex);
            hash = Math.imul(hash, multiplex) ^ m;
            acc = 0;
            bitOffset = 0;
          }
        }
      }
    } finally {
      await fh.close();
    }
  }

  if (bitOffset > 0) {
    hash = Math.imul(hash ^ acc, multiplex);
  }

  const h = Math.imul(hash ^ (hash >>> 13), multiplex);
  return (h ^ (h >>> 15)) >>> 0;
}

export async function getFingerprint(filePath: string) {
  try {
    return await computeFingerprintStream(filePath);
  } catch (err: any) {
    console.error(`Cannot resolve file: ${err.message}`);
    return null;
  }
}

export async function getFingerprints(filePaths: string[], concurrent = 10) {
  const limit = pLimit(concurrent);
  const results = await Promise.all(filePaths.map((filePath) => limit(() => getFingerprint(filePath))));
  return results.filter((fp): fp is number => typeof fp === 'number');
}

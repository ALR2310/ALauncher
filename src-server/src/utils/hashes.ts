import { createHash } from 'crypto';
import { createReadStream } from 'fs';

export function getHash(filePath: string, algorithm = 'sha1'): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash(algorithm);
    const stream = createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => {
      const digest = hash.digest('hex');
      resolve(digest);
    });
    stream.on('error', (err) => reject(err));
  });
}

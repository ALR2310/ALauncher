import 'dotenv/config';

import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';

const repo = process.env.GITHUB_REPOSITORY!;
const token = process.env.GITHUB_TOKEN!;

const owner = repo.split('/')[0];
const repoName = repo.split('/')[1];

const octokit = new Octokit({ auth: token });

// #region Helper function
async function retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000) {
  try {
    return await fn();
  } catch (err: any) {
    const isRetryable =
      err.status === 500 ||
      err.status === 502 ||
      err.status === 503 ||
      err.status === 504 ||
      err.code === 'EPIPE' ||
      err.message?.includes('fetch failed') ||
      err.message?.includes('other side closed');

    if (retries > 0 && isRetryable) {
      console.warn(`[retry] ${err.message || err} - retrying in ${delayMs}ms... (${retries} left)`);
      await new Promise((r) => setTimeout(r, delayMs));
      return retry(fn, retries - 1, delayMs);
    }

    throw err;
  }
}

async function getRelease() {
  try {
    const res = await retry(() =>
      octokit.rest.repos.getLatestRelease({
        owner,
        repo: repoName,
      }),
    );
    return res.data;
  } catch (error: any) {
    if (error.status !== 404) throw error;

    const res = await retry(() =>
      octokit.rest.repos.listReleases({
        owner,
        repo: repoName,
        per_page: 1,
      }),
    );
    return res.data[0] ?? null;
  }
}
// #endregion

async function buildRelease(version: string) {
  const tauriConfPath = path.join('src-tauri', 'tauri.conf.json');
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));

  tauriConf.version = version;

  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2));

  execSync('npm run build', { stdio: 'inherit' });

  const bundleDir = path.join('src-tauri', 'target', 'release', 'bundle', 'nsis');

  const files = fs.readdirSync(bundleDir);
  const exeFile = files.find((f) => f.endsWith('.exe'));
  const signature = fs.readFileSync(path.resolve(bundleDir, `${exeFile}.sig`), 'utf-8').trim();

  const latestInfo = {
    version,
    notes: `Release ${version}`,
    pub_date: new Date().toISOString(),
    platforms: {
      'windows-x86_64': {
        signature,
        url: `https://github.com/${repo}/releases/latest/download/${exeFile}`,
      },
    },
  };

  fs.writeFileSync(path.resolve(bundleDir, 'latest.json'), JSON.stringify(latestInfo, null, 2));

  return {
    fileDir: bundleDir,
    fileName: exeFile!,
    infoPath: path.resolve(bundleDir, 'latest.json'),
  };
}

async function uploadRelease(version: string, fileDir: string, fileName: string, infoPath: string) {
  const fileSize = fs.statSync(path.join(fileDir, fileName)).size;
  const fileData = fs.readFileSync(path.join(fileDir, fileName));
  const infoData = fs.readFileSync(infoPath);

  const release = await retry(() =>
    octokit.rest.repos.createRelease({
      owner,
      repo: repoName,
      tag_name: version,
      name: `ALauncher-${version}`,
      body: `Release ${version}`,
      draft: false,
      prerelease: false,
    }),
  );

  await retry(() =>
    octokit.rest.repos.uploadReleaseAsset({
      owner,
      repo: repoName,
      release_id: release.data.id,
      name: fileName,
      data: fileData as any,
      headers: {
        'content-type': 'application/octet-stream',
        'content-length': fileSize,
      },
    }),
  );

  await retry(() =>
    octokit.rest.repos.uploadReleaseAsset({
      owner,
      repo: repoName,
      release_id: release.data.id,
      name: 'latest.json',
      data: infoData as any,
      headers: {
        'content-type': 'application/json',
        'content-length': infoData.length,
      },
    }),
  );
}

(async () => {
  const currentVersion: string = JSON.parse(fs.readFileSync('package.json', 'utf-8')).version;
  const latestVersion: string = ((await getRelease()) ?? { tag_name: '0.0.0' }).tag_name;

  if (semver.gt(currentVersion, latestVersion)) {
    try {
      const { fileDir, fileName, infoPath } = await buildRelease(currentVersion);
      await uploadRelease(currentVersion, fileDir, fileName, infoPath);
    } catch (err) {
      console.error('Release failed:', err);
      process.exit(1);
    }
  } else {
    console.log(`Skip release: ${currentVersion} <= ${latestVersion}`);
  }
})();

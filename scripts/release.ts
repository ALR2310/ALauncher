import 'dotenv/config';

import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';

const repo = process.env.GITHUB_REPOSITORY!;
const token = process.env.GITHUB_TOKEN!;
const [owner, repoName] = repo.split('/');

const octokit = new Octokit({ auth: token });

interface BuildResult {
  fileDir: string;
  exeFile: string;
  sigFile: string;
  latestJson: string;
}

async function retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const retryable =
      err.status === 500 ||
      err.status === 502 ||
      err.status === 503 ||
      err.status === 504 ||
      err.code === 'EPIPE' ||
      err.message?.includes('fetch failed') ||
      err.message?.includes('other side closed');

    if (retries > 0 && retryable) {
      console.warn(`[retry] ${err.message || err} - retrying in ${delayMs}ms... (${retries} left)`);
      await new Promise((r) => setTimeout(r, delayMs));
      return retry(fn, retries - 1, delayMs);
    }
    throw err;
  }
}

async function getLatestRelease() {
  try {
    const res = await retry(() => octokit.rest.repos.getLatestRelease({ owner, repo: repoName }));
    return res.data;
  } catch (err: any) {
    if (err.status !== 404) throw err;
    const res = await retry(() => octokit.rest.repos.listReleases({ owner, repo: repoName, per_page: 1 }));
    return res.data[0] ?? null;
  }
}

async function buildRelease(version: string): Promise<BuildResult> {
  const bundleDir = path.join('src-tauri', 'target', 'release', 'bundle', 'nsis');
  const tauriConfPath = path.join('src-tauri', 'tauri.conf.json');

  // update version
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
  tauriConf.version = version;
  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2));

  // clean old bundle + build
  fs.removeSync(bundleDir);
  const env = {
    ...process.env,
    TAURI_SIGNING_PRIVATE_KEY: process.env.TAURI_SIGNING_PRIVATE_KEY,
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD,
  };

  execSync('npm run build:server', { stdio: 'inherit' });
  execSync('npm run tauri build', { stdio: 'inherit', env });

  // find files
  const files = fs.readdirSync(bundleDir);
  const exeFile = files.find((f) => f.endsWith('.exe'));
  if (!exeFile) throw new Error('No .exe file found in bundle directory');

  const sigFile = `${exeFile}.sig`;
  const signature = fs.readFileSync(path.join(bundleDir, sigFile), 'utf-8').trim();

  // create latest.json
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
  const latestJson = path.join(bundleDir, 'latest.json');
  fs.writeFileSync(latestJson, JSON.stringify(latestInfo, null, 2));

  return { fileDir: bundleDir, exeFile, sigFile, latestJson };
}

async function uploadRelease(version: string, build: BuildResult) {
  const release = await retry(() =>
    octokit.rest.repos.createRelease({
      owner,
      repo: repoName,
      tag_name: `v${version}`,
      name: `ALauncher ${version}`,
      body: `Release ${version}`,
      draft: false,
      prerelease: false,
    }),
  );

  const upload = async (filePath: string, name: string, contentType: string) => {
    const data = fs.readFileSync(filePath);
    await retry(() =>
      octokit.rest.repos.uploadReleaseAsset({
        owner,
        repo: repoName,
        release_id: release.data.id,
        name,
        data: data as any,
        headers: { 'content-type': contentType, 'content-length': data.length },
      }),
    );
    console.log(`📦 Uploaded ${name}`);
  };

  await Promise.all([
    upload(path.join(build.fileDir, build.exeFile), build.exeFile, 'application/vnd.microsoft.portable-executable'),
    upload(path.join(build.fileDir, build.sigFile), build.sigFile, 'application/octet-stream'),
    upload(build.latestJson, 'latest.json', 'application/json'),
  ]);
}

(async () => {
  const currentVersion: string = JSON.parse(fs.readFileSync('package.json', 'utf-8')).version;
  const latestVersion: string = ((await getLatestRelease()) ?? { tag_name: '0.0.0' }).tag_name.replace(/^v/, '');

  if (semver.gt(currentVersion, latestVersion)) {
    try {
      const build = await buildRelease(currentVersion);
      await uploadRelease(currentVersion, build);
    } catch (err) {
      console.error('❌ Release failed:', err);
      process.exit(1);
    }
  } else {
    console.log(`⏭ Skip release: ${currentVersion} <= ${latestVersion}`);
  }
})();

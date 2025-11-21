import 'dotenv/config';

import { Octokit } from '@octokit/rest';
import axios from 'axios';
import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'fs/promises';
import path from 'path';
import * as ResEdit from 'resedit';
import semver from 'semver';

import pkg from '../../package.json' assert { type: 'json' };
import { ENV } from '../../shared/enums/general.enum';
import { Zipper } from '../../src-server/src/utils/zipper.utils';
import tauriPkg from '../../src-tauri/tauri.conf.json' assert { type: 'json' };

const repo = process.env.GITHUB_REPOSITORY!;
const token = process.env.GITHUB_TOKEN!;
const [owner, repoName] = repo.split('/');
const githubSha = process.env.GITHUB_SHA ?? 'main';
const gemini_api_key = process.env.GEMINI_API_KEY!;
const octokit = new Octokit({ auth: token });

//================= Helper method =================//

async function gemini(prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

  const res = await axios.post(
    url,
    { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': gemini_api_key,
      },
    },
  );

  return res.data.candidates[0].content.parts[0].text;
}

async function prepareNodeRuntime() {
  await mkdir('dist', { recursive: true });

  const iconPath = path.resolve('src-client/src/assets/images/icon.ico');
  const iconFile = ResEdit.Data.IconFile.from(await readFile(iconPath));

  const exeData = await readFile(process.execPath);
  const exe = ResEdit.NtExecutable.from(exeData, { ignoreCert: true });
  const res = ResEdit.NtExecutableResource.from(exe);

  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries,
    1,
    1033,
    iconFile.icons.map((icon) => icon.data),
  );

  res.outputResource(exe);
  const modifiedExe = exe.generate();
  await writeFile('dist/runtime.bin', Buffer.from(modifiedExe));
}

async function getAllFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const statResult = await stat(fullPath);

    if (statResult.isDirectory()) {
      const subFiles = await getAllFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

export async function compress(srcDir: string, outFile: string) {
  const base = path.basename(outFile);
  const allFiles: string[] = [];

  // Đọc tất cả files trong thư mục
  const entries = readdirSync(srcDir);
  for (const entry of entries) {
    if (entry === base) continue;
    const full = path.join(srcDir, entry);
    const statResult = statSync(full);

    if (statResult.isDirectory()) {
      const files = await getAllFiles(full, srcDir);
      allFiles.push(...files);
    } else {
      allFiles.push(full);
    }
  }

  // Sử dụng Zipper để nén
  const zipper = new Zipper();
  await zipper.compress(allFiles, outFile);
}

//================= Github method =================//

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

async function getFirstCommitSha() {
  const commits = await octokit.paginate(octokit.rest.repos.listCommits, {
    owner,
    repo: repoName,
    per_page: 100,
  });
  return commits[commits.length - 1]?.sha;
}

async function getLatestCommitSha() {
  const latestCommit = await retry(() =>
    octokit.rest.repos.getCommit({
      owner,
      repo: repoName,
      ref: githubSha,
    }),
  );
  return latestCommit.data.sha;
}

async function getBaseSha(latestVersion: string): Promise<string> {
  if (latestVersion === '0.0.0') {
    return await getFirstCommitSha();
  } else {
    const tag = `v${latestVersion}`;
    const res = await octokit.rest.git.getRef({
      owner,
      repo: repoName,
      ref: `tags/${tag}`,
    });
    return res.data.object.sha;
  }
}

//=================== Main method =================//

async function generateManifest(dataVersion: string, coreVersion: string) {
  const manifest = {
    dataVersion,
    coreVersion,
  };

  await writeFile(path.join('dist', 'manifest.json'), JSON.stringify(manifest, null, 2));
}

async function generateChangelog(latestVersion: string) {
  const headSha = await getLatestCommitSha();
  const baseSha = await getBaseSha(latestVersion);

  const comparison = await retry(() =>
    octokit.rest.repos.compareCommits({
      owner,
      repo: repoName,
      base: baseSha,
      head: headSha,
    }),
  );

  const changelogText = comparison.data.commits
    .map((c) => ({
      message: c.commit.message,
    }))
    .map((c) => `- ${c.message}`)
    .join('\n');

  const template = await readFile(path.join('scripts', 'templates', 'release.template.md'), 'utf-8');
  const prompt = `${template} ${changelogText}`;

  return await gemini(prompt);
}

async function uploadRelease(version: string, changelogs: string) {
  const release = await retry(() =>
    octokit.rest.repos.createRelease({
      owner,
      repo: repoName,
      tag_name: `v${version}`,
      name: `ALauncher ${version}`,
      body: changelogs,
      draft: false,
      prerelease: false,
    }),
  );

  const upload = async (filePath: string, name: string, contentType: string) => {
    const data = await readFile(filePath);
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
    console.log(`Uploaded ${name}`);
  };

  const bundleDir = path.resolve('src-tauri', 'target', 'release', 'bundle', 'nsis');
  const files = await readdir(bundleDir);
  const exeFile = files.find((f) => f.endsWith('-setup.exe'));

  if (!exeFile) throw new Error('No .exe file found in bundle directory');

  const filePath = path.join(bundleDir, exeFile);

  await upload('dist/Update.zip', 'Update.zip', 'application/zip');
  await upload('dist/manifest.json', 'manifest.json', 'application/json');
  await upload(filePath, `ALauncher_${version}_x64-setup.exe`, 'application/vnd.microsoft.portable-executable');
}

(async () => {
  const isDev = process.env.NODE_ENV === ENV.Development;

  const currentVersion = pkg.version;
  const latestVersion = ((await getLatestRelease()) ?? { tag_name: '0.0.0' }).tag_name.replace(/^v/, '');

  if (semver.gt(currentVersion, latestVersion)) {
    try {
      // Build server & client
      execSync('yarn build', { stdio: 'inherit' });

      // Prepare Node.js runtime
      await prepareNodeRuntime();

      // Clean up stats files
      await rm('dist/stats.html', { force: true }).catch(() => {});

      // Build tauri app
      execSync('yarn tauri build', { stdio: 'inherit' });

      // Compress main files
      await rm('dist/runtime.bin', { force: true }).catch(() => {});
      await compress('dist', 'dist/Update.zip');
      await generateManifest(pkg.version, tauriPkg.version);

      if (!isDev) {
        const changelogs = await generateChangelog(latestVersion);
        await uploadRelease(currentVersion, changelogs);
      }
    } catch (err: any) {
      console.error(`Failed to prepare and build: ${err.message}`);
      process.exit(1);
    }
  } else {
    console.log(`⏭ Skip release: ${currentVersion} <= ${latestVersion}`);
  }
})();

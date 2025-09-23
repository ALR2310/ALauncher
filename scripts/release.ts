import 'dotenv/config';

import { Octokit } from '@octokit/rest';
import axios from 'axios';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';

const repo = process.env.GITHUB_REPOSITORY!;
const token = process.env.GITHUB_TOKEN!;
const [owner, repoName] = repo.split('/');
const githubSha = process.env.GITHUB_SHA ?? 'main';
const gemini_api_key = process.env.GEMINI_API_KEY!;
const octokit = new Octokit({ auth: token });

interface BuildResult {
  fileDir: string;
  exeFile: string;
}

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

  const template = fs.readFileSync(path.resolve(__dirname, 'release.template.md'), 'utf-8');
  const prompt = `
You are a release notes generator.

# Context
Here is the changelog text:
${changelogText}

# Instruction
Please summarize and rewrite the changelog into professional release notes 
following exactly this template:

${template}`;

  return await gemini(prompt);
}

async function buildRelease(version: string): Promise<BuildResult> {
  const bundleDir = path.join('src-tauri', 'target', 'release', 'bundle', 'nsis');
  const tauriConfPath = path.join('src-tauri', 'tauri.conf.json');

  // update version
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
  tauriConf.version = version;
  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2));

  // build server
  execSync('yarn build:server', { stdio: 'inherit' });

  // build updater
  execSync('cd src-tauri && cargo build --release --bin updater', { stdio: 'inherit' });
  fs.copyFileSync(
    path.join('src-tauri', 'target', 'release', 'updater.exe'),
    path.join('src-tauri', 'binaries', 'updater-x86_64-pc-windows-msvc.exe'),
  );

  // clean old bundle + build tauri
  fs.removeSync(bundleDir);
  execSync('yarn tauri build', { stdio: 'inherit' });

  // find files
  const files = fs.readdirSync(bundleDir);
  const exeFile = files.find((f) => f.endsWith('.exe'));
  if (!exeFile) throw new Error('No .exe file found in bundle directory');

  return { fileDir: bundleDir, exeFile };
}

async function uploadRelease(version: string, build: BuildResult, changelogs: string) {
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

  await upload(path.join(build.fileDir, build.exeFile), build.exeFile, 'application/vnd.microsoft.portable-executable');
}

(async () => {
  const currentVersion: string = JSON.parse(fs.readFileSync('package.json', 'utf-8')).version;
  const latestVersion: string = ((await getLatestRelease()) ?? { tag_name: '0.0.0' }).tag_name.replace(/^v/, '');

  if (semver.gt(currentVersion, latestVersion)) {
    try {
      const build = await buildRelease(currentVersion);

      const changelogs = await generateChangelog(latestVersion);

      await uploadRelease(currentVersion, build, changelogs);
    } catch (err) {
      console.error('❌ Release failed:', err);
      process.exit(1);
    }
  } else {
    console.log(`⏭ Skip release: ${currentVersion} <= ${latestVersion}`);
  }
})();

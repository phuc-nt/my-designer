#!/usr/bin/env node
// my-designer bootstrap: one command to a working local design studio that a
// coding agent drives through the CLI and a human reviews in the browser.
//
//   node bootstrap.mjs                      # full setup, idempotent
//   node bootstrap.mjs --status             # report only, change nothing
//   node bootstrap.mjs --stop               # stop the server this kit started
//   node bootstrap.mjs --port 8790          # first run only: choose the port
//
// There is no account: the server runs in local single-user mode, and every
// request from this machine is the owner. Writes .env.local and .local/
// (both gitignored).

import { randomBytes } from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { access, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';

const run = promisify(execFile);
const root = resolve(import.meta.dirname);
const envFile = join(root, '.env.local');
const localDir = join(root, '.local');
const pidFile = join(localDir, 'server.pid');

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const statusOnly = args.includes('--status');
const stopOnly = args.includes('--stop');

const exists = async (path) => access(path).then(() => true, () => false);
const log = (message) => console.log(message);
const step = (message) => console.log(`\n\x1b[1m${message}\x1b[0m`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- environment -----------------------------------------------------------

async function readEnv() {
  if (!(await exists(envFile))) return null;
  const entries = {};
  for (const line of (await readFile(envFile, 'utf8')).split('\n')) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (match) entries[match[1]] = match[2];
  }
  return entries;
}

async function ensureEnv() {
  const existing = await readEnv();
  if (existing?.ENCRYPTION_KEY) {
    log('  .env.local present — keeping ENCRYPTION_KEY (rotating it would strand stored provider keys)');
    // Older .env.local files predate local mode; add the two lines it needs, never remove anything.
    const missing = Object.entries({ LOCAL_USER: 'You', HOST: '127.0.0.1' }).filter(([key]) => !(key in existing));
    if (missing.length) {
      await writeFile(envFile, `${(await readFile(envFile, 'utf8')).replace(/\n*$/, '\n')}${missing.map(([k, v]) => `${k}=${v}`).join('\n')}\n`);
      log(`  added ${missing.map(([k]) => k).join(', ')} to .env.local (local single-user mode)`);
      return await readEnv();
    }
    return existing;
  }
  const port = flag('--port') ?? existing?.PORT ?? '8787';
  await writeFile(envFile, [
    '# my-designer local config. Gitignored. The server is started by bootstrap.mjs with:',
    '#   node --env-file=.env.local --import tsx server/node.ts',
    '',
    `ENCRYPTION_KEY=${randomBytes(32).toString('base64')}`,
    `PORT=${port}`,
    'HOST=127.0.0.1',
    `APP_URL=http://localhost:${port}`,
    'DATA_DIR=./data',
    '',
    '# Local single-user mode: every request from this machine is this person.',
    '# The server refuses to start with LOCAL_USER on a non-loopback HOST.',
    'LOCAL_USER=You',
    'ALLOW_REGISTRATION=false',
    'COMMUNITY_ENABLED=false',
    '',
  ].join('\n'));
  log(`  wrote .env.local (port ${port}) with a fresh ENCRYPTION_KEY`);
  return await readEnv();
}

// --- dependencies and build -------------------------------------------------

async function ensureDeps() {
  const missing = [];
  if (!(await exists(join(root, 'node_modules')))) missing.push(['npm', ['ci', '--no-audit', '--no-fund']]);
  if (!(await exists(join(root, 'packages', 'cli', 'node_modules')))) missing.push(['npm', ['ci', '--no-audit', '--no-fund', '--prefix', 'packages/cli']]);
  if (!missing.length) { log('  node_modules present'); return; }
  if (statusOnly) { log('  dependencies not installed'); return; }
  for (const [cmd, a] of missing) { log(`  ${cmd} ${a.join(' ')} …`); await run(cmd, a, { cwd: root, maxBuffer: 1 << 26 }); }
}

async function ensureBuild() {
  if (await exists(join(root, 'dist', 'index.html'))) { log('  dist/ present'); return; }
  if (statusOnly) { log('  web UI not built'); return; }
  log('  npm run build (renderer + web UI, takes a minute) …');
  await run('npm', ['run', 'build'], { cwd: root, maxBuffer: 1 << 26 });
}

async function ensureBrowser() {
  // Exports and `projects inspect` render through Playwright's Chromium.
  const { chromium } = await import('@playwright/test');
  const path = chromium.executablePath();
  if (await exists(path)) { log('  chromium present'); return; }
  if (statusOnly) { log('  chromium missing — exports and inspect will fail'); return; }
  log('  npx playwright install chromium …');
  await run('npx', ['playwright', 'install', 'chromium'], { cwd: root, maxBuffer: 1 << 26 });
}

async function ensureCli() {
  const binary = join(root, 'packages', 'cli', 'dist', 'dsa.js');
  if (await exists(binary)) { log('  packages/cli/dist/dsa.js present'); return; }
  if (statusOnly) { log('  CLI not built'); return; }
  log('  building the dsa CLI …');
  await run('npm', ['run', 'build', '--prefix', 'packages/cli'], { cwd: root, maxBuffer: 1 << 24 });
}

// --- server ----------------------------------------------------------------

const health = async (url) => {
  try { return (await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(1500) })).ok; }
  catch { return false; }
};

const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };

async function ownedPid() {
  if (!(await exists(pidFile))) return null;
  const pid = Number(await readFile(pidFile, 'utf8'));
  return Number.isInteger(pid) && alive(pid) ? pid : null;
}

async function spawnServer(url) {
  await mkdir(join(root, 'data'), { recursive: true });
  await mkdir(localDir, { recursive: true, mode: 0o700 });
  const child = spawn(process.execPath, ['--env-file=.env.local', '--import', 'tsx', 'server/node.ts'], {
    cwd: root, detached: true, stdio: 'ignore',
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV ?? 'development' },
  });
  child.unref();
  await writeFile(pidFile, `${child.pid}\n`, { mode: 0o600 });
  for (let attempt = 0; attempt < 60; attempt++) {
    await sleep(500);
    if (await health(url)) return child.pid;
    if (!alive(child.pid)) break;
  }
  throw new Error(`Server did not answer ${url}/api/health. Run it in the foreground to see why:\n  node --env-file=.env.local --import tsx server/node.ts`);
}

async function startServer(url) {
  if (await health(url)) {
    const pid = await ownedPid();
    log(pid ? `  running (pid ${pid}, started by this kit)` : `  something already answers at ${url} — not started by this kit`);
    return true;
  }
  if (statusOnly) { log('  not running'); return false; }
  const pid = await spawnServer(url);
  log(`  started (pid ${pid})`);
  return true;
}

async function stopServer() {
  const pid = await ownedPid();
  if (!pid) { log('  no server started by this kit is running'); await rm(pidFile, { force: true }); return false; }
  process.kill(pid, 'SIGTERM');
  for (let attempt = 0; attempt < 20 && alive(pid); attempt++) await sleep(250);
  await rm(pidFile, { force: true });
  log(alive(pid) ? `  pid ${pid} did not exit; stop it yourself` : `  stopped pid ${pid}`);
  return true;
}

// --- main ------------------------------------------------------------------

if (stopOnly) { step('my-designer — stop'); await stopServer(); process.exit(0); }
step(statusOnly ? 'my-designer — status' : 'my-designer — bootstrap');

step('1. Environment');
const env = statusOnly ? await readEnv() : await ensureEnv();
if (!env) { console.error('  no .env.local — run without --status to create it'); process.exit(1); }
const url = env.APP_URL ?? `http://localhost:${env.PORT ?? 8787}`;

step('2. Dependencies, web UI build, browser, CLI');
await ensureDeps();
await ensureBuild();
await ensureBrowser();
await ensureCli();

step('3. Server');
const up = await startServer(url);

if (!up) {
  step('Incomplete');
  log('  Re-run without --status to start the server.');
  process.exit(0);
}

const me = await fetch(`${url}/api/auth/me`).then((r) => r.json()).catch(() => null);
step('Ready');
log(`  Web UI       ${url}      ${me?.user?.local ? '(no sign-in: local mode)' : '(this server asks for a sign-in — LOCAL_USER is not set)'}`);
log(`  A project    ${url}/?project=<id>      (query param — /projects/<id> is 404)`);
log(`  Agent CLI    bin/dsa projects list      (no token to configure)`);
log(`  Harness      open this folder in Claude Code or OpenCode; AGENTS.md and .claude/skills/ are picked up automatically`);
log(`  Stop         node bootstrap.mjs --stop`);
log('');

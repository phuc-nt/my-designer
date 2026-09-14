#!/usr/bin/env node
// my-designer bootstrap: one command to a working local design studio that a
// coding agent drives through the CLI and a human reviews in the browser.
//
//   node bootstrap.mjs                      # full setup, idempotent
//   node bootstrap.mjs --status             # report only, change nothing
//   node bootstrap.mjs --stop               # stop the server this kit started
//   node bootstrap.mjs --port 8790          # first run only: choose the port
//   node bootstrap.mjs --email me@x --password '…'   # non-interactive account
//
// Writes .env.local and .local/ (both gitignored). Never writes a credential
// into a tracked file.

import { randomBytes } from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { access, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { join, resolve } from 'node:path';

const run = promisify(execFile);
const root = resolve(import.meta.dirname);
const envFile = join(root, '.env.local');
const localDir = join(root, '.local');
const connectionFile = join(localDir, 'connection.json');
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

async function setEnv(changes) {
  const lines = (await readFile(envFile, 'utf8')).split('\n');
  const seen = new Set();
  const out = lines.map((line) => {
    const match = /^([A-Z_]+)=/.exec(line.trim());
    if (match && match[1] in changes) { seen.add(match[1]); return `${match[1]}=${changes[match[1]]}`; }
    return line;
  });
  for (const [key, value] of Object.entries(changes)) if (!seen.has(key)) out.push(`${key}=${value}`);
  await writeFile(envFile, out.join('\n').replace(/\n*$/, '\n'));
}

async function ensureEnv() {
  const existing = await readEnv();
  if (existing?.ENCRYPTION_KEY) {
    log('  .env.local present — keeping ENCRYPTION_KEY (rotating it would strand stored provider keys)');
    return existing;
  }
  const port = flag('--port') ?? existing?.PORT ?? '8787';
  await writeFile(envFile, [
    '# my-designer local config. Gitignored. The server is started by bootstrap.mjs with:',
    '#   node --env-file=.env.local --import tsx server/node.ts',
    '',
    `ENCRYPTION_KEY=${randomBytes(32).toString('base64')}`,
    `PORT=${port}`,
    `APP_URL=http://localhost:${port}`,
    'DATA_DIR=./data',
    '',
    '# Single-user: registration is open only until the first account exists.',
    'ALLOW_REGISTRATION=true',
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
    return { state: 'running', owned: Boolean(pid) };
  }
  if (statusOnly) { log('  not running'); return { state: 'down', owned: false }; }
  const pid = await spawnServer(url);
  log(`  started (pid ${pid})`);
  return { state: 'started', owned: true };
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

// Env is read once at boot, so closing registration or granting operator
// rights needs a restart. Only restart a process this kit started.
async function restartServer(url, owned) {
  if (!owned) { log('  server was not started by this kit — restart it yourself for the new .env.local to apply'); return; }
  await stopServer();
  const pid = await spawnServer(url);
  log(`  restarted (pid ${pid})`);
}

// --- account and token -----------------------------------------------------

async function prompt(question, { silent = false } = {}) {
  if (!process.stdin.isTTY) return '';
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  if (!silent) { const answer = await rl.question(question); rl.close(); return answer.trim(); }
  process.stdout.write(question);
  process.stdin.setRawMode(true);
  let value = '';
  await new Promise((done) => {
    const onData = (chunk) => {
      const char = chunk.toString('utf8');
      if (char === '\r' || char === '\n') { process.stdin.off('data', onData); process.stdout.write('\n'); done(); }
      else if (char === '') process.exit(130);
      else if (char === '') value = value.slice(0, -1);
      else value += char;
    };
    process.stdin.on('data', onData);
  });
  process.stdin.setRawMode(false);
  rl.close();
  return value;
}

async function authenticate(url, env) {
  const saved = (await exists(connectionFile)) ? JSON.parse(await readFile(connectionFile, 'utf8')) : null;
  if (saved?.apiKey) {
    const response = await fetch(`${url}/api/auth/me`, { headers: { Authorization: `Bearer ${saved.apiKey}` } });
    if (response.ok) {
      const { user } = await response.json();
      log(`  reusing saved token for ${user.email}`);
      return { connection: { ...saved, url, userId: user.id, email: user.email }, created: false };
    }
    log('  saved token no longer works — creating a new one');
  }
  if (statusOnly) { log('  no usable token'); return { connection: null, created: false }; }

  const email = flag('--email') ?? process.env.DESIGNER_EMAIL ?? (await prompt('  email for the local account [me@local.host]: ')) ?? '';
  let password = flag('--password') ?? process.env.DESIGNER_PASSWORD ?? saved?.password ?? (await prompt('  password (empty = generate one): ', { silent: true }));
  let generated = false;
  if (!password) { password = randomBytes(12).toString('base64url'); generated = true; }
  const account = { email: email || 'me@local.host', password };

  // Login, register and session-authenticated writes are CSRF-checked against APP_URL.
  const headers = { 'content-type': 'application/json', origin: new URL(url).origin };
  const body = JSON.stringify(account);
  let response = await fetch(`${url}/api/auth/register`, { method: 'POST', headers, body });
  if (response.status === 409 || response.status === 403) {
    log(response.status === 409 ? '  account exists — signing in' : '  registration closed — signing in');
    response = await fetch(`${url}/api/auth/login`, { method: 'POST', headers, body });
  }
  if (!response.ok) throw new Error(`Could not create or sign in to the account (${response.status}): ${await response.text()}`);
  const { user } = await response.json();
  const cookie = response.headers.getSetCookie?.().map((v) => v.split(';')[0]).join('; ');
  if (!cookie) throw new Error('The server did not return a session cookie; cannot mint an API token.');

  const minted = await fetch(`${url}/api/tokens`, {
    method: 'POST', headers: { ...headers, cookie },
    body: JSON.stringify({ name: `my-designer ${new Date().toISOString().slice(0, 10)}` }),
  });
  if (!minted.ok) throw new Error(`Token creation failed (${minted.status}): ${await minted.text()}`);
  const token = await minted.json();
  log(`  created API token ${token.id}`);
  if (generated) log('  generated a password for the web UI — it is saved in .local/connection.json');
  return {
    connection: { url, email: account.email, password: account.password, userId: user.id, apiKey: token.token, tokenId: token.id },
    created: true,
  };
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
const server = await startServer(url);

step('4. Account and API token');
const { connection, created } = server.state === 'down' ? { connection: null, created: false } : await authenticate(url, env);
if (connection && !statusOnly) {
  await mkdir(localDir, { recursive: true, mode: 0o700 });
  await writeFile(connectionFile, `${JSON.stringify(connection, null, 2)}\n`, { mode: 0o600 });
  const changes = {};
  if (env.ALLOW_REGISTRATION !== 'false') changes.ALLOW_REGISTRATION = 'false';
  if (env.OBSERVABILITY_ADMIN_IDS !== connection.userId) changes.OBSERVABILITY_ADMIN_IDS = connection.userId;
  if (Object.keys(changes).length) {
    await setEnv(changes);
    log(`  .env.local: ${Object.keys(changes).join(', ')} — closing registration, granting the activity view`);
    await restartServer(url, server.owned);
  }
}

if (!connection) {
  step('Incomplete');
  log('  Start the server and re-run without --status to finish setup.');
  process.exit(statusOnly ? 0 : 1);
}

step('Ready');
log(`  Web UI       ${url}`);
log(`  Sign in      ${connection.email}  (password in .local/connection.json)`);
log(`  A project    ${url}/?project=<id>      (query param — /projects/<id> is 404)`);
log(`  Agent CLI    bin/dsa projects list      (reads .local/connection.json — nothing to export)`);
log(`  Harness      open this folder in Claude Code or OpenCode; AGENTS.md and .claude/skills/ are picked up automatically`);
log(`  Stop         node bootstrap.mjs --stop`);
log('');

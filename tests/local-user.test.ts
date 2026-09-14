import { builtStaticAssets } from './built-static-assets';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { app } from '../server/index';
import { FileBucket, SqliteDatabase } from '../server/node-adapters';
import { secret } from '../server/security';
import type { Bindings } from '../server/types';

test('local single-user mode makes every request the owner without credentials', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'my-designer-local-'));
  const db = new SqliteDatabase(join(dir, 'studio.db'));
  for (const migration of (await readdir(new URL('../migrations/', import.meta.url))).filter(f => f.endsWith('.sql')).sort())
    await db.exec(await readFile(new URL(`../migrations/${migration}`, import.meta.url), 'utf8'));
  const base: Bindings = { ASSETS: builtStaticAssets, DB: db, ASSETS_BUCKET: new FileBucket(join(dir, 'assets')), APP_URL: 'http://localhost:8787', ALLOW_REGISTRATION: 'false', ENCRYPTION_KEY: secret() };
  const local: Bindings = { ...base, LOCAL_USER: 'You' };
  const request = (env: Bindings, path: string, init: RequestInit = {}) => app.request(`http://localhost:8787${path}`, init, env);
  const json = { 'Content-Type': 'application/json' };
  t.after(() => rm(dir, { recursive: true, force: true }));

  await t.test('the implicit account answers /api/auth/me and is flagged local', async () => {
    const me = await (await request(local, '/api/auth/me')).json() as any;
    assert.equal(me.user.id, 'local'); assert.equal(me.user.name, 'You'); assert.equal(me.user.local, true);
    const off = await (await request(base, '/api/auth/me')).json() as any;
    assert.equal(off.user, null);
  });

  await t.test('CLI-style writes without Origin succeed; foreign browser origins are refused', async () => {
    const cli = await request(local, '/api/tokens', { method: 'POST', headers: json, body: JSON.stringify({ name: 'cli' }) });
    assert.equal(cli.status, 201, await cli.clone().text());
    const same = await request(local, '/api/tokens', { method: 'POST', headers: { ...json, Origin: 'http://localhost:8787' }, body: JSON.stringify({ name: 'browser' }) });
    assert.equal(same.status, 201);
    const foreign = await request(local, '/api/tokens', { method: 'POST', headers: { ...json, Origin: 'https://evil.example' }, body: JSON.stringify({ name: 'csrf' }) });
    assert.equal(foreign.status, 403);
    assert.equal(((await foreign.json()) as any).error.code, 'invalid_origin');
  });

  await t.test('an unknown bearer still acts as the local owner and sees the same projects', async () => {
    const created = await request(local, '/api/tokens', { method: 'POST', headers: json, body: JSON.stringify({ name: 'placeholder' }) });
    assert.equal(created.status, 201);
    const listed = await request(local, '/api/tokens', { headers: { Authorization: 'Bearer local' } });
    assert.equal(listed.status, 200);
    assert.equal(((await listed.json()) as any).tokens.length, 3);
  });

  await t.test('registration and login cannot reach the implicit account', async () => {
    const register = await request(local, '/api/auth/register', { method: 'POST', headers: { ...json, Origin: 'http://localhost:8787' }, body: JSON.stringify({ email: 'x@y.z', password: 'Abcdefgh1234!' }) });
    assert.equal(register.status, 403);
    // The implicit account's address is not a routable email, so the login
    // schema rejects it (400) before any password compare; a 401 would also
    // be acceptable. Either way the row is unreachable.
    const login = await request(local, '/api/auth/login', { method: 'POST', headers: { ...json, Origin: 'http://localhost:8787' }, body: JSON.stringify({ email: 'local@my-designer', password: 'anything' }) });
    assert.ok([400, 401].includes(login.status), `login returned ${login.status}`);
  });
});

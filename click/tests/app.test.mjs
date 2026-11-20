import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from '../server.mjs';

test('HTTP server serves HTML, health, cookies, sessions, and persisted DB clicks CRUD', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'click-app-'));
  const dataFile = path.join(tmpDir, 'clicks.json');
  const server = createServer({ dataFile });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  try {
    const home = await fetch(`${base}/`);
    assert.equal(home.status, 200);
    assert.match(await home.text(), /Contadores de Clics Persistentes/);

    const health = await (await fetch(`${base}/health`)).json();
    assert.equal(health.ok, true);

    // Sessions persist across requests via cookie
    const s1 = await fetch(`${base}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 5 }),
    });
    const cookie = s1.headers.get('set-cookie').split(';')[0];
    assert.equal((await s1.json()).value, 5);
    const s2 = await (await fetch(`${base}/sessions`, { headers: { Cookie: cookie } })).json();
    assert.equal(s2.value, 5);

    // Cookies endpoint
    const c1 = await fetch(`${base}/cookies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 9 }),
    });
    assert.equal((await c1.json()).value, 9);

    // DB API CRUD + persistence
    const db1 = await (await fetch(`${base}/api/v1/clicks/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 14 }),
    })).json();
    assert.equal(db1.click.count, 14);
    const dbList = await (await fetch(`${base}/api/v1/clicks`)).json();
    assert.equal(dbList.clicks[0].count, 14);
    const dbDel = await (await fetch(`${base}/api/v1/clicks/1`, { method: 'DELETE' })).json();
    assert.equal(dbDel.click.count, 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClickStore } from './lib/store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

async function readBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > 64 * 1024) throw new Error('Payload too large');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  const ct = (req.headers['content-type'] || '').toLowerCase();
  if (!raw) return {};
  if (ct.includes('application/json')) return JSON.parse(raw);
  if (ct.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  return { raw };
}

function sendJson(res, status, data, extraHeaders = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders });
  res.end(JSON.stringify(data));
}

export function createServer(options = {}) {
  const dataFile = options.dataFile === undefined ? path.join(__dirname, 'data', 'clicks.json') : options.dataFile;
  const store = createClickStore(dataFile);

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      const pathname = url.pathname;
      const cookies = parseCookies(req.headers.cookie);

      if (pathname === '/health' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true, service: 'click-counters' });
      }

      if (pathname === '/sessions') {
        if (req.method === 'GET') {
          const s = store.getOrCreateSession(cookies.click_sid);
          return sendJson(res, 200, { value: s.value }, {
            'Set-Cookie': `click_sid=${s.sid}; Path=/; HttpOnly; SameSite=Lax`,
          });
        }
        if (req.method === 'POST') {
          const body = await readBody(req);
          const s = store.setSessionValue(cookies.click_sid, body.value);
          return sendJson(res, 200, { value: s.value }, {
            'Set-Cookie': `click_sid=${s.sid}; Path=/; HttpOnly; SameSite=Lax`,
          });
        }
      }

      if (pathname === '/cookies') {
        if (req.method === 'GET') {
          const count = store.parseCount(cookies.click_count, 0);
          return sendJson(res, 200, { value: count });
        }
        if (req.method === 'POST') {
          const body = await readBody(req);
          const count = store.parseCount(body.value, 0);
          return sendJson(res, 200, { value: count }, {
            'Set-Cookie': `click_count=${count}; Path=/; Max-Age=2592000; SameSite=Lax`,
          });
        }
      }

      if (pathname === '/api/v1/clicks' || pathname.startsWith('/api/v1/clicks/')) {
        if (req.method === 'GET') {
          return sendJson(res, 200, { clicks: store.getDbClicks() });
        }
        if (req.method === 'POST' || req.method === 'PUT') {
          const body = await readBody(req);
          const updated = store.setDbCount(body.count ?? body.value ?? 0);
          return sendJson(res, req.method === 'POST' ? 201 : 200, { click: updated, clicks: [updated] });
        }
        if (req.method === 'DELETE') {
          const reset = store.setDbCount(0);
          return sendJson(res, 200, { click: reset, clicks: [reset] });
        }
      }

      // Static assets
      const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const resolved = path.resolve(PUBLIC_DIR, rel);
      if (!resolved.startsWith(PUBLIC_DIR) || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
        return sendJson(res, 404, { error: 'Not Found' });
      }
      const ext = path.extname(resolved).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(resolved).pipe(res);
    } catch (err) {
      sendJson(res, 400, { error: err.message || 'Bad Request' });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  const server = createServer();
  server.listen(port, host, () => {
    console.log(`Click Counters server listening on http://${host}:${port}`);
  });
}

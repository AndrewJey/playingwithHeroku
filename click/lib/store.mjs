import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function createClickStore(dataFile) {
  const sessions = new Map();
  let dbState = { id: 1, count: 0, updatedAt: new Date().toISOString() };

  function loadDb() {
    if (!dataFile) return;
    try {
      if (fs.existsSync(dataFile)) {
        const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        if (parsed && typeof parsed.count === 'number' && Number.isFinite(parsed.count)) {
          dbState = { id: 1, count: Math.max(0, Math.trunc(parsed.count)), updatedAt: parsed.updatedAt || new Date().toISOString() };
        }
      }
    } catch {
      // Keep default state if file is unreadable
    }
  }

  function saveDb() {
    if (!dataFile) return;
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(dbState, null, 2) + '\n', 'utf8');
  }

  loadDb();

  function parseCount(raw, fallback = 0) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(1_000_000, Math.trunc(n)));
  }

  function getOrCreateSession(sid) {
    if (sid && sessions.has(sid)) {
      return { sid, value: sessions.get(sid) };
    }
    const nextSid = crypto.randomBytes(16).toString('hex');
    sessions.set(nextSid, 0);
    return { sid: nextSid, value: 0 };
  }

  function setSessionValue(sid, rawValue) {
    const session = getOrCreateSession(sid);
    const value = parseCount(rawValue, 0);
    sessions.set(session.sid, value);
    return { sid: session.sid, value };
  }

  function getDbClicks() {
    return [Object.assign({}, dbState)];
  }

  function setDbCount(rawValue) {
    dbState = { id: 1, count: parseCount(rawValue, 0), updatedAt: new Date().toISOString() };
    saveDb();
    return Object.assign({}, dbState);
  }

  return {
    parseCount,
    getOrCreateSession,
    setSessionValue,
    getDbClicks,
    setDbCount,
  };
}

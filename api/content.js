import { put, list } from '@vercel/blob';
import { json, readBody, getFallbackPassword, assertBlobToken, siteOrigin } from './_http.js';

const CONTENT_PATHNAME = 'kxrgx/site-content.json';

async function readBlobContent() {
  assertBlobToken();
  const { blobs } = await list({ prefix: 'kxrgx/site-content', limit: 20 });
  const hit = blobs.find((b) => b.pathname === CONTENT_PATHNAME) || blobs[0];
  if (!hit?.url) return null;
  const res = await fetch(hit.url, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

async function readSeedContent(req) {
  const origin = siteOrigin(req);
  const res = await fetch(`${origin}/site-content.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Varsayılan içerik okunamadı');
  return res.json();
}

async function loadContent(req) {
  try {
    const fromBlob = await readBlobContent();
    if (fromBlob) return fromBlob;
  } catch (error) {
    if (error.message?.includes('BLOB_READ_WRITE_TOKEN')) throw error;
  }
  return readSeedContent(req);
}

async function saveContent(content) {
  assertBlobToken();
  await put(CONTENT_PATHNAME, `${JSON.stringify(content, null, 2)}\n`, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
  });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');
    return json(res, 204, {});
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    if (req.method === 'GET') {
      const content = await loadContent(req);
      return json(res, 200, content);
    }

    if (req.method === 'POST') {
      const raw = await readBody(req);
      const parsed = JSON.parse(raw || '{}');
      const incoming = parsed.content || parsed;
      const password = parsed.password || req.headers['x-admin-password'] || '';

      const current = await loadContent(req);
      const expected = current?.admin?.password || getFallbackPassword();
      if (!password || password !== expected) {
        return json(res, 401, { ok: false, error: 'Yetkisiz' });
      }

      if (!incoming || typeof incoming !== 'object') {
        return json(res, 400, { ok: false, error: 'Geçersiz içerik' });
      }

      const next = { ...incoming };
      if (!next.admin) next.admin = {};
      if (!next.admin.password) next.admin.password = expected;

      await saveContent(next);
      return json(res, 200, { ok: true, persisted: true });
    }

    return json(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    return json(res, error.status || 500, {
      ok: false,
      error: error.message || 'Sunucu hatası',
    });
  }
}

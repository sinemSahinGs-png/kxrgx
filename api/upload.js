import { put } from '@vercel/blob';
import { json, readBody, getFallbackPassword, siteOrigin } from './_http.js';

async function expectedPassword(req) {
  try {
    const origin = siteOrigin(req);
    const res = await fetch(`${origin}/api/content`, { cache: 'no-store' });
    if (res.ok) {
      const content = await res.json();
      return content?.admin?.password || getFallbackPassword();
    }
  } catch {
    /* ignore */
  }
  return getFallbackPassword();
}

function safeFilename(name) {
  return String(name || 'upload')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');
    return json(res, 204, {});
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const raw = await readBody(req);
    const body = JSON.parse(raw || '{}');
    const password = body.password || req.headers['x-admin-password'] || '';
    const expected = await expectedPassword(req);
    if (!password || password !== expected) {
      return json(res, 401, { ok: false, error: 'Yetkisiz' });
    }

    const folder = body.folder === 'archive' ? 'archive' : 'projects';
    const original = body.filename || 'image.jpg';
    const extMatch = original.toLowerCase().match(/\.(jpe?g|png|webp|gif)$/);
    const ext = extMatch ? extMatch[0] : '.jpg';
    const base = safeFilename(original.replace(/\.[^.]+$/, '')) || 'image';
    const filename = `${base}-${Date.now()}${ext}`;

    let data = String(body.data || '');
    data = data.replace(/^data:[^;]+;base64,/, '');
    if (!data) return json(res, 400, { ok: false, error: 'Dosya verisi yok' });

    const buffer = Buffer.from(data, 'base64');
    const blob = await put(`kxrgx/${folder}/${filename}`, buffer, {
      access: 'public',
      contentType:
        ext === '.png'
          ? 'image/png'
          : ext === '.webp'
            ? 'image/webp'
            : ext === '.gif'
              ? 'image/gif'
              : 'image/jpeg',
    });

    return json(res, 200, {
      ok: true,
      path: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    return json(res, error.status || 500, {
      ok: false,
      error: error.message || 'Yükleme başarısız',
    });
  }
}

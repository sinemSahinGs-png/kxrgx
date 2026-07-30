import { put, list } from '@vercel/blob';
import { json, readBody, getFallbackPassword, siteOrigin } from './_http.js';

const CONTENT_PATHNAME = 'kxrgx/site-content.json';

async function readBlobContent() {
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

function looksMojibake(text) {
  return /Ã.|Ä±|ÅŸ|ÄŸ|Ã¼|Ã¶|Ã§|A�|Â/.test(String(text || ''));
}

function isUploadedAudio(url) {
  const u = String(url || '');
  return /^https?:\/\//i.test(u) || u.includes('blob.vercel') || u.includes('vercel-storage');
}

function isSeedBeatList(beats) {
  if (!Array.isArray(beats) || !beats.length) return false;
  return beats.every(
    (b) => /^\.\/audio\/beat-\d+\.mp3$/i.test(String(b?.audio || '')) && !b?.sold
  );
}

function hasProtectedBeats(beats) {
  return (beats || []).some((b) => isUploadedAudio(b?.audio) || Boolean(b?.sold));
}

/**
 * Prevent accidental wipe of uploaded / sold beats (e.g. seed JSON push).
 * Admin can still edit, rename, replace audio, mark sold, or delete individual beats.
 */
function protectBeats(currentBeats = [], incomingBeats, { forceReplaceBeats = false } = {}) {
  if (forceReplaceBeats) return Array.isArray(incomingBeats) ? incomingBeats : currentBeats;
  if (!Array.isArray(incomingBeats)) return currentBeats;

  if (hasProtectedBeats(currentBeats) && isSeedBeatList(incomingBeats)) {
    return currentBeats;
  }

  if (incomingBeats.length === 0 && hasProtectedBeats(currentBeats)) {
    return currentBeats;
  }

  const currentById = new Map(currentBeats.map((b) => [b.id, b]));
  return incomingBeats.map((beat) => {
    const prev = currentById.get(beat.id);
    if (prev && isUploadedAudio(prev.audio) && !isUploadedAudio(beat.audio)) {
      return { ...beat, audio: prev.audio };
    }
    return beat;
  });
}

async function loadContent(req) {
  try {
    const fromBlob = await readBlobContent();
    if (fromBlob && !looksMojibake(fromBlob.roleTR) && !looksMojibake(fromBlob.about?.textTR)) {
      return fromBlob;
    }
  } catch {
    /* blob yoksa / bozuksa seed'e düş */
  }
  return readSeedContent(req);
}

async function saveContent(content) {
  const payload = Buffer.from(`${JSON.stringify(content, null, 2)}\n`, 'utf8');
  await put(CONTENT_PATHNAME, payload, {
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
      const fallback = getFallbackPassword();
      const accepted =
        password === expected ||
        password === fallback ||
        password === 'GÃ¼lpembe3169';
      if (!password || !accepted) {
        return json(res, 401, { ok: false, error: 'Yetkisiz' });
      }

      if (!incoming || typeof incoming !== 'object') {
        return json(res, 400, { ok: false, error: 'Geçersiz içerik' });
      }

      const next = { ...incoming };
      if (!next.admin) next.admin = {};
      if (!next.admin.password) next.admin.password = expected;

      next.beats = protectBeats(current.beats || [], incoming.beats, {
        forceReplaceBeats: parsed.forceReplaceBeats === true,
      });
      delete next.beatPrice;

      await saveContent(next);
      return json(res, 200, {
        ok: true,
        persisted: true,
        beatsProtected: hasProtectedBeats(next.beats),
        beatCount: Array.isArray(next.beats) ? next.beats.length : 0,
      });
    }

    return json(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    return json(res, error.status || 500, {
      ok: false,
      error: error.message || 'Sunucu hatası',
    });
  }
}

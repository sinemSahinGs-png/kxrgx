import { get } from '@vercel/blob';
import { json } from './_http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const host = req.headers.host || 'localhost';
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const url = new URL(req.url || '/', `${proto}://${host}`);
    const pathname = url.searchParams.get('path') || url.searchParams.get('pathname') || '';
    if (!pathname || !pathname.startsWith('kxrgx/')) {
      return json(res, 400, { ok: false, error: 'Geçersiz path' });
    }

    const result = await get(pathname, { access: 'private' });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return json(res, 404, { ok: false, error: 'Bulunamadı' });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', result.blob.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (result.blob.contentDisposition) {
      res.setHeader('Content-Disposition', result.blob.contentDisposition);
    }

    const reader = result.stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (error) {
    return json(res, error.status || 500, {
      ok: false,
      error: error.message || 'Medya okunamadı',
    });
  }
}

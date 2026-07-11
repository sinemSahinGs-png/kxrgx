import {
  getGithubConfig,
  getGithubFile,
  putGithubFile,
  decodeGithubContent,
  toBase64,
  readBody,
  json,
  getFallbackPassword,
} from './_github.js';

async function loadRemoteContent() {
  const { contentPath } = getGithubConfig();
  const file = await getGithubFile(contentPath);
  const content = JSON.parse(decodeGithubContent(file));
  return { content, sha: file.sha };
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
      const { content } = await loadRemoteContent();
      return json(res, 200, content);
    }

    if (req.method === 'POST') {
      const raw = await readBody(req);
      const parsed = JSON.parse(raw || '{}');
      const incoming = parsed.content || parsed;
      const password = parsed.password || req.headers['x-admin-password'] || '';

      const { content: current, sha } = await loadRemoteContent();
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

      const { contentPath } = getGithubConfig();
      await putGithubFile(contentPath, {
        contentBase64: toBase64(JSON.stringify(next, null, 2) + '\n'),
        message: `content: admin panel update ${new Date().toISOString()}`,
        sha,
      });

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

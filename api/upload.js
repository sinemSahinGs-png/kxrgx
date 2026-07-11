import {
  getGithubFile,
  putGithubFile,
  readBody,
  json,
  publicFileUrl,
  getFallbackPassword,
  getGithubConfig,
  decodeGithubContent,
} from './_github.js';

async function expectedPassword() {
  try {
    const { contentPath } = getGithubConfig();
    const file = await getGithubFile(contentPath);
    const content = JSON.parse(decodeGithubContent(file));
    return content?.admin?.password || getFallbackPassword();
  } catch {
    return getFallbackPassword();
  }
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
    const expected = await expectedPassword();
    if (!password || password !== expected) {
      return json(res, 401, { ok: false, error: 'Yetkisiz' });
    }

    const folder = body.folder === 'archive' ? 'archive' : 'projects';
    const original = body.filename || 'image.jpg';
    const extMatch = original.toLowerCase().match(/\.(jpe?g|png|webp|gif)$/);
    const ext = extMatch ? extMatch[0] : '.jpg';
    const base = safeFilename(original.replace(/\.[^.]+$/, '')) || 'image';
    const filename = `${base}-${Date.now()}${ext}`;
    const repoPath = `public/${folder}/${filename}`;

    let data = String(body.data || '');
    data = data.replace(/^data:[^;]+;base64,/, '');
    if (!data) return json(res, 400, { ok: false, error: 'Dosya verisi yok' });

    let sha;
    try {
      const existing = await getGithubFile(repoPath);
      sha = existing.sha;
    } catch {
      sha = undefined;
    }

    await putGithubFile(repoPath, {
      contentBase64: data,
      message: `upload: ${folder}/${filename}`,
      sha,
    });

    return json(res, 200, {
      ok: true,
      path: publicFileUrl(repoPath),
      relativePath: `./${folder}/${filename}`,
    });
  } catch (error) {
    return json(res, error.status || 500, {
      ok: false,
      error: error.message || 'Yükleme başarısız',
    });
  }
}

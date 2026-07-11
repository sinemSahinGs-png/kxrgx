const DEFAULT_REPO = 'sinemSahinGs-png/kxrgx';
const DEFAULT_BRANCH = 'main';
const CONTENT_PATH = 'public/site-content.json';

export function getGithubConfig() {
  return {
    token: process.env.GITHUB_TOKEN || '',
    repo: process.env.GITHUB_REPO || DEFAULT_REPO,
    branch: process.env.GITHUB_BRANCH || DEFAULT_BRANCH,
    contentPath: process.env.CONTENT_PATH || CONTENT_PATH,
  };
}

export function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export async function githubRequest(path, { method = 'GET', body } = {}) {
  const { token, repo } = getGithubConfig();
  if (!token) {
    const err = new Error('GITHUB_TOKEN eksik. Vercel Environment Variables içine ekleyin.');
    err.status = 500;
    throw err;
  }

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'kxrgx-admin',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `GitHub API hatası (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function getGithubFile(path) {
  const { branch } = getGithubConfig();
  return githubRequest(`${path}?ref=${encodeURIComponent(branch)}`);
}

export async function putGithubFile(path, { contentBase64, message, sha }) {
  const { branch } = getGithubConfig();
  return githubRequest(path, {
    method: 'PUT',
    body: {
      message,
      content: contentBase64,
      branch,
      ...(sha ? { sha } : {}),
    },
  });
}

export function decodeGithubContent(file) {
  return Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf8');
}

export function toBase64(text) {
  return Buffer.from(text, 'utf8').toString('base64');
}

export function publicFileUrl(relativePath) {
  const { repo, branch } = getGithubConfig();
  const clean = String(relativePath || '').replace(/^\.?\/+/, '');
  return `https://raw.githubusercontent.com/${repo}/${branch}/${clean}`;
}

export function getFallbackPassword() {
  return process.env.ADMIN_PASSWORD || 'Gülpembe3169';
}

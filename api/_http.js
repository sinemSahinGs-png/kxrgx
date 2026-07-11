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

export function getFallbackPassword() {
  return process.env.ADMIN_PASSWORD || 'Gülpembe3169';
}

export function siteOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || process.env.VERCEL_URL;
  if (host) return `${proto}://${host}`;
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  return 'https://kxrgx.com.tr';
}

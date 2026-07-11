import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function safeFilename(name) {
  return String(name || 'upload')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(rootDir, 'index.html'),
        admin: path.resolve(rootDir, 'admin.html'),
      },
    },
  },
  plugins: [
    {
      name: 'content-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0];
          if (url === '/admin' || url === '/admin/') {
            req.url = '/admin.html';
          }
          next();
        });

        server.middlewares.use('/api/content', async (req, res, next) => {
          const filePath = path.resolve(rootDir, 'public/site-content.json');
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(fs.readFileSync(filePath, 'utf-8'));
            return;
          }
          if (req.method === 'POST') {
            try {
              const body = await readBody(req);
              const parsed = JSON.parse(body);
              const content = parsed.content || parsed;
              fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, persisted: true }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: 'Geçersiz JSON' }));
            }
            return;
          }
          next();
        });

        server.middlewares.use('/api/upload', async (req, res, next) => {
          if (req.method !== 'POST') return next();
          try {
            const body = JSON.parse(await readBody(req));
            const folder = body.folder === 'archive' ? 'archive' : 'projects';
            const ext = path.extname(body.filename || '').toLowerCase() || '.jpg';
            const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
            if (!allowed.includes(ext)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: 'Desteklenmeyen dosya türü' }));
              return;
            }
            const base = safeFilename(path.basename(body.filename || 'image', ext)) || 'image';
            const filename = `${base}-${Date.now()}${ext}`;
            const dir = path.resolve(rootDir, 'public', folder);
            fs.mkdirSync(dir, { recursive: true });
            const data = String(body.data || '').replace(/^data:[^;]+;base64,/, '');
            fs.writeFileSync(path.join(dir, filename), Buffer.from(data, 'base64'));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, path: `./${folder}/${filename}` }));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, error: error.message || 'Yükleme başarısız' }));
          }
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0];
          if (url === '/admin' || url === '/admin/') {
            req.url = '/admin.html';
          }
          next();
        });
      },
    },
  ],
});

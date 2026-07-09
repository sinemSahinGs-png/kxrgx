import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  plugins: [
    {
      name: 'content-api',
      configureServer(server) {
        server.middlewares.use('/api/content', (req, res, next) => {
          const filePath = path.resolve('public/site-content.json');
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(fs.readFileSync(filePath, 'utf-8'));
            return;
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                JSON.parse(body);
                fs.writeFileSync(filePath, body, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: true }));
              } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, error: 'Geçersiz JSON' }));
              }
            });
            return;
          }
          next();
        });
      },
    },
  ],
});

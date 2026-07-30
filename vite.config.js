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

function protectBeats(currentBeats = [], incomingBeats, forceReplaceBeats = false) {
  if (forceReplaceBeats) return Array.isArray(incomingBeats) ? incomingBeats : currentBeats;
  if (!Array.isArray(incomingBeats)) return currentBeats;
  if (hasProtectedBeats(currentBeats) && isSeedBeatList(incomingBeats)) return currentBeats;
  if (incomingBeats.length === 0 && hasProtectedBeats(currentBeats)) return currentBeats;
  const currentById = new Map(currentBeats.map((b) => [b.id, b]));
  return incomingBeats.map((beat) => {
    const prev = currentById.get(beat.id);
    if (prev && isUploadedAudio(prev.audio) && !isUploadedAudio(beat.audio)) {
      return { ...beat, audio: prev.audio };
    }
    return beat;
  });
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
              const incoming = parsed.content || parsed;
              let current = {};
              try {
                current = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
              } catch {
                current = {};
              }
              const content = { ...incoming };
              content.beats = protectBeats(
                current.beats || [],
                incoming.beats,
                parsed.forceReplaceBeats === true
              );
              delete content.beatPrice;
              fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  ok: true,
                  persisted: true,
                  beatsProtected: hasProtectedBeats(content.beats),
                  beatCount: Array.isArray(content.beats) ? content.beats.length : 0,
                })
              );
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
            // Client blob upload protocol is production-only
            if (body.type === 'blob.generate-client-token' || body.type === 'blob.upload-completed') {
              res.statusCode = 400;
              res.end(
                JSON.stringify({
                  error: 'Yerelde Blob client upload yok; base64 yükleme kullanılır.',
                })
              );
              return;
            }
            const ext = path.extname(body.filename || '').toLowerCase() || '.jpg';
            const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
            const audioExts = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.mpeg', '.webm'];
            if (!imageExts.includes(ext) && !audioExts.includes(ext)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: 'Desteklenmeyen dosya türü' }));
              return;
            }
            const isAudio = audioExts.includes(ext);
            const folder =
              body.folder === 'archive'
                ? 'archive'
                : body.folder === 'images'
                  ? 'images'
                  : body.folder === 'beats' || body.folder === 'audio' || isAudio
                    ? 'audio'
                    : 'projects';
            const base =
              safeFilename(path.basename(body.filename || (isAudio ? 'beat' : 'image'), ext)) ||
              (isAudio ? 'beat' : 'image');
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

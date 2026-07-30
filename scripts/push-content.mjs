/**
 * Safe live patch — NEVER overwrites beats (uploads / SOLD flags).
 * Only fills missing non-beat fields from local seed when live lacks them.
 */
import { readFileSync } from 'node:fs';

const local = JSON.parse(readFileSync(new URL('../public/site-content.json', import.meta.url), 'utf8'));

const liveProbe = await fetch('https://kxrgx.vercel.app/api/content', { cache: 'no-store' });
const live = await liveProbe.json();
if (!live || live.error) {
  console.error('Live content okunamadı');
  process.exit(1);
}

const password = live?.admin?.password || local.admin?.password || 'Gülpembe3169';

const FILL_KEYS = [
  'spotifyUrl',
  'spotifyLabel',
  'instagramUrl',
  'instagramDmUrl',
  'instagramHandle',
  'email',
  'brand',
  'roleTR',
  'roleEN',
  'portraitTop',
  'portraitBottom',
  'crowFeather',
  'aboutCutout',
  'heroVideo',
  'radioPlaylistId',
];

const content = structuredClone(live);

for (const key of FILL_KEYS) {
  if ((content[key] == null || content[key] === '') && local[key] != null && local[key] !== '') {
    content[key] = local[key];
  }
}

if (!content.about) content.about = {};
if (!content.contact) content.contact = {};
if (!content.hero) content.hero = {};
if (!content.seo) content.seo = {};
if (!content.theme) content.theme = {};

for (const [bucket, keys] of [
  ['about', ['titleTR', 'titleEN', 'textTR', 'textEN', 'cutout']],
  ['contact', ['textTR', 'cta']],
  ['hero', ['copy', 'cta']],
  ['seo', ['title', 'description']],
  ['theme', ['bg', 'bg2', 'accent', 'text']],
]) {
  for (const key of keys) {
    if (
      (content[bucket][key] == null || content[bucket][key] === '') &&
      local[bucket]?.[key] != null &&
      local[bucket][key] !== ''
    ) {
      content[bucket][key] = local[bucket][key];
    }
  }
}

// Hard lock — beats always stay as on live
content.beats = Array.isArray(live.beats) ? live.beats : [];
delete content.beatPrice;

const res = await fetch('https://kxrgx.vercel.app/api/content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Admin-Password': password,
  },
  body: JSON.stringify({ password, content, source: 'push-content-safe' }),
});

console.log('save:', res.status, await res.json());
const check = await (await fetch('https://kxrgx.vercel.app/api/content', { cache: 'no-store' })).json();
console.log(
  'beats locked:',
  (check.beats || []).map((b) => `${b.number}:${b.sold ? 'SOLD' : 'sale'}:${(b.audio || '').slice(0, 48)}`)
);

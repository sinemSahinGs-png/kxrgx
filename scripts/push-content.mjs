import { readFileSync } from 'node:fs';

const local = JSON.parse(readFileSync(new URL('../public/site-content.json', import.meta.url), 'utf8'));

const liveProbe = await fetch('https://kxrgx.vercel.app/api/content', { cache: 'no-store' });
const live = await liveProbe.json();
if (!live || live.error) {
  console.error('Live content okunamadı');
  process.exit(1);
}

const password = live?.admin?.password || local.admin?.password || 'Gülpembe3169';

/** Live admin/blob verisini koru; sadece eksik seed alanlarını doldur */
const content = {
  ...local,
  ...live,
  admin: live.admin || local.admin,
  beats: Array.isArray(live.beats) && live.beats.length ? live.beats : local.beats,
  projects: Array.isArray(live.projects) && live.projects.length ? live.projects : local.projects,
  services: Array.isArray(live.services) && live.services.length ? live.services : local.services,
  stems: Array.isArray(live.stems) && live.stems.length ? live.stems : local.stems,
  about: { ...(local.about || {}), ...(live.about || {}) },
  contact: { ...(local.contact || {}), ...(live.contact || {}) },
  hero: { ...(local.hero || {}), ...(live.hero || {}) },
  seo: { ...(local.seo || {}), ...(live.seo || {}) },
  theme: { ...(local.theme || {}), ...(live.theme || {}) },
  nav: Array.isArray(live.nav) && live.nav.length ? live.nav : local.nav,
};

delete content.beatPrice;

const res = await fetch('https://kxrgx.vercel.app/api/content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Admin-Password': password,
  },
  body: JSON.stringify({ password, content }),
});

console.log('save:', res.status, await res.json());
const check = await (await fetch('https://kxrgx.vercel.app/api/content', { cache: 'no-store' })).json();
console.log('beatPrice?', check.beatPrice);
console.log('beats:', (check.beats || []).map((b) => `${b.number}:${b.sold ? 'SOLD' : 'sale'}:${(b.audio || '').slice(0, 40)}`));

import { readFileSync } from 'node:fs';

const content = JSON.parse(readFileSync(new URL('../public/site-content.json', import.meta.url), 'utf8'));

const liveProbe = await fetch('https://kxrgx.vercel.app/api/content', { cache: 'no-store' });
const live = await liveProbe.json();
const password = live?.admin?.password || content.admin?.password || 'Gülpembe3169';
console.log('using password chars:', [...password].map((c) => c.charCodeAt(0)).join(','));

const body = JSON.stringify({ password, content });

const res = await fetch('https://kxrgx.vercel.app/api/content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Admin-Password': password,
  },
  body,
});

console.log('save:', res.status, await res.json());

const check = await fetch('https://kxrgx.vercel.app/api/content', { cache: 'no-store' });
const fixed = await check.json();
console.log('roleTR:', fixed.roleTR);
console.log('about head:', fixed.about?.textTR?.slice(0, 140));
console.log('admin password:', fixed.admin?.password);
console.log('contact:', fixed.contact?.textTR);

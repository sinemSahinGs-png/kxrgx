import { writeFileSync } from 'node:fs';
import { aboutCopy } from '../src/data/about.js';
import { projects } from '../src/data/projects.js';
import { beats, stems } from '../src/data/beats.js';
import { services } from '../src/data/services.js';
import { site, NAV } from '../src/config/site.js';

const data = {
  version: 2,
  admin: { password: 'Gülpembe3169' },
  brand: site.brand,
  roleTR: site.roleTR,
  roleEN: site.roleEN,
  email: site.email,
  instagramHandle: site.instagramHandle,
  instagramUrl: site.instagramUrl,
  instagramDmUrl: site.instagramDmUrl,
  seo: { ...site.seo },
  portraitTop: site.portraitTop,
  portraitBottom: site.portraitBottom,
  crowFeather: site.crowFeather,
  aboutCutout: site.aboutCutout,
  heroVideo: site.heroVideo,
  beatPrice: site.beatPrice,
  radioPlaylistId: site.radioPlaylistId,
  hero: {
    copy: 'Karanlık atmosferler, özgün prodüksiyonlar.',
    cta: 'Projeleri Dinle',
  },
  about: {
    titleTR: 'TANITIM',
    titleEN: 'ABOUT',
    textTR: aboutCopy.tr,
    textEN: aboutCopy.en,
    cutout: site.aboutCutout,
  },
  nav: NAV.map((n) => ({ ...n })),
  projects: projects.map((p) => ({ ...p })),
  beats: beats.map((b) => ({ ...b })),
  stems: [...stems],
  services: services.map((s) => ({ ...s })),
  contact: {
    textTR: 'Tüm işbirliklerine açığım, hizmetler için iletişime geçebilirsiniz.',
    cta: 'INSTAGRAM DM',
  },
  theme: {
    bg: '#18181c',
    bg2: '#222228',
    accent: '#9b6dff',
    text: '#f2f2ef',
  },
};

writeFileSync('public/site-content.json', JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('wrote site-content.json v2');

import { site, NAV } from '../config/site.js';
import { projects } from '../data/projects.js';
import { beats, stems } from '../data/beats.js';
import { services } from '../data/services.js';
import { aboutCopy } from '../data/about.js';

/** Runtime site copy — editable via admin / site-content.json */
export const content = {
  heroCopy: 'Karanlık atmosferler, özgün prodüksiyonlar.',
  heroCta: 'Projeleri Dinle',
  contactText: 'Tüm işbirliklerine açığım, hizmetler için iletişime geçebilirsiniz.',
  contactCta: 'INSTAGRAM DM',
  aboutTitleTR: 'TANITIM',
  aboutTitleEN: 'ABOUT',
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function buildDefaultContent() {
  return {
    version: 2,
    admin: { password: 'Gülpembe3169' },
    brand: site.brand,
    roleTR: site.roleTR,
    roleEN: site.roleEN,
    email: site.email,
    instagramHandle: site.instagramHandle,
    instagramUrl: site.instagramUrl,
    instagramDmUrl: site.instagramDmUrl,
    spotifyUrl: site.spotifyUrl,
    spotifyLabel: site.spotifyLabel,
    seo: { ...site.seo },
    portraitTop: site.portraitTop,
    portraitBottom: site.portraitBottom,
    crowFeather: site.crowFeather,
    aboutCutout: site.aboutCutout,
    heroVideo: site.heroVideo,
    radioPlaylistId: site.radioPlaylistId,
    hero: {
      copy: content.heroCopy,
      cta: content.heroCta,
    },
    about: {
      titleTR: 'TANITIM',
      titleEN: 'ABOUT',
      textTR: aboutCopy.tr,
      textEN: aboutCopy.en,
      cutout: site.aboutCutout,
    },
    nav: clone(NAV),
    projects: clone(projects),
    beats: clone(beats),
    stems: clone(stems),
    services: clone(services),
    contact: {
      textTR: content.contactText,
      cta: content.contactCta,
    },
    theme: {
      bg: '#18181c',
      bg2: '#222228',
      accent: '#9b6dff',
      text: '#f2f2ef',
    },
  };
}

function replaceArray(target, next) {
  if (!Array.isArray(next)) return;
  target.splice(0, target.length, ...next);
}

export function applyContent(data) {
  if (!data || typeof data !== 'object') return;

  if (data.brand != null) site.brand = data.brand;
  if (data.roleTR != null) site.roleTR = data.roleTR;
  if (data.roleEN != null) site.roleEN = data.roleEN;
  if (data.email != null) site.email = data.email;
  if (data.instagramHandle != null) site.instagramHandle = data.instagramHandle;
  if (data.instagramUrl != null) site.instagramUrl = data.instagramUrl;
  if (data.instagramDmUrl != null) site.instagramDmUrl = data.instagramDmUrl;
  if (data.spotifyUrl != null) site.spotifyUrl = data.spotifyUrl;
  if (data.spotifyLabel != null) site.spotifyLabel = data.spotifyLabel;
  if (data.portraitTop != null) {
    site.portraitTop = data.portraitTop;
    site.portrait = data.portraitTop;
  }
  if (data.portraitBottom != null) site.portraitBottom = data.portraitBottom;
  if (data.crowFeather != null) site.crowFeather = data.crowFeather;
  if (data.aboutCutout != null) site.aboutCutout = data.aboutCutout;
  if (data.heroVideo != null) site.heroVideo = data.heroVideo;
  if (data.radioPlaylistId != null) site.radioPlaylistId = data.radioPlaylistId;
  if (data.seo) Object.assign(site.seo, data.seo);

  if (data.hero) {
    if (data.hero.copy != null) content.heroCopy = data.hero.copy;
    if (data.hero.cta != null) content.heroCta = data.hero.cta;
  }

  if (data.about) {
    if (data.about.textTR != null) aboutCopy.tr = data.about.textTR;
    if (data.about.textEN != null) aboutCopy.en = data.about.textEN;
    if (data.about.cutout != null) site.aboutCutout = data.about.cutout;
    if (data.about.titleTR != null) content.aboutTitleTR = data.about.titleTR;
    if (data.about.titleEN != null) content.aboutTitleEN = data.about.titleEN;
  }

  if (data.contact) {
    if (data.contact.textTR != null) content.contactText = data.contact.textTR;
    if (data.contact.cta != null) content.contactCta = data.contact.cta;
  }

  if (Array.isArray(data.nav)) replaceArray(NAV, data.nav);
  if (Array.isArray(data.projects)) replaceArray(projects, data.projects);
  if (Array.isArray(data.beats)) replaceArray(beats, data.beats);
  if (Array.isArray(data.stems)) replaceArray(stems, data.stems);
  if (Array.isArray(data.services)) replaceArray(services, data.services);

  if (data.theme) {
    const root = document.documentElement;
    if (data.theme.bg) root.style.setProperty('--bg', data.theme.bg);
    if (data.theme.bg2) root.style.setProperty('--bg-2', data.theme.bg2);
    if (data.theme.accent) root.style.setProperty('--accent', data.theme.accent);
    if (data.theme.text) root.style.setProperty('--text', data.theme.text);
  }
}

export async function loadSiteContent() {
  try {
    const res = await fetch('/api/content', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.version === 2) {
        applyContent(data);
        return data;
      }
    }
  } catch {
    /* fall through */
  }

  try {
    const res = await fetch(`${import.meta.env.BASE_URL}site-content.json`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.version === 2) {
        applyContent(data);
        return data;
      }
    }
  } catch {
    /* keep defaults */
  }

  return buildDefaultContent();
}

/** Site-wide config — edit contact, radio, SEO here */

export const site = {
  brand: 'KXRGX',
  roleTR: 'Müzik Prodüktörü ve Ses Tasarımcısı',
  roleEN: 'Music Producer & Sound Designer',
  years: '7+',
  productions: '50+',
  email: 'ktyglc@gmail.com',
  instagramHandle: '@kxrgx',
  instagramUrl: 'https://www.instagram.com/kxrgx/',
  instagramDmUrl: 'https://ig.me/m/kxrgx',
  seo: {
    title: 'KXRGX — Music Producer & Sound Designer',
    description:
      'KXRGX is a music producer and sound designer specializing in music production, beat production, sound design, and audio restoration.',
  },
  portrait: '/portrait_top.png',
  portraitTop: '/portrait_top.png',
  portraitBottom: '/portrait_bottom.png',
  crow: './images/crow-placeholder.svg',
  /** Karga tüyü PNG — public/images/crow-feather.png (şeffaf arka plan) */
  crowFeather: '/images/crow-feather.png',
  /** Tanıtım sağ alt — arka plansız PNG: public/images/about-cutout.png */
  aboutCutout: '/images/about-cutout.png',
  /** ~3s hero background — scrubbed by scroll (file: public/videos/kxrgx-hero.mp4) */
  heroVideo: '/videos/kxrgx-hero.mp4',
  beatPrice: '$150–$200',
  /** YouTube playlist ID for KXRGX Radio */
  radioPlaylistId: 'PLeA28ojIFtgQ',
};

export const NAV = [
  { href: '#about', labelTR: 'Hakkında', labelEN: 'About' },
  { href: '#projects', labelTR: 'Projeler', labelEN: 'Projects' },
  { href: '#beats', labelTR: 'Beatler', labelEN: 'Beats' },
  { href: '#services', labelTR: 'Hizmetler', labelEN: 'Services' },
  { href: '#contact', labelTR: 'İletişim', labelEN: 'Contact' },
];

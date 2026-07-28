import { esc } from '../utils/escape.js';

/** Mobile-only section dots — desktop nav unchanged */
const SECTIONS = [
  { href: '#hero', labelTR: 'Giriş' },
  { href: '#about', labelTR: 'Hakkında' },
  { href: '#projects', labelTR: 'Projeler' },
  { href: '#beats', labelTR: 'Beat Satışı' },
  { href: '#services', labelTR: 'Hizmetler' },
  { href: '#contact', labelTR: 'İletişim' },
  { href: '#site-footer', labelTR: 'KXRGX' },
];

export function renderSectionNav() {
  return `
  <nav class="section-nav" aria-label="Bölüm geçişi">
    ${SECTIONS.map(
      (item) => `
      <a
        class="section-nav__dot"
        href="${esc(item.href)}"
        data-section="${esc(item.href.slice(1))}"
        aria-label="${esc(item.labelTR)}"
        title="${esc(item.labelTR)}"
      >
        <span class="section-nav__label">${esc(item.labelTR)}</span>
      </a>`
    ).join('')}
  </nav>`;
}

export function initSectionNav() {
  const nav = document.querySelector('.section-nav');
  if (!nav) return;

  const dots = [...nav.querySelectorAll('.section-nav__dot')];
  const targets = dots
    .map((dot) => {
      const id = dot.dataset.section;
      const el = document.getElementById(id);
      return el ? { el, dot, id } : null;
    })
    .filter(Boolean);

  if (!targets.length) return;

  function setActive(id) {
    dots.forEach((dot) => {
      const on = dot.dataset.section === id;
      dot.classList.toggle('is-active', on);
      if (on) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActive(visible[0].target.id);
    },
    { threshold: [0.15, 0.35, 0.55], rootMargin: '-20% 0px -35% 0px' }
  );

  targets.forEach(({ el }) => io.observe(el));

  const hero = document.getElementById('hero');
  if (hero && window.scrollY < 80) setActive('hero');
}

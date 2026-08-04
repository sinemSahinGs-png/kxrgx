import { esc } from '../utils/escape.js';

/** Mobile-only section dots — desktop nav unchanged */
const SECTIONS = [
  { href: '#hero', labelTR: 'Giriş' },
  { href: '#about', labelTR: 'Hakkında' },
  { href: '#projects', labelTR: 'Projeler' },
  { href: '#beats', labelTR: 'Beatler' },
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

  let activeId = '';
  let labelTimer = 0;
  let raf = 0;

  function clearLabels() {
    dots.forEach((dot) => dot.classList.remove('is-label-on'));
  }

  function flashLabel(dot) {
    clearLabels();
    if (!dot) return;
    dot.classList.add('is-label-on');
    clearTimeout(labelTimer);
    labelTimer = window.setTimeout(() => {
      dot.classList.remove('is-label-on');
    }, 1400);
  }

  function setActive(id, { announce = true } = {}) {
    if (id === activeId) return;
    activeId = id;
    let activeDot = null;
    dots.forEach((dot) => {
      const on = dot.dataset.section === id;
      dot.classList.toggle('is-active', on);
      if (on) {
        activeDot = dot;
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
    if (announce) flashLabel(activeDot);
  }

  function spy() {
    raf = 0;
    const vh = window.innerHeight;
    const focus = vh * 0.38;
    let best = null;
    let bestDist = Infinity;

    targets.forEach(({ el, id }) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < vh * 0.1 || rect.top > vh * 0.92) return;
      const mid = rect.top + Math.min(rect.height, vh) * 0.35;
      const dist = Math.abs(mid - focus);
      if (dist < bestDist) {
        bestDist = dist;
        best = id;
      }
    });

    if (best) setActive(best);
  }

  function requestSpy() {
    if (raf) return;
    raf = requestAnimationFrame(spy);
  }

  window.addEventListener('scroll', requestSpy, { passive: true });
  window.addEventListener('resize', requestSpy);

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      flashLabel(dot);
    });
  });

  spy();
}

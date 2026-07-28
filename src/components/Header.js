import { NAV, site } from '../config/site.js';
import { esc } from '../utils/escape.js';

export function renderHeader() {
  const links = NAV.map(
    (item) =>
      `<a href="${esc(item.href)}" class="nav-link"><span class="nav-tr">${esc(item.labelTR)}</span><span class="nav-en" lang="en">${esc(item.labelEN)}</span></a>`
  ).join('');

  return `
  <header class="site-header" id="top">
    <div class="site-header__inner">
      <a class="brand" href="#top">${esc(site.brand)}</a>
      <nav class="site-nav" aria-label="Primary">
        ${links}
      </nav>
      <button type="button" class="menu-toggle" aria-expanded="false" aria-controls="mobile-nav" aria-label="Menüyü aç">
        <span></span><span></span>
      </button>
    </div>
    <div class="mobile-nav" id="mobile-nav" hidden>
      <nav aria-label="Mobile">
        ${links}
      </nav>
    </div>
  </header>`;
}

export function initHeader() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const mobile = document.querySelector('.mobile-nav');
  if (!header || !toggle || !mobile) return;

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    mobile.hidden = !open;
    document.body.classList.toggle('nav-open', open);
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  mobile.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setOpen(false));
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
}

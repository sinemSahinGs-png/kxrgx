/** Scroll-linked color, shimmer, services + global text motion */
import { initCrowFeathers } from './crowFeathers.js';

export function initAnimations() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    document.querySelectorAll('[data-services], [data-text-section], [data-hero-text]').forEach((el) => {
      el.classList.add('is-visible', 'motion-ready');
    });
    document.querySelectorAll('[data-service-item]').forEach((el) => el.classList.add('is-visible'));
    return;
  }

  initSiteBackground();
  initCrowFeathers();
  initHeroText();
  initAboutScrollColor();
  initTextSections();
  initServicesReveal();
  initTextShimmer();
}

function initSiteBackground() {
  if (document.querySelector('.site-bg')) return;
  const bg = document.createElement('div');
  bg.className = 'site-bg';
  bg.setAttribute('aria-hidden', 'true');
  document.body.prepend(bg);
}

function initHeroText() {
  const hero = document.querySelector('[data-hero-text]');
  if (!hero) return;
  requestAnimationFrame(() => hero.classList.add('is-visible', 'motion-ready'));
}

function initAboutScrollColor() {
  const about = document.querySelector('[data-about]');
  if (!about) return;

  const words = about.querySelectorAll('.word');
  const mq = window.matchMedia('(max-width: 768px)');

  function update() {
    if (!mq.matches) {
      words.forEach((w) => w.classList.remove('is-lit'));
      return;
    }

    const vh = window.innerHeight;
    const zoneStart = vh * 0.92;
    const zoneEnd = vh * 0.12;

    words.forEach((word) => {
      const top = word.getBoundingClientRect().top;
      const t = (zoneStart - top) / (zoneStart - zoneEnd);
      if (t > 0.08) word.classList.add('is-lit');
      else word.classList.remove('is-lit');
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

function initTextSections() {
  const sections = document.querySelectorAll('[data-text-section], [data-text-block]');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('motion-ready');
        if (entry.target.matches('[data-text-section]')) {
          entry.target.classList.add('is-visible');
        }
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
  );
  sections.forEach((el) => io.observe(el));
}

function initServicesReveal() {
  const panel = document.querySelector('[data-services]');
  if (!panel) return;

  const items = panel.querySelectorAll('[data-service-item]');

  const panelIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        setTimeout(() => entry.target.classList.add('shimmer-ready'), 2000);
        panelIo.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
  );
  panelIo.observe(panel);

  const itemIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        itemIo.unobserve(entry.target);
      });
    },
    { threshold: 0.65, rootMargin: '0px 0px -10% 0px' }
  );
  items.forEach((el) => itemIo.observe(el));
}

function initTextShimmer() {
  const targets = document.querySelectorAll('[data-about], .site-footer__inner, [data-services]');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (entry.target.matches('[data-services]')) return;
        setTimeout(() => entry.target.classList.add('shimmer-ready'), 2400);
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.25 }
  );
  targets.forEach((el) => io.observe(el));
}

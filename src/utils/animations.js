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
  initMobileProjectColor();
  initMobileBeatGlow();
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
  const mq = window.matchMedia('(max-width: 899px)');
  let raf = 0;

  function paint() {
    raf = 0;
    if (!mq.matches) {
      words.forEach((w) => {
        w.classList.remove('is-lit');
        w.style.removeProperty('--lit');
      });
      return;
    }

    const vh = window.innerHeight;
    const start = vh * 0.9;
    const end = vh * 0.22;

    words.forEach((word) => {
      const top = word.getBoundingClientRect().top;
      let t = (start - top) / (start - end);
      t = Math.min(1, Math.max(0, t));
      const lit = t * t * (3 - 2 * t);
      word.style.setProperty('--lit', lit.toFixed(3));
      word.classList.toggle('is-lit', lit > 0.12);
    });
  }

  function requestPaint() {
    if (raf) return;
    raf = requestAnimationFrame(paint);
  }

  window.addEventListener('scroll', requestPaint, { passive: true });
  window.addEventListener('resize', requestPaint);
  requestPaint();
}

/** Mobile: projects colorize smoothly as they enter the viewport center */
function initMobileProjectColor() {
  const cards = [...document.querySelectorAll('.project-card:not(.project-card--soon)')];
  if (!cards.length) return;

  const mq = window.matchMedia('(max-width: 899px)');
  let raf = 0;

  function paint() {
    raf = 0;
    if (!mq.matches) {
      cards.forEach((card) => {
        card.style.removeProperty('--gs');
        card.classList.remove('is-colored');
      });
      return;
    }

    const vh = window.innerHeight;
    const focus = vh * 0.42;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const mid = rect.top + rect.height * 0.45;
      const dist = Math.abs(mid - focus);
      const range = vh * 0.48;
      const t = Math.min(1, Math.max(0, 1 - dist / range));
      // Slow ease: grayscale 1 → 0
      const eased = t * t * (3 - 2 * t);
      const gs = 1 - eased;
      card.style.setProperty('--gs', gs.toFixed(3));
      card.classList.toggle('is-colored', eased > 0.55);
    });
  }

  function requestPaint() {
    if (raf) return;
    raf = requestAnimationFrame(paint);
  }

  window.addEventListener('scroll', requestPaint, { passive: true });
  window.addEventListener('resize', requestPaint);
  requestPaint();
}

/** Mobile: the beat nearest viewport center glows white like desktop hover */
function initMobileBeatGlow() {
  const cards = [...document.querySelectorAll('.beat-card')];
  if (!cards.length) return;

  const mq = window.matchMedia('(max-width: 899px)');
  let raf = 0;
  let active = null;

  function paint() {
    raf = 0;
    if (!mq.matches) {
      if (active) {
        active.classList.remove('is-scroll-lit');
        active = null;
      }
      cards.forEach((c) => c.classList.remove('is-scroll-lit'));
      return;
    }

    const vh = window.innerHeight;
    const focus = vh * 0.48;
    let best = null;
    let bestDist = Infinity;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (rect.bottom < vh * 0.08 || rect.top > vh * 0.92) return;
      const mid = rect.top + rect.height * 0.5;
      const dist = Math.abs(mid - focus);
      if (dist < bestDist) {
        bestDist = dist;
        best = card;
      }
    });

    if (best !== active) {
      if (active) active.classList.remove('is-scroll-lit');
      if (best) best.classList.add('is-scroll-lit');
      active = best;
    }
  }

  function requestPaint() {
    if (raf) return;
    raf = requestAnimationFrame(paint);
  }

  window.addEventListener('scroll', requestPaint, { passive: true });
  window.addEventListener('resize', requestPaint);
  requestPaint();
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

import { site } from '../config/site.js';

/** Drifting crow feathers — hidden over hero, start below it */
export function initCrowFeathers() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (document.querySelector('.crow-feathers')) return;

  const featherSrc = site.crowFeather || '/images/crow-feather.svg';

  const layer = document.createElement('div');
  layer.className = 'crow-feathers';
  layer.setAttribute('aria-hidden', 'true');

  const count = window.innerWidth < 768 ? 12 : 20;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'crow-feather';
    el.style.setProperty('--fi', String(i));
    el.style.setProperty('--fd', `${18 + (i % 5) * 4}s`);
    el.style.setProperty('--fx', `${(i * 17 + 5) % 94}%`);
    el.style.setProperty('--fr', `${-55 + (i * 31) % 110}deg`);
    el.style.setProperty('--fs', `${0.65 + (i % 4) * 0.14}`);
    el.style.setProperty('--sway', `${-12 + (i % 7) * 4}deg`);
    if (i % 2 === 0) el.style.setProperty('--flip', '-1');
    el.innerHTML = `<img class="crow-feather__img" src="${featherSrc}" alt="" width="48" height="160" decoding="async" draggable="false" />`;
    layer.appendChild(el);
  }

  document.body.appendChild(layer);

  function syncFeatherBounds() {
    const hero = document.querySelector('.hero');
    if (!hero) {
      layer.style.top = '0';
      return;
    }

    const rect = hero.getBoundingClientRect();
    const vh = window.innerHeight;
    const heroOnScreen = rect.bottom > 0 && rect.top < vh;

    if (heroOnScreen) {
      layer.style.top = `${Math.max(0, Math.min(vh, rect.bottom))}px`;
    } else {
      layer.style.top = '0';
    }
  }

  syncFeatherBounds();
  window.addEventListener('scroll', syncFeatherBounds, { passive: true });
  window.addEventListener('resize', syncFeatherBounds);
}

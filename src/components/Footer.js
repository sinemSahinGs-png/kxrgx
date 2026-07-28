import { site } from '../config/site.js';
import { esc } from '../utils/escape.js';

const footerTop = '/portrait_top.png';
const footerReveal = '/portrait_bottom.png';

const spotifyIcon = `
  <svg class="site-footer__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>`;

export function renderFooter() {
  const year = new Date().getFullYear();
  const spotifyUrl = site.spotifyUrl || '';
  const spotifyLabel = site.spotifyLabel || 'Spotify';

  return `
  <footer class="site-footer" id="site-footer">
    <div class="site-footer__stage">
      <canvas class="footer-portrait-canvas" aria-hidden="true"></canvas>
      <img
        class="footer-portrait-fallback"
        src="${esc(footerTop)}"
        alt=""
        width="1200"
        height="1500"
        decoding="async"
        loading="lazy"
        hidden
      />
      <div class="site-footer__scrim" aria-hidden="true"></div>
      <div class="site-footer__inner" data-reveal>
        <p class="site-footer__brand heading-slide text-hover">${esc(site.brand)}</p>
        <p class="site-footer__role en heading-slide text-hover" lang="en">${esc(site.roleEN)}</p>
        <p class="site-footer__role tr heading-slide text-hover">${esc(site.roleTR)}</p>
        <div class="site-footer__links heading-slide">
          <a class="text-hover" href="${esc(site.instagramUrl)}" target="_blank" rel="noopener noreferrer">${esc(site.instagramHandle)}</a>
          <a class="text-hover" href="mailto:${esc(site.email)}">${esc(site.email)}</a>
        </div>
        ${
          spotifyUrl
            ? `<div class="site-footer__social heading-slide">
          <a
            class="site-footer__spotify"
            href="${esc(spotifyUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            lang="en"
            aria-label="${esc(spotifyLabel)} — ${esc(site.brand)}"
            title="${esc(spotifyLabel)}"
          >
            ${spotifyIcon}
            <span>${esc(spotifyLabel)}</span>
          </a>
        </div>`
            : ''
        }
        <p class="site-footer__copy heading-slide">© ${year} ${esc(site.brand)}</p>
      </div>
    </div>
  </footer>`;
}

export async function initFooterPortrait() {
  const stage = document.querySelector('.site-footer__stage');
  const canvas = document.querySelector('.footer-portrait-canvas');
  const fallback = document.querySelector('.footer-portrait-fallback');
  if (!stage || !canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    canvas.hidden = true;
    if (fallback) fallback.hidden = false;
    return;
  }

  let started = false;

  async function startFluid() {
    if (started) return;
    started = true;

    try {
      const { initFluidPortrait } = await import('../lib/fluidPortrait.js');
      stage.classList.add('is-auto');

      initFluidPortrait({
        canvas,
        frame: stage,
        topPath: footerTop,
        bottomPath: footerReveal,
        fallbackEl: fallback,
        forceAuto: true,
        getForceAuto: () => true,
        config: {
          idleThresholdMs: 200,
          idleEaseInMs: 800,
          autoLerp: 0.09,
          lineWidth: 0.11,
          perFrameIntensity: 0.38,
          decay: 0.955,
        },
      });
    } catch {
      canvas.hidden = true;
      if (fallback) fallback.hidden = false;
    }
  }

  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        startFluid();
        io.disconnect();
      }
    },
    { threshold: 0.08, rootMargin: '120px 0px' }
  );
  io.observe(stage);

  if (stage.getBoundingClientRect().top < window.innerHeight) startFluid();
}

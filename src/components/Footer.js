import { site } from '../config/site.js';
import { esc } from '../utils/escape.js';

const footerTop = '/portrait_top.png';
const footerReveal = '/portrait_bottom.png';

export function renderFooter() {
  const year = new Date().getFullYear();

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

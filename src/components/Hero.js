import { site } from '../config/site.js';
import { content } from '../lib/content.js';
import { esc, inlineWords } from '../utils/escape.js';

export function renderHero() {
  const videoSrc = site.heroVideo || '/videos/kxrgx-hero.mp4';
  const { html: copyHtml } = inlineWords(content.heroCopy || 'Karanlık atmosferler, özgün prodüksiyonlar.', 0);
  const primaryCta = content.heroCta || 'Projeler';

  return `
  <section class="hero" id="hero" aria-label="Hero" data-hero-text>
    <div class="hero__sticky">
      <video
        class="hero-video"
        src="${esc(videoSrc)}"
        autoplay
        muted
        loop
        playsinline
        webkit-playsinline
        preload="auto"
        disablepictureinpicture
        disableremoteplayback
        aria-hidden="true"
      ></video>
      <div class="hero-scrim" aria-hidden="true"></div>
      <div class="hero-content">
        <p class="hero-meta text-hover" lang="en">${esc(site.roleEN)}</p>
        <h1>
          ${esc(site.brand)}
          <span class="synthetic-line"><em class="text-hover">${esc(site.roleTR)}</em></span>
        </h1>
        <p class="hero-copy text-anim text-anim--hero">${copyHtml}</p>
        <div class="hero-actions">
          <a class="btn btn--glow hero-play text-hover" href="#projects">${esc(primaryCta)}</a>
          <a class="btn btn--glow hero-play text-hover" href="#beats">Beatler</a>
        </div>
      </div>
    </div>
  </section>`;
}

import { site } from '../config/site.js';
import { aboutCopy } from '../data/about.js';
import { content } from '../lib/content.js';
import { esc, paragraphsAnimated } from '../utils/escape.js';

export function renderAbout() {
  const cutout = site.aboutCutout
    ? `
    <figure class="about__cutout" aria-hidden="true">
      <img
        src="${esc(site.aboutCutout)}"
        alt=""
        width="640"
        height="800"
        decoding="async"
        loading="lazy"
      />
    </figure>`
    : '';

  const titleTR = content.aboutTitleTR || 'TANITIM';
  const titleEN = content.aboutTitleEN || 'ABOUT';

  return `
  <section class="about" id="about" data-reveal data-about>
    <div class="about__inner">
      <header class="section-head">
        <h2 class="section-title heading-reveal">
          <span class="tr">${esc(titleTR)}</span>
          <span class="en" lang="en">${esc(titleEN)}</span>
        </h2>
      </header>
      <div class="about__grid">
        <article class="lang-block">
          <p class="lang-tag">TR</p>
          <div class="prose prose--animated">${paragraphsAnimated(aboutCopy.tr)}</div>
        </article>
        <article class="lang-block">
          <p class="lang-tag" lang="en">EN</p>
          <div class="prose prose--en prose--animated" lang="en">${paragraphsAnimated(aboutCopy.en)}</div>
        </article>
      </div>
    </div>
    ${cutout}
  </section>`;
}

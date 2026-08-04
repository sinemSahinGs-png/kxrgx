import { site } from '../config/site.js';
import { beats, stems } from '../data/beats.js';
import { content } from '../lib/content.js';
import { esc, lineAnimated } from '../utils/escape.js';
import { beatCardMarkup, initBeatPlayers } from './BeatPlayer.js';
import { renderServices } from './Services.js';

export function renderBeatStore() {
  let wi = 0;
  const deliveryTr = lineAnimated(
    'Satış sonrasında drums, kick, melodies, bass ve FX kanalları ayrı stem dosyaları hâlinde teslim edilir.',
    'rise',
    wi
  );
  wi = deliveryTr.nextIndex;
  const deliveryEn = lineAnimated(
    'After purchase, drums, kick, melodies, bass, and FX will be delivered as separate stem files.',
    'drift',
    wi
  );
  wi = deliveryEn.nextIndex;
  const contactLead = lineAnimated(content.contactText, 'rise', wi);

  return `
  <section class="section beats" id="beats" data-reveal data-text-section>
    <header class="section-head">
      <h2 class="section-title heading-reveal">
        <span class="tr">BEAT'LER</span>
        <span class="en" lang="en">BEATS</span>
      </h2>
    </header>

    <div class="beats-layout">
      <div class="beats-main">
        <div class="beats-pricing" data-text-block>
          <p class="beats-include">
            <span class="en text-hover" lang="en">BEAT + WAV STEMS INCLUDED</span>
            <span class="tr text-hover">BEAT + WAV STEM DOSYALARI DAHİL</span>
          </p>
          ${deliveryTr.html.replace('class="text-anim', 'class="beats-delivery tr text-anim')}
          ${deliveryEn.html.replace('class="text-anim', 'class="beats-delivery en text-anim')}
          <ul class="stem-list">
            ${stems.map((s, i) => `<li class="text-anim text-anim--stem" style="--wi:${i}">${esc(s)}</li>`).join('')}
          </ul>
        </div>

        <div class="beats-services-slot">
          ${renderServices()}
        </div>

        <div class="beats-grid">
          ${beats.filter((b) => b.audio).map(beatCardMarkup).join('')}
        </div>

        <div class="beats-cta contact" id="contact" data-text-block>
          <header class="section-head beats-cta__head">
            <h2 class="section-title heading-reveal">
              <span class="tr">İLETİŞİM</span>
              <span class="en" lang="en">CONTACT</span>
            </h2>
          </header>
          ${contactLead.html.replace('class="text-anim', 'class="tr text-anim')}
          <a
            class="btn btn--glow btn--instagram"
            href="${esc(site.instagramUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            lang="en"
          >${esc(content.contactCta || 'Instagram')}</a>
        </div>
      </div>

      <aside class="beats-aside" aria-hidden="true"></aside>
    </div>
  </section>`;
}

export function initBeatStore() {
  const slot = document.querySelector('.beats-services-slot');
  const aside = document.querySelector('.beats-aside');
  const mq = window.matchMedia('(min-width: 1024px)');

  function placeServices() {
    const panel = document.getElementById('services');
    if (!panel || !slot || !aside) return;
    if (mq.matches) {
      aside.appendChild(panel);
      aside.removeAttribute('aria-hidden');
    } else {
      slot.appendChild(panel);
      aside.setAttribute('aria-hidden', 'true');
    }
  }

  placeServices();
  mq.addEventListener('change', placeServices);
  initBeatPlayers(document.querySelector('.beats'));
}

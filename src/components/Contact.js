import { site } from '../config/site.js';
import { esc } from '../utils/escape.js';

export function renderContact() {
  return `
  <section class="section contact" id="contact" data-reveal>
    <header class="section-head">
      <h2 class="section-title">
        <span class="tr">İLETİŞİM</span>
        <span class="en">CONTACT</span>
      </h2>
    </header>
    <div class="contact__inner">
      <p class="contact__lead tr">Yeni bir prodüksiyon, sound design projesi veya beat lisansı için iletişime geç.</p>
      <p class="contact__lead en">Get in touch for a new production, sound design project, or beat license.</p>
      <div class="contact__actions">
        <a class="btn btn--primary" href="${esc(site.instagramDmUrl || site.instagramUrl)}" target="_blank" rel="noopener noreferrer">
          ${esc(site.instagramHandle)}
        </a>
        <a class="btn btn--ghost" href="mailto:${esc(site.email)}">
          ${esc(site.email)}
        </a>
      </div>
    </div>
  </section>`;
}

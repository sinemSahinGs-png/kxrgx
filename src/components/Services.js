import { services } from '../data/services.js';
import { esc } from '../utils/escape.js';

export function renderServices() {
  return `
  <div class="services-panel" id="services" data-services>
    <h3 class="services-panel__title services-title-reveal">
      <span class="tr">HİZMETLER</span>
      <span class="en" lang="en">SERVICES</span>
    </h3>
    <ul class="services-list">
      ${services
        .map(
          (s, i) => `
        <li class="services-list__item" data-service-item style="--si:${i}">
          <span class="services-list__mark" aria-hidden="true">
            <span class="services-list__dot"></span>
          </span>
          <span class="services-list__text">
            <span class="en text-hover" lang="en">${esc(s.en)}</span>
            <span class="tr text-hover">${esc(s.tr)}</span>
          </span>
        </li>`
        )
        .join('')}
    </ul>
  </div>`;
}

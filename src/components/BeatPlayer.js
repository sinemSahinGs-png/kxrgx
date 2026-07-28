import { claimPlayback, formatTime, releasePlayback } from '../utils/audioManager.js';
import { esc } from '../utils/escape.js';
import { site } from '../config/site.js';

export function beatCardMarkup(beat) {
  const dm = site.instagramDmUrl || site.instagramUrl;
  return `
  <article class="beat-card" data-beat-id="${esc(beat.id)}">
    <div class="beat-card__top">
      <p class="beat-card__number">${esc(beat.number)}</p>
      <p class="beat-card__sale">FOR SALE</p>
    </div>
    <div class="beat-player" data-audio-src="${esc(beat.audio)}">
      <button type="button" class="beat-play" aria-label="${esc(beat.number)} play" data-beat-toggle>
        <span class="beat-play__icon" aria-hidden="true"></span>
      </button>
      <div class="beat-player__meta">
        <div class="beat-progress" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="İlerleme" tabindex="0" data-beat-progress>
          <span class="beat-progress__fill" data-beat-fill></span>
        </div>
        <div class="beat-player__times">
          <span data-beat-current>0:00</span>
          <span data-beat-duration>0:00</span>
        </div>
      </div>
      <p class="beat-soon" hidden>
        <span class="tr">ÖN İZLEME YAKINDA</span>
        <span class="en" lang="en">PREVIEW COMING SOON</span>
      </p>
    </div>
    <a
      class="btn btn--glow btn--small beat-card__cta"
      href="${esc(dm)}"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span class="tr">İLETİŞİME GEÇ</span>
      <span class="en" lang="en">GET IN TOUCH</span>
    </a>
  </article>`;
}

export function initBeatPlayers(root = document) {
  root.querySelectorAll('.beat-player').forEach((el) => setupBeatPlayer(el));
}

function setupBeatPlayer(root) {
  const src = root.dataset.audioSrc;
  const toggle = root.querySelector('[data-beat-toggle]');
  const fill = root.querySelector('[data-beat-fill]');
  const progress = root.querySelector('[data-beat-progress]');
  const currentEl = root.querySelector('[data-beat-current]');
  const durationEl = root.querySelector('[data-beat-duration]');
  const soon = root.querySelector('.beat-soon');
  if (!toggle || !fill || !progress || !currentEl || !durationEl || !soon) return;

  const audio = new Audio();
  audio.preload = 'metadata';
  let available = false;
  let seeking = false;

  const api = {
    stop() {
      audio.pause();
      audio.currentTime = 0;
      root.classList.remove('is-playing');
      toggle.setAttribute('aria-label', `${root.closest('[data-beat-id]')?.dataset.beatId || 'Beat'} play`);
      releasePlayback(api);
    },
  };

  function markUnavailable() {
    available = false;
    soon.hidden = false;
    toggle.disabled = true;
    progress.setAttribute('aria-disabled', 'true');
    root.classList.add('is-unavailable');
  }

  function markAvailable() {
    available = true;
    soon.hidden = true;
    toggle.disabled = false;
    durationEl.textContent = formatTime(audio.duration);
  }

  audio.addEventListener('loadedmetadata', markAvailable);
  audio.addEventListener('error', markUnavailable);
  audio.addEventListener('timeupdate', () => {
    if (!available || seeking) return;
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    fill.style.width = `${pct}%`;
    progress.setAttribute('aria-valuenow', String(Math.round(pct)));
    currentEl.textContent = formatTime(audio.currentTime);
  });
  audio.addEventListener('ended', () => {
    root.classList.remove('is-playing');
    fill.style.width = '0%';
    currentEl.textContent = '0:00';
    releasePlayback(api);
  });

  audio.src = src;

  toggle.addEventListener('click', async () => {
    if (!available) return;
    if (audio.paused) {
      claimPlayback(api);
      try {
        await audio.play();
        root.classList.add('is-playing');
        toggle.setAttribute('aria-label', 'Duraklat');
      } catch {
        markUnavailable();
      }
    } else {
      audio.pause();
      root.classList.remove('is-playing');
      toggle.setAttribute('aria-label', 'Oynat');
      releasePlayback(api);
    }
  });

  function seekFromClientX(clientX) {
    if (!available || !audio.duration) return;
    const rect = progress.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    fill.style.width = `${ratio * 100}%`;
    currentEl.textContent = formatTime(audio.currentTime);
  }

  progress.addEventListener('pointerdown', (e) => {
    if (!available) return;
    seeking = true;
    progress.setPointerCapture(e.pointerId);
    seekFromClientX(e.clientX);
  });
  progress.addEventListener('pointermove', (e) => {
    if (!seeking) return;
    seekFromClientX(e.clientX);
  });
  progress.addEventListener('pointerup', () => {
    seeking = false;
  });
  progress.addEventListener('keydown', (e) => {
    if (!available || !audio.duration) return;
    const step = audio.duration * 0.05;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      audio.currentTime = Math.min(audio.duration, audio.currentTime + step);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      audio.currentTime = Math.max(0, audio.currentTime - step);
    }
  });
}

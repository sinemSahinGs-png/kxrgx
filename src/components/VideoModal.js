import { esc } from '../utils/escape.js';

export function renderVideoModal() {
  return `
  <div class="video-modal" id="video-modal" hidden>
    <div class="video-modal__backdrop" data-close-modal tabindex="-1"></div>
    <div class="video-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="video-modal-title">
      <div class="video-modal__bar">
        <h2 id="video-modal-title" class="video-modal__title"></h2>
        <button type="button" class="video-modal__close" data-close-modal aria-label="Kapat">×</button>
      </div>
      <div class="video-modal__frame">
        <div class="video-modal__ratio" id="video-modal-mount"></div>
      </div>
    </div>
  </div>`;
}

export function initVideoModal() {
  const modal = document.getElementById('video-modal');
  const mount = document.getElementById('video-modal-mount');
  const titleEl = document.getElementById('video-modal-title');
  if (!modal || !mount || !titleEl) return;

  let lastFocus = null;

  function close() {
    modal.hidden = true;
    mount.innerHTML = '';
    document.body.classList.remove('modal-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function open(id, title) {
    if (!id) return;
    lastFocus = document.activeElement;
    titleEl.textContent = title || '';
    mount.innerHTML = `<iframe
      src="https://www.youtube-nocookie.com/embed/${esc(id)}?autoplay=1&rel=0"
      title="${esc(title || 'YouTube video')}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
      loading="lazy"
    ></iframe>`;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    modal.querySelector('.video-modal__close')?.focus();
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-video]');
    if (btn) {
      open(btn.dataset.openVideo, btn.dataset.videoTitle);
      return;
    }
    if (e.target.closest('[data-close-modal]')) close();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) close();
  });
}

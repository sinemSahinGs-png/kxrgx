/**
 * Hero background video — autoplay + loop (no scroll scrub).
 */

export function initHeroScrollVideo() {
  const video = document.querySelector('.hero-video');
  if (!video) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  if (reduceMotion) {
    video.loop = false;
    video.removeAttribute('autoplay');
    video.pause();
    video.addEventListener(
      'loadedmetadata',
      () => {
        try {
          video.currentTime = 0;
        } catch {
          /* ignore */
        }
      },
      { once: true }
    );
    return;
  }

  video.loop = true;
  video.setAttribute('loop', '');
  video.setAttribute('autoplay', '');

  async function tryPlay() {
    try {
      const p = video.play();
      if (p && typeof p.then === 'function') await p;
    } catch {
      /* autoplay may be blocked until gesture */
    }
  }

  video.addEventListener('loadedmetadata', tryPlay, { once: true });
  video.addEventListener('canplay', tryPlay, { once: true });
  if (video.readyState >= 2) tryPlay();

  const unlock = () => {
    tryPlay();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('touchstart', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tryPlay();
  });
}

/**
 * Scroll-scrubbed hero background video.
 * Progress through the tall hero section maps to video.currentTime (no autoplay / no loop).
 */

const FALLBACK_DURATION = 3;

export function initHeroScrollVideo() {
  const section = document.querySelector('.hero');
  const video = document.querySelector('.hero-video');
  if (!section || !video) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let duration = FALLBACK_DURATION;
  let targetTime = 0;
  let ready = false;
  let pendingSeek = true;
  let raf = 0;

  function getProgress() {
    const sectionHeight = section.offsetHeight;
    const viewport = window.innerHeight || 1;
    const travel = Math.max(1, sectionHeight - viewport);
    const sectionRect = section.getBoundingClientRect();
    return Math.min(1, Math.max(0, -sectionRect.top / travel));
  }

  function syncTarget() {
    const progress = getProgress();
    const next = progress * duration;
    if (Math.abs(next - targetTime) > 0.001) {
      targetTime = next;
      pendingSeek = true;
    }
  }

  function applySeek() {
    if (!ready || !pendingSeek || video.seeking) return;
    pendingSeek = false;
    const clamped = Math.min(Math.max(targetTime, 0), Math.max(duration - 0.05, 0));
    try {
      if (Math.abs(video.currentTime - clamped) > 0.02) {
        video.currentTime = clamped;
      }
    } catch {
      pendingSeek = true;
    }
  }

  function tick() {
    applySeek();
    raf = requestAnimationFrame(tick);
  }

  video.pause();
  video.loop = false;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.removeAttribute('poster');
  video.removeAttribute('autoplay');

  async function unlockFirstFrame() {
    try {
      const p = video.play();
      if (p && typeof p.then === 'function') await p;
      video.pause();
    } catch {
      /* ignore */
    }
  }

  function onReady() {
    if (video.duration && Number.isFinite(video.duration) && video.duration > 0) {
      duration = video.duration;
    }
    ready = true;
    syncTarget();
    pendingSeek = true;
    unlockFirstFrame().then(() => {
      pendingSeek = true;
      applySeek();
    });
  }

  video.addEventListener('loadedmetadata', onReady, { once: true });
  video.addEventListener('error', () => {
    console.warn('[hero] video failed:', video.currentSrc || video.src, video.error);
  });

  if (video.readyState >= 1) onReady();

  if (reduceMotion) {
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

  syncTarget();
  window.addEventListener('scroll', syncTarget, { passive: true });
  window.addEventListener('resize', syncTarget, { passive: true });
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('scroll', syncTarget);
    window.removeEventListener('resize', syncTarget);
  };
}

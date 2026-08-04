import { site } from '../config/site.js';
import { esc } from '../utils/escape.js';

/** Minimal floating playlist — play/pause toggle + next */
export function renderRadio() {
  if (!site.radioPlaylistId) return '';

  return `
  <div class="site-player" data-radio data-playlist-id="${esc(site.radioPlaylistId)}" aria-label="KXRGX Radio">
    <div class="site-player__host" data-radio-host aria-hidden="true"></div>
    <p class="site-player__label" lang="en">KXRGX RADIO</p>
    <button type="button" class="site-player__btn" data-radio-toggle aria-label="Play" aria-pressed="false">
      <svg class="site-player__icon site-player__icon--play" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7L8 5z"/></svg>
      <svg class="site-player__icon site-player__icon--pause" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z"/></svg>
    </button>
    <button type="button" class="site-player__btn" data-radio-next aria-label="Next">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 6h2v12h-2V6zM5 18l8.5-6L5 6v12z"/></svg>
    </button>
  </div>`;
}

function loadYouTubeAPI() {
  return new Promise((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const existing = document.querySelector('script[data-yt-api]');
    if (existing) {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prev === 'function') prev();
        resolve(window.YT);
      };
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.dataset.ytApi = 'true';
    tag.onerror = () => reject(new Error('YouTube API failed'));
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
  });
}

export async function initRadio() {
  const root = document.querySelector('[data-radio][data-playlist-id]');
  if (!root) return;

  const playlistId = root.dataset.playlistId;
  const host = root.querySelector('[data-radio-host]');
  const toggleBtn = root.querySelector('[data-radio-toggle]');
  const nextBtn = root.querySelector('[data-radio-next]');
  if (!host || !toggleBtn || !nextBtn) return;

  let player = null;
  let ytRef = null;

  function setPlaying(isPlaying) {
    root.classList.toggle('is-playing', isPlaying);
    toggleBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    toggleBtn.setAttribute('aria-pressed', String(isPlaying));
  }

  function isActiveState(state) {
    if (!ytRef) return false;
    return state === ytRef.PlayerState.PLAYING || state === ytRef.PlayerState.BUFFERING;
  }

  try {
    const YT = await loadYouTubeAPI();
    ytRef = YT;
    const mountId = 'kxrgx-site-player';
    host.innerHTML = `<div id="${mountId}"></div>`;
    player = new YT.Player(mountId, {
      height: '0',
      width: '0',
      playerVars: {
        listType: 'playlist',
        list: playlistId,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onStateChange(e) {
          setPlaying(isActiveState(e.data));
        },
        onError() {
          setPlaying(false);
        },
      },
    });
  } catch {
    root.remove();
    return;
  }

  toggleBtn.addEventListener('click', () => {
    if (!player || typeof player.getPlayerState !== 'function') return;
    try {
      const state = player.getPlayerState();
      if (isActiveState(state) || root.classList.contains('is-playing')) {
        player.pauseVideo();
        setPlaying(false);
      } else {
        player.playVideo();
        setPlaying(true);
      }
    } catch {
      /* ignore */
    }
  });

  nextBtn.addEventListener('click', () => {
    try {
      player.nextVideo();
      setPlaying(true);
    } catch {
      /* ignore */
    }
  });
}

import { PROJECTS, HOMEPAGE_MUSIC } from './content.js';

function renderProjects() {
  const list = document.querySelector('.works-list');
  if (!list) return;

  const total = PROJECTS.length;

  list.innerHTML = PROJECTS.map((project, index) => {
    const num = String(index + 1).padStart(2, '0');
    const tags = project.tags.map((tag) => `<span>${tag}</span>`).join('');
    const image = project.image
      ? `<img class="work-visual-img" src="${project.image}" alt="${project.title}" loading="lazy" />`
      : '';

    return `
      <li class="work" data-reveal data-project="${index}">
        <div class="work-visual ${project.contour}">
          ${image}
          <span class="work-index">${project.badge}</span>
          <h3>${project.title}</h3>
        </div>
        <div class="work-info">
          <p class="work-meta">(${num} / ${String(total).padStart(2, '0')}) · ${project.type} · ${project.artist}</p>
          <h3>${project.title}</h3>
          <p>${project.description}</p>
          <div class="tags">${tags}</div>
          <button type="button" class="case-link" data-audio="${project.audio}" data-title="${project.title}">Projeyi dinle →</button>
        </div>
      </li>
    `;
  }).join('');

  list.querySelectorAll('.work-visual-img').forEach((img) => {
    img.addEventListener('load', () => {
      img.closest('.work-visual')?.classList.add('has-image');
    });
    img.addEventListener('error', () => img.remove());
  });
}

function initReveal() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll('[data-reveal]');

  if (reduceMotion) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

function initMusicPlayer() {
  const player = document.querySelector('.music-player');
  const audio = document.querySelector('#site-audio');
  const titleEl = document.querySelector('.music-player-title');
  const toggleBtn = document.querySelector('.music-player-toggle');
  if (!player || !audio || !titleEl || !toggleBtn) return;

  let currentSrc = '';

  function setTrack(src, title) {
    if (!src) return;
    currentSrc = src;
    audio.src = src;
    titleEl.textContent = title;
    player.hidden = false;
    player.classList.remove('is-playing');
    toggleBtn.setAttribute('aria-label', 'Çal');
  }

  function playTrack(src, title) {
    if (!src) return;
    if (currentSrc !== src) setTrack(src, title);
    audio.play().then(() => {
      player.classList.add('is-playing');
      toggleBtn.setAttribute('aria-label', 'Duraklat');
    }).catch(() => {});
  }

  function togglePlayback() {
    if (audio.paused) {
      if (!currentSrc && HOMEPAGE_MUSIC.src) playTrack(HOMEPAGE_MUSIC.src, HOMEPAGE_MUSIC.title);
      else audio.play().then(() => player.classList.add('is-playing'));
      toggleBtn.setAttribute('aria-label', 'Duraklat');
    } else {
      audio.pause();
      player.classList.remove('is-playing');
      toggleBtn.setAttribute('aria-label', 'Çal');
    }
  }

  toggleBtn.addEventListener('click', togglePlayback);

  document.querySelector('.works-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-audio]');
    if (!btn) return;
    playTrack(btn.dataset.audio, btn.dataset.title);
  });

  document.querySelector('.hero-play')?.addEventListener('click', () => {
    if (HOMEPAGE_MUSIC.src) playTrack(HOMEPAGE_MUSIC.src, HOMEPAGE_MUSIC.title);
  });

  audio.addEventListener('ended', () => {
    player.classList.remove('is-playing');
    toggleBtn.setAttribute('aria-label', 'Çal');
  });

  if (HOMEPAGE_MUSIC.src) {
    titleEl.textContent = HOMEPAGE_MUSIC.title;
    player.hidden = false;
  }
}

renderProjects();
initReveal();
initMusicPlayer();

import { loadContent } from './content-store.js';

let siteContent = null;

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement;
  if (theme.bg) root.style.setProperty('--bg', theme.bg);
  if (theme.bgSoft) root.style.setProperty('--bg-soft', theme.bgSoft);
  if (theme.bgDark) root.style.setProperty('--bg-dark', theme.bgDark);
  if (theme.accent) root.style.setProperty('--accent', theme.accent);
}

function applySeo(seo) {
  document.title = seo.title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', seo.description);
}

function applyNav(nav, brand) {
  const brandEl = document.querySelector('.site-nav .brand');
  if (brandEl) {
    brandEl.textContent = brand;
    document.querySelectorAll('.footer-top h3, .footer-lockup').forEach((el) => {
      el.textContent = brand;
    });
  }
  const menuLabel = document.querySelector('.menu-toggle span:first-child');
  if (menuLabel) menuLabel.textContent = nav.menuLabel;
  const menuInner = document.querySelector('.menu-inner');
  if (menuInner) {
    menuInner.innerHTML = nav.items
      .map((item) => `<a href="${esc(item.href)}"><span>${esc(item.num)}</span>${esc(item.label)}</a>`)
      .join('');
  }
}

function applyHero(hero, brand) {
  const meta = document.querySelector('.hero-meta');
  if (meta) meta.textContent = hero.meta;
  const h1 = document.querySelector('.hero h1');
  if (h1) {
    h1.innerHTML = `${esc(hero.title || brand)}<span class="synthetic-line"><em>${esc(hero.subtitle)}</em></span>`;
  }
  const copies = document.querySelectorAll('.hero-copy');
  if (copies[0]) copies[0].textContent = hero.copy;
  const play = document.querySelector('.hero-play');
  if (play) play.textContent = hero.playButton;
  const canvas = document.querySelector('.hero canvas');
  if (canvas) canvas.setAttribute('aria-label', `${hero.title || brand} portre geçiş animasyonu`);
}

function applyMarquee(items) {
  const track = document.querySelector('.marquee-track');
  if (!track) return;
  const doubled = [...items, ...items];
  track.innerHTML = doubled.map((t) => `<span>${esc(t)}</span><b></b>`).join('');
}

function applyIndexStrip(items) {
  const strip = document.querySelector('.index-strip');
  if (!strip) return;
  strip.innerHTML = items.map((t) => `<span>${esc(t)}</span>`).join('');
}

function applyAbout(about) {
  const section = document.querySelector('.about');
  if (!section) return;
  section.querySelector('.section-label').textContent = about.sectionLabel;
  section.querySelector('.folio').textContent = about.folio;
  section.querySelector('.section-title').innerHTML = `${esc(about.titleLine1)}<span class="synthetic-line"><em>${esc(about.titleItalic)}</em></span>${esc(about.titleLine3)}`;
  section.querySelector('.lede').innerHTML = `<span class="drop-cap">${esc(about.dropCap)}</span>${esc(about.lede)}`;
  const para = section.querySelector('.about-copy > p:not(.lede)');
  if (para) para.textContent = about.paragraph;
  const dl = section.querySelector('dl');
  if (dl) {
    dl.innerHTML = about.meta
      .map(
        (row) =>
          `<div><dt>${esc(row.label)}</dt><dd>${row.statusDot ? '<span class="status-dot"></span>' : ''}${esc(row.value)}</dd></div>`
      )
      .join('');
  }
}

function renderProjects(projects) {
  const list = document.querySelector('.works-list');
  if (!list) return;
  const total = projects.length;
  list.innerHTML = projects
    .map((project, index) => {
      const num = String(index + 1).padStart(2, '0');
      const tags = project.tags.map((tag) => `<span>${esc(tag)}</span>`).join('');
      const image = project.image
        ? `<img class="work-visual-img" src="${esc(project.image)}" alt="${esc(project.title)}" loading="lazy" />`
        : '';
      return `
      <li class="work" data-reveal data-project="${index}">
        <div class="work-visual ${esc(project.contour)}">
          ${image}
          <span class="work-index">${esc(project.badge)}</span>
          <h3>${esc(project.title)}</h3>
        </div>
        <div class="work-info">
          <p class="work-meta">(${num} / ${String(total).padStart(2, '0')}) · ${esc(project.type)} · ${esc(project.artist)}</p>
          <h3>${esc(project.title)}</h3>
          <p>${esc(project.description)}</p>
          <div class="tags">${tags}</div>
          <button type="button" class="case-link" data-audio="${esc(project.audio)}" data-title="${esc(project.title)}">Projeyi dinle →</button>
        </div>
      </li>`;
    })
    .join('');

  list.querySelectorAll('.work-visual-img').forEach((img) => {
    img.addEventListener('load', () => img.closest('.work-visual')?.classList.add('has-image'));
    img.addEventListener('error', () => img.remove());
  });
}

function applyWorks(works) {
  const section = document.querySelector('.works');
  if (!section) return;
  section.querySelector('.section-label').textContent = works.sectionLabel;
  section.querySelector('.folio').textContent = works.folio;
  section.querySelector('.section-title').textContent = works.title;
  renderProjects(works.projects);
}

function applyCapabilities(cap) {
  const section = document.querySelector('.capabilities');
  if (!section) return;
  section.querySelector('.section-label').textContent = cap.sectionLabel;
  section.querySelector('.folio').textContent = cap.folio;
  section.querySelector('.section-title').textContent = cap.title;
  const grid = section.querySelector('.capabilities-grid');
  if (grid) {
    grid.innerHTML = cap.items
      .map(
        (item) =>
          `<article><p class="idx">${esc(item.idx)}</p><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p><footer>${esc(item.footer)}</footer></article>`
      )
      .join('');
  }
}

function applyProcess(proc) {
  const section = document.querySelector('.process');
  if (!section) return;
  section.querySelector('.section-label').textContent = proc.sectionLabel;
  section.querySelector('.folio').textContent = proc.folio;
  section.querySelector('.section-title').textContent = proc.title;
  const steps = section.querySelector('.process-steps');
  if (steps) {
    steps.innerHTML = proc.steps
      .map(
        (step) =>
          `<article><span>${esc(step.num)}</span><h3>${esc(step.title)}</h3><p>${esc(step.body)}</p></article>`
      )
      .join('');
  }
}

function applyArchive(archive) {
  const section = document.querySelector('.archive');
  if (!section) return;
  section.querySelector('.section-label').textContent = archive.sectionLabel;
  section.querySelector('.folio').textContent = archive.folio;
  section.querySelector('.section-title').textContent = archive.title;
  const grid = section.querySelector('.archive-grid');
  if (grid) {
    grid.innerHTML = archive.studies
      .map((s) => {
        const image = s.image
          ? `<img class="study-visual-img" src="${esc(s.image)}" alt="${esc(s.number)}" loading="lazy" />`
          : '';
        return `<figure data-pattern="${esc(s.pattern || 'lines')}" class="${s.image ? 'has-image' : ''}"><div class="study-visual">${image}</div><figcaption><span>${esc(s.number)}</span><span>${esc(s.tag)}</span></figcaption></figure>`;
      })
      .join('');

    grid.querySelectorAll('.study-visual-img').forEach((img) => {
      img.addEventListener('error', () => {
        img.remove();
        img.closest('figure')?.classList.remove('has-image');
      });
    });
  }
  const link = section.querySelector('.archive-link');
  if (link) {
    link.textContent = archive.linkText;
    link.href = archive.linkHref;
  }
}

function applyCta(cta, brand) {
  const section = document.querySelector('.cta');
  if (!section) return;
  section.querySelector('.section-label').textContent = cta.sectionLabel;
  section.querySelector('.folio').textContent = cta.folio;
  section.querySelector('h2').innerHTML = `${esc(cta.titleLine1)}<span class="synthetic-line"><em>${esc(cta.titleItalic)}</em></span>`;
  section.querySelector('.cta > p').textContent = cta.body.replace('KXRGX', brand);
  const pill = section.querySelector('.cta-pill');
  if (pill) {
    pill.href = `mailto:${cta.email}`;
    pill.querySelector('span').textContent = cta.buttonText;
  }
  const meta = section.querySelectorAll('.cta-meta span');
  if (meta[0]) meta[0].textContent = cta.email;
  if (meta[1]) meta[1].textContent = cta.location;
}

function applyFooter(footer) {
  const top = document.querySelector('.footer-top');
  if (top) {
    top.querySelector('h3').textContent = footer.brand;
    top.querySelector('p em').textContent = footer.tagline;
  }
  const grid = document.querySelector('.footer-grid');
  if (grid) {
    grid.innerHTML = footer.columns
      .map(
        (col) =>
          `<div><h4>${esc(col.title)}</h4>${col.links.map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}</div>`
      )
      .join('');
  }
  const lockup = document.querySelector('.footer-lockup');
  if (lockup) lockup.textContent = footer.lockup;
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

function initMusicPlayer(music) {
  const player = document.querySelector('.music-player');
  const audio = document.querySelector('#site-audio');
  const titleEl = document.querySelector('.music-player-title');
  const toggleBtn = document.querySelector('.music-player-toggle');
  if (!player || !audio || !titleEl || !toggleBtn) return;

  const homepage = music.homepage;
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

  toggleBtn.onclick = () => {
    if (audio.paused) {
      if (!currentSrc && homepage.src) playTrack(homepage.src, homepage.title);
      else audio.play().then(() => player.classList.add('is-playing'));
      toggleBtn.setAttribute('aria-label', 'Duraklat');
    } else {
      audio.pause();
      player.classList.remove('is-playing');
      toggleBtn.setAttribute('aria-label', 'Çal');
    }
  };

  document.querySelector('.works-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-audio]');
    if (!btn) return;
    playTrack(btn.dataset.audio, btn.dataset.title);
  });

  document.querySelector('.hero-play')?.addEventListener('click', () => {
    if (homepage.src) playTrack(homepage.src, homepage.title);
  });

  audio.addEventListener('ended', () => {
    player.classList.remove('is-playing');
    toggleBtn.setAttribute('aria-label', 'Çal');
  });

  if (homepage.src) {
    titleEl.textContent = homepage.title;
    player.hidden = false;
  }
}

export async function applySiteContent(content) {
  siteContent = content;
  applyTheme(content.theme);
  applySeo(content.seo);
  applyNav(content.nav, content.brand);
  applyHero(content.hero, content.brand);
  applyMarquee(content.marquee);
  applyIndexStrip(content.indexStrip);
  applyAbout(content.about);
  applyWorks(content.works);
  applyCapabilities(content.capabilities);
  applyProcess(content.process);
  applyArchive(content.archive);
  applyCta(content.cta, content.brand);
  applyFooter(content.footer);
  initMusicPlayer(content.music);
  window.dispatchEvent(new CustomEvent('site-content-ready', { detail: content }));
}

export function getSiteContent() {
  return siteContent;
}

async function init() {
  const content = await loadContent();
  await applySiteContent(content);
  initReveal();
}

init();


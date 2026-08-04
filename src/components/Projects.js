import { projects } from '../data/projects.js';
import { esc, titleAnimated } from '../utils/escape.js';

function projectCard(project, wordStart) {
  const soon = project.status !== 'published' || !project.youtubeId;
  const { html: titleHtml, nextIndex } = titleAnimated(project.title, wordStart);

  if (soon) {
    return {
      html: `
    <article class="project-card project-card--soon">
      <div class="project-card__media project-card__media--empty" aria-hidden="true"></div>
      <div class="project-card__body">
        <h3>${titleHtml}</h3>
        <p class="status-pill"><span class="tr text-hover">YAKINDA</span><span class="en text-hover" lang="en">COMING SOON</span></p>
      </div>
    </article>`,
      nextIndex,
    };
  }

  return {
    html: `
  <article class="project-card" data-project-card>
    <button type="button" class="project-card__media" data-open-video="${esc(project.youtubeId)}" data-video-title="${esc(project.title)}" aria-label="${esc(project.title)} — klibi aç">
      <img src="${esc(project.thumbnail)}" alt="${esc(project.title)} thumbnail" loading="lazy" width="640" height="360" />
      <span class="project-play" aria-hidden="true"></span>
    </button>
    <div class="project-card__body">
      <h3>${titleHtml}</h3>
    </div>
  </article>`,
    nextIndex,
  };
}

export function renderProjects() {
  let wi = 0;
  const cards = projects.map((p) => {
    const result = projectCard(p, wi);
    wi = result.nextIndex;
    return result.html;
  });

  return `
  <section class="section projects" id="projects" data-reveal data-text-section>
    <header class="section-head">
      <h2 class="section-title heading-reveal">
        <span class="tr">PROJELER</span>
        <span class="en" lang="en">PROJECTS</span>
      </h2>
    </header>
    <div class="projects-grid">
      ${cards.join('')}
    </div>
  </section>`;
}

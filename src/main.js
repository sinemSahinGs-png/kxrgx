import './styles/main.css';
import { site } from './config/site.js';
import { renderHeader, initHeader } from './components/Header.js';
import { renderHero } from './components/Hero.js';
import { initHeroScrollVideo } from './components/HeroScrollVideo.js';
import { renderAbout } from './components/About.js';
import { renderProjects } from './components/Projects.js';
import { renderVideoModal, initVideoModal } from './components/VideoModal.js';
import { renderBeatStore, initBeatStore } from './components/BeatStore.js';
import { renderRadio, initRadio } from './components/Radio.js';
import { renderFooter, initFooterPortrait } from './components/Footer.js';
import { renderSectionNav, initSectionNav } from './components/SectionNav.js';
import { initReveal } from './utils/reveal.js';
import { initAnimations } from './utils/animations.js';
import { loadSiteContent } from './lib/content.js';

function applySeo() {
  document.title = site.seo.title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', site.seo.description);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogTitle) ogTitle.setAttribute('content', site.seo.title);
  if (ogDesc) ogDesc.setAttribute('content', site.seo.description);
}

function mount() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = [
    renderHeader(),
    renderHero(),
    '<main>',
    renderAbout(),
    renderProjects(),
    renderBeatStore(),
    '</main>',
    renderFooter(),
    renderSectionNav(),
    renderRadio(),
    renderVideoModal(),
  ].join('');

  applySeo();
  initHeader();
  initHeroScrollVideo();
  initVideoModal();
  initBeatStore();
  initRadio();
  initReveal();
  initAnimations();
  initFooterPortrait();
  initSectionNav();
}

loadSiteContent().then(mount).catch(() => mount());

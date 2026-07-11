import {
  fetchDefaultContent,
  loadContent,
  saveContent,
  clearStoredContent,
  exportContent,
  importContentFile,
  isAdminAuthed,
  setAdminAuthed,
  getAdminPassword,
} from './content-store.js';

let content = null;
let adminReady = false;

const TABS = [
  { id: 'general', label: 'Genel' },
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'Hakkında' },
  { id: 'works', label: 'Projeler' },
  { id: 'capabilities', label: 'Hizmetler' },
  { id: 'process', label: 'Süreç' },
  { id: 'archive', label: 'Çalışmalar' },
  { id: 'cta', label: 'İletişim' },
  { id: 'footer', label: 'Footer' },
  { id: 'music', label: 'Müzik' },
  { id: 'theme', label: 'Tema' },
  { id: 'admin', label: 'Güvenlik' },
];

const loginEl = document.getElementById('login');
const appEl = document.getElementById('app');
const tabsEl = document.getElementById('tabs');
const panelsEl = document.getElementById('panels');
const toastEl = document.getElementById('toast');

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showLogin() {
  loginEl.classList.remove('is-hidden');
  appEl.classList.add('is-hidden');
}

function showApp() {
  loginEl.classList.add('is-hidden');
  appEl.classList.remove('is-hidden');
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toastEl.hidden = true;
  }, 3200);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImageFile(file, folder = 'projects') {
  const dataUrl = await fileToDataUrl(file);
  const password = sessionStorage.getItem('kxrgx-admin-pass') || '';
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': password,
      },
      body: JSON.stringify({
        folder,
        filename: file.name,
        data: dataUrl,
        password,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.ok && json.path) return json.path;
    }
  } catch {
    /* API yoksa data URL kullan */
  }
  return dataUrl;
}

function imageUploadBlock({ preview, pathValue, folder, fieldAttr, index }) {
  const hasPreview = Boolean(preview || pathValue);
  const src = preview || pathValue || '';
  return `
    <div class="image-upload" style="grid-column:1/-1">
      <div class="image-upload-preview ${hasPreview ? 'has-image' : ''}">
        ${hasPreview ? `<img src="${esc(src)}" alt="Önizleme" />` : '<span>Görsel yok</span>'}
      </div>
      <div class="image-upload-actions">
        <label class="btn-ghost image-upload-btn">
          Görsel yükle
          <input type="file" accept="image/*" data-upload-folder="${folder}" data-upload-target="${fieldAttr}" data-upload-index="${index}" hidden />
        </label>
        ${hasPreview ? `<button type="button" class="btn-ghost" data-clear-image="${fieldAttr}" data-clear-index="${index}">Kaldır</button>` : ''}
        <input type="hidden" ${fieldAttr}="image" value="${esc(pathValue || '')}" />
        <span class="image-upload-hint">JPG, PNG, WEBP</span>
      </div>
    </div>`;
}

function field(label, key, value, type = 'text', rows = 3) {
  const safe = esc(value);
  const input =
    type === 'textarea'
      ? `<textarea data-key="${key}" rows="${rows}">${safe}</textarea>`
      : `<input type="${type}" data-key="${key}" value="${safe}" />`;
  return `<label>${label}${input}</label>`;
}

function collectPanel(panelEl) {
  const data = {};
  panelEl.querySelectorAll('[data-key]').forEach((el) => {
    const key = el.dataset.key;
    const parts = key.split('.');
    let ref = data;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) ref[part] = el.value;
      else {
        ref[part] = ref[part] || {};
        ref = ref[part];
      }
    });
  });
  return data;
}

function deepMerge(target, source) {
  Object.keys(source).forEach((key) => {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      target[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  });
  return target;
}

function renderGeneral() {
  return `
    <section class="admin-panel is-active" data-panel="general">
      <h2>Genel & SEO</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Marka adı', 'brand', content.brand)}
        ${field('Sayfa başlığı', 'seo.title', content.seo.title)}
        ${field('Meta açıklama', 'seo.description', content.seo.description, 'textarea', 2)}
        ${field('Menü butonu', 'nav.menuLabel', content.nav.menuLabel)}
      </div>
      <div class="admin-card-block">
        <h3>Marquee (her satır virgülle)</h3>
        <textarea data-key="marquee" rows="3">${esc(content.marquee.join(', '))}</textarea>
      </div>
      <div class="admin-card-block">
        <h3>Index şeridi (virgülle)</h3>
        <textarea data-key="indexStrip" rows="2">${esc(content.indexStrip.join(', '))}</textarea>
      </div>
    </section>`;
}

function renderHero() {
  const h = content.hero;
  return `
    <section class="admin-panel" data-panel="hero">
      <h2>Hero</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Üst meta', 'hero.meta', h.meta)}
        ${field('Başlık', 'hero.title', h.title)}
        ${field('Alt başlık', 'hero.subtitle', h.subtitle)}
        ${field('Açıklama', 'hero.copy', h.copy, 'textarea', 3)}
        ${field('Buton metni', 'hero.playButton', h.playButton)}
        ${field('Üst portre yolu', 'hero.portraitTop', h.portraitTop)}
        ${field('Alt portre yolu', 'hero.portraitBottom', h.portraitBottom)}
      </div>
    </section>`;
}

function renderAbout() {
  const a = content.about;
  return `
    <section class="admin-panel" data-panel="about">
      <h2>Hakkında</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Bölüm etiketi', 'about.sectionLabel', a.sectionLabel)}
        ${field('Sayfa no.', 'about.folio', a.folio)}
        ${field('Başlık satır 1', 'about.titleLine1', a.titleLine1)}
        ${field('Başlık italik', 'about.titleItalic', a.titleItalic)}
        ${field('Başlık satır 3', 'about.titleLine3', a.titleLine3)}
        ${field('Drop cap', 'about.dropCap', a.dropCap)}
        ${field('Giriş paragrafı', 'about.lede', a.lede, 'textarea', 3)}
        ${field('İkinci paragraf', 'about.paragraph', a.paragraph, 'textarea', 3)}
      </div>
      <div id="about-meta-list"></div>
      <button type="button" class="btn-ghost" data-add-about-meta>+ Meta satırı ekle</button>
    </section>`;
}

function renderAboutMeta() {
  const wrap = document.getElementById('about-meta-list');
  if (!wrap) return;
  wrap.innerHTML = content.about.meta
    .map(
      (row, i) => `
    <div class="admin-card-block" data-about-meta="${i}">
      <div class="admin-card-head">
        <h3>Meta ${i + 1}</h3>
        <button type="button" class="btn-ghost" data-remove-about-meta="${i}">Sil</button>
      </div>
      <div class="admin-grid admin-grid-2">
        <label>Etiket<input data-about-field="label" value="${esc(row.label)}" /></label>
        <label>Değer<input data-about-field="value" value="${esc(row.value)}" /></label>
        <label><input type="checkbox" data-about-field="statusDot" ${row.statusDot ? 'checked' : ''} /> Durum noktası</label>
      </div>
    </div>`
    )
    .join('');
}

function renderWorks() {
  return `
    <section class="admin-panel" data-panel="works">
      <h2>Projeler</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Bölüm etiketi', 'works.sectionLabel', content.works.sectionLabel)}
        ${field('Sayfa no.', 'works.folio', content.works.folio)}
        ${field('Başlık', 'works.title', content.works.title)}
      </div>
      <div id="projects-list"></div>
      <button type="button" class="btn-ghost" data-add-project>+ Proje ekle</button>
    </section>`;
}

function renderProjects() {
  const wrap = document.getElementById('projects-list');
  if (!wrap) return;
  wrap.innerHTML = content.works.projects
    .map(
      (p, i) => `
    <div class="admin-card-block" data-project="${i}">
      <div class="admin-card-head">
        <h3>Proje ${i + 1}</h3>
        <button type="button" class="btn-ghost" data-remove-project="${i}">Sil</button>
      </div>
      <div class="admin-grid admin-grid-2">
        <label>Rozet<input data-project-field="badge" value="${esc(p.badge)}" /></label>
        <label>Başlık<input data-project-field="title" value="${esc(p.title)}" /></label>
        <label>Tür<input data-project-field="type" value="${esc(p.type)}" /></label>
        <label>Sanatçı<input data-project-field="artist" value="${esc(p.artist)}" /></label>
        ${imageUploadBlock({ pathValue: p.image, folder: 'projects', fieldAttr: 'data-project-field', index: i })}
        <label>Müzik yolu<input data-project-field="audio" value="${esc(p.audio)}" /></label>
        <label>Kontur<select data-project-field="contour">
          <option value="contour-ellipses" ${p.contour === 'contour-ellipses' ? 'selected' : ''}>Ellipses</option>
          <option value="contour-flow" ${p.contour === 'contour-flow' ? 'selected' : ''}>Flow</option>
          <option value="contour-grid" ${p.contour === 'contour-grid' ? 'selected' : ''}>Grid</option>
        </select></label>
        <label>Etiketler (virgülle)<input data-project-field="tags" value="${esc(p.tags.join(', '))}" /></label>
        <label style="grid-column:1/-1">Açıklama<textarea data-project-field="description" rows="2">${esc(p.description)}</textarea></label>
      </div>
    </div>`
    )
    .join('');
}

function renderCapabilities() {
  return `
    <section class="admin-panel" data-panel="capabilities">
      <h2>Hizmetler</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Bölüm etiketi', 'capabilities.sectionLabel', content.capabilities.sectionLabel)}
        ${field('Sayfa no.', 'capabilities.folio', content.capabilities.folio)}
        ${field('Başlık', 'capabilities.title', content.capabilities.title)}
      </div>
      <div id="capabilities-list"></div>
      <button type="button" class="btn-ghost" data-add-capability>+ Hizmet ekle</button>
    </section>`;
}

function renderCapabilitiesList() {
  const wrap = document.getElementById('capabilities-list');
  if (!wrap) return;
  wrap.innerHTML = content.capabilities.items
    .map(
      (item, i) => `
    <div class="admin-card-block" data-capability="${i}">
      <div class="admin-card-head"><h3>Hizmet ${i + 1}</h3><button type="button" class="btn-ghost" data-remove-capability="${i}">Sil</button></div>
      <div class="admin-grid admin-grid-2">
        <label>İndeks<input data-cap-field="idx" value="${esc(item.idx)}" /></label>
        <label>Başlık<input data-cap-field="title" value="${esc(item.title)}" /></label>
        <label style="grid-column:1/-1">Açıklama<textarea data-cap-field="body" rows="2">${esc(item.body)}</textarea></label>
        <label>Alt satır<input data-cap-field="footer" value="${esc(item.footer)}" /></label>
      </div>
    </div>`
    )
    .join('');
}

function renderProcess() {
  return `
    <section class="admin-panel" data-panel="process">
      <h2>Süreç</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Bölüm etiketi', 'process.sectionLabel', content.process.sectionLabel)}
        ${field('Sayfa no.', 'process.folio', content.process.folio)}
        ${field('Başlık', 'process.title', content.process.title)}
      </div>
      <div id="process-list"></div>
      <button type="button" class="btn-ghost" data-add-step>+ Adım ekle</button>
    </section>`;
}

function renderProcessList() {
  const wrap = document.getElementById('process-list');
  if (!wrap) return;
  wrap.innerHTML = content.process.steps
    .map(
      (step, i) => `
    <div class="admin-card-block" data-step="${i}">
      <div class="admin-card-head"><h3>Adım ${i + 1}</h3><button type="button" class="btn-ghost" data-remove-step="${i}">Sil</button></div>
      <div class="admin-grid admin-grid-2">
        <label>No<input data-step-field="num" value="${esc(step.num)}" /></label>
        <label>Başlık<input data-step-field="title" value="${esc(step.title)}" /></label>
        <label style="grid-column:1/-1">Açıklama<textarea data-step-field="body" rows="2">${esc(step.body)}</textarea></label>
      </div>
    </div>`
    )
    .join('');
}

function renderArchive() {
  return `
    <section class="admin-panel" data-panel="archive">
      <h2>Çalışmalar</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Bölüm etiketi', 'archive.sectionLabel', content.archive.sectionLabel)}
        ${field('Sayfa no.', 'archive.folio', content.archive.folio)}
        ${field('Başlık', 'archive.title', content.archive.title)}
        ${field('Link metni', 'archive.linkText', content.archive.linkText)}
        ${field('Link hedefi', 'archive.linkHref', content.archive.linkHref)}
      </div>
      <div id="archive-list"></div>
      <button type="button" class="btn-ghost" data-add-study>+ Çalışma ekle</button>
    </section>`;
}

function renderArchiveList() {
  const wrap = document.getElementById('archive-list');
  if (!wrap) return;
  const patterns = ['lines', 'rings', 'grid', 'waves', 'diag', 'dots'];
  wrap.innerHTML = content.archive.studies
    .map(
      (s, i) => `
    <div class="admin-card-block" data-study="${i}">
      <div class="admin-card-head"><h3>Çalışma ${i + 1}</h3><button type="button" class="btn-ghost" data-remove-study="${i}">Sil</button></div>
      <div class="admin-grid admin-grid-2">
        <label>Numara<input data-study-field="number" value="${esc(s.number)}" /></label>
        <label>Etiket<input data-study-field="tag" value="${esc(s.tag)}" /></label>
        <label>Yedek desen<select data-study-field="pattern">${patterns.map((p) => `<option value="${p}" ${s.pattern === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
        ${imageUploadBlock({ pathValue: s.image || '', folder: 'archive', fieldAttr: 'data-study-field', index: i })}
      </div>
    </div>`
    )
    .join('');
}

function renderCta() {
  const c = content.cta;
  return `
    <section class="admin-panel" data-panel="cta">
      <h2>İletişim / CTA</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Bölüm etiketi', 'cta.sectionLabel', c.sectionLabel)}
        ${field('Sayfa no.', 'cta.folio', c.folio)}
        ${field('Başlık satır 1', 'cta.titleLine1', c.titleLine1)}
        ${field('Başlık italik', 'cta.titleItalic', c.titleItalic)}
        ${field('Açıklama', 'cta.body', c.body, 'textarea', 3)}
        ${field('Buton metni', 'cta.buttonText', c.buttonText)}
        ${field('E-posta', 'cta.email', c.email)}
        ${field('Konum', 'cta.location', c.location)}
      </div>
    </section>`;
}

function renderFooter() {
  return `
    <section class="admin-panel" data-panel="footer">
      <h2>Footer</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Marka', 'footer.brand', content.footer.brand)}
        ${field('Slogan', 'footer.tagline', content.footer.tagline, 'textarea', 2)}
        ${field('Büyük lockup', 'footer.lockup', content.footer.lockup)}
      </div>
      <div id="footer-columns"></div>
      <button type="button" class="btn-ghost" data-add-footer-col>+ Sütun ekle</button>
    </section>`;
}

function renderFooterColumns() {
  const wrap = document.getElementById('footer-columns');
  if (!wrap) return;
  wrap.innerHTML = content.footer.columns
    .map(
      (col, i) => `
    <div class="admin-card-block" data-footer-col="${i}">
      <div class="admin-card-head"><h3>Sütun ${i + 1}</h3><button type="button" class="btn-ghost" data-remove-footer-col="${i}">Sil</button></div>
      <label>Başlık<input data-footer-col-title value="${esc(col.title)}" /></label>
      <label>Linkler (her satır: Etiket|url)<textarea data-footer-col-links rows="3">${esc(col.links.map((l) => `${l.label}|${l.href}`).join('\n'))}</textarea></label>
    </div>`
    )
    .join('');
}

function renderMusic() {
  return `
    <section class="admin-panel" data-panel="music">
      <h2>Müzik</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Anasayfa müzik yolu', 'music.homepage.src', content.music.homepage.src)}
        ${field('Player başlığı', 'music.homepage.title', content.music.homepage.title)}
      </div>
    </section>`;
}

function renderTheme() {
  const t = content.theme;
  return `
    <section class="admin-panel" data-panel="theme">
      <h2>Tema renkleri</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Ana arka plan', 'theme.bg', t.bg, 'color')}
        ${field('Kart arka plan', 'theme.bgSoft', t.bgSoft, 'color')}
        ${field('Koyu bölüm', 'theme.bgDark', t.bgDark, 'color')}
        ${field('Vurgu rengi', 'theme.accent', t.accent, 'color')}
      </div>
    </section>`;
}

function renderAdmin() {
  return `
    <section class="admin-panel" data-panel="admin">
      <h2>Güvenlik</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Admin şifresi', 'admin.password', content.admin.password)}
      </div>
      <p style="color:var(--muted);margin:0">Şifreyi değiştirdikten sonra kaydedin. Yeni şifre bir sonraki girişte geçerli olur.</p>
    </section>`;
}

function renderPanels() {
  try {
    panelsEl.innerHTML = [
      renderGeneral(),
      renderHero(),
      renderAbout(),
      renderWorks(),
      renderCapabilities(),
      renderProcess(),
      renderArchive(),
      renderCta(),
      renderFooter(),
      renderMusic(),
      renderTheme(),
      renderAdmin(),
    ].join('');
    renderAboutMeta();
    renderProjects();
    renderCapabilitiesList();
    renderProcessList();
    renderArchiveList();
    renderFooterColumns();
  } catch (error) {
    console.error(error);
    panelsEl.innerHTML = `<div class="admin-card-block"><h3>Panel yüklenemedi</h3><p>${esc(error.message)}</p></div>`;
    throw error;
  }
}

function renderTabs() {
  tabsEl.innerHTML = TABS.map(
    (tab, i) => `<button type="button" class="admin-tab ${i === 0 ? 'is-active' : ''}" data-tab="${tab.id}">${tab.label}</button>`
  ).join('');
}

function switchTab(id) {
  document.querySelectorAll('.admin-tab').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tab === id));
  document.querySelectorAll('.admin-panel').forEach((panel) => {
    const active = panel.dataset.panel === id;
    panel.classList.toggle('is-active', active);
    if (active) {
      panel.style.animation = 'none';
      // force reflow for re-trigger
      void panel.offsetWidth;
      panel.style.animation = '';
    }
  });
}

function readListFields() {
  document.querySelectorAll('[data-about-meta]').forEach((block) => {
    const i = Number(block.dataset.aboutMeta);
    content.about.meta[i] = {
      label: block.querySelector('[data-about-field="label"]').value,
      value: block.querySelector('[data-about-field="value"]').value,
      statusDot: block.querySelector('[data-about-field="statusDot"]').checked,
    };
  });

  document.querySelectorAll('[data-project]').forEach((block) => {
    const i = Number(block.dataset.project);
    content.works.projects[i] = {
      badge: block.querySelector('[data-project-field="badge"]').value,
      title: block.querySelector('[data-project-field="title"]').value,
      type: block.querySelector('[data-project-field="type"]').value,
      artist: block.querySelector('[data-project-field="artist"]').value,
      image: block.querySelector('[data-project-field="image"]').value,
      audio: block.querySelector('[data-project-field="audio"]').value,
      contour: block.querySelector('[data-project-field="contour"]').value,
      tags: block.querySelector('[data-project-field="tags"]').value.split(',').map((t) => t.trim()).filter(Boolean),
      description: block.querySelector('[data-project-field="description"]').value,
    };
  });

  document.querySelectorAll('[data-capability]').forEach((block) => {
    const i = Number(block.dataset.capability);
    content.capabilities.items[i] = {
      idx: block.querySelector('[data-cap-field="idx"]').value,
      title: block.querySelector('[data-cap-field="title"]').value,
      body: block.querySelector('[data-cap-field="body"]').value,
      footer: block.querySelector('[data-cap-field="footer"]').value,
    };
  });

  document.querySelectorAll('[data-step]').forEach((block) => {
    const i = Number(block.dataset.step);
    content.process.steps[i] = {
      num: block.querySelector('[data-step-field="num"]').value,
      title: block.querySelector('[data-step-field="title"]').value,
      body: block.querySelector('[data-step-field="body"]').value,
    };
  });

  document.querySelectorAll('[data-study]').forEach((block) => {
    const i = Number(block.dataset.study);
    content.archive.studies[i] = {
      pattern: block.querySelector('[data-study-field="pattern"]').value,
      number: block.querySelector('[data-study-field="number"]').value,
      tag: block.querySelector('[data-study-field="tag"]').value,
      image: block.querySelector('[data-study-field="image"]')?.value || '',
    };
  });

  document.querySelectorAll('[data-footer-col]').forEach((block) => {
    const i = Number(block.dataset.footerCol);
    const links = block
      .querySelector('[data-footer-col-links]')
      .value.split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, href] = line.split('|');
        return { label: (label || '').trim(), href: (href || '#').trim() };
      });
    content.footer.columns[i] = {
      title: block.querySelector('[data-footer-col-title]').value,
      links,
    };
  });
}

function gatherContentFromForm() {
  readListFields();
  document.querySelectorAll('.admin-panel').forEach((panel) => {
    const partial = collectPanel(panel);
    deepMerge(content, partial);
  });
  const marqueeEl = document.querySelector('[data-key="marquee"]');
  if (marqueeEl) content.marquee = marqueeEl.value.split(',').map((s) => s.trim()).filter(Boolean);
  const stripEl = document.querySelector('[data-key="indexStrip"]');
  if (stripEl) content.indexStrip = stripEl.value.split(',').map((s) => s.trim()).filter(Boolean);
}

function bindDynamicActions() {
  panelsEl.addEventListener('click', (e) => {
    const t = e.target;
    if (t.matches('[data-add-about-meta]')) {
      gatherContentFromForm();
      content.about.meta.push({ label: 'Yeni', value: '', statusDot: false });
      renderAboutMeta();
    }
    if (t.matches('[data-remove-about-meta]')) {
      gatherContentFromForm();
      content.about.meta.splice(Number(t.dataset.removeAboutMeta), 1);
      renderAboutMeta();
    }
    if (t.matches('[data-add-project]')) {
      gatherContentFromForm();
      content.works.projects.push({
        badge: 'PR',
        title: 'Yeni Proje',
        type: 'Single',
        artist: 'KXRGX',
        description: '',
        tags: [],
        contour: 'contour-ellipses',
        image: '',
        audio: '',
      });
      renderProjects();
    }
    if (t.matches('[data-remove-project]')) {
      gatherContentFromForm();
      content.works.projects.splice(Number(t.dataset.removeProject), 1);
      renderProjects();
    }
    if (t.matches('[data-add-capability]')) {
      gatherContentFromForm();
      content.capabilities.items.push({ idx: '↳ 00', title: 'Yeni', body: '', footer: '' });
      renderCapabilitiesList();
    }
    if (t.matches('[data-remove-capability]')) {
      gatherContentFromForm();
      content.capabilities.items.splice(Number(t.dataset.removeCapability), 1);
      renderCapabilitiesList();
    }
    if (t.matches('[data-add-step]')) {
      gatherContentFromForm();
      content.process.steps.push({ num: '00', title: 'Yeni', body: '' });
      renderProcessList();
    }
    if (t.matches('[data-remove-step]')) {
      gatherContentFromForm();
      content.process.steps.splice(Number(t.dataset.removeStep), 1);
      renderProcessList();
    }
    if (t.matches('[data-add-study]')) {
      gatherContentFromForm();
      content.archive.studies.push({ pattern: 'lines', number: 'Çalışma #000', tag: 'Etiket', image: '' });
      renderArchiveList();
    }
    if (t.matches('[data-remove-study]')) {
      gatherContentFromForm();
      content.archive.studies.splice(Number(t.dataset.removeStudy), 1);
      renderArchiveList();
    }
    if (t.matches('[data-clear-image]')) {
      gatherContentFromForm();
      const index = Number(t.dataset.clearIndex);
      const target = t.dataset.clearImage;
      if (target === 'data-project-field') {
        content.works.projects[index].image = '';
        renderProjects();
      } else if (target === 'data-study-field') {
        content.archive.studies[index].image = '';
        renderArchiveList();
      }
    }
    if (t.matches('[data-add-footer-col]')) {
      gatherContentFromForm();
      content.footer.columns.push({ title: 'Yeni', links: [{ label: 'Link', href: '#' }] });
      renderFooterColumns();
    }
    if (t.matches('[data-remove-footer-col]')) {
      gatherContentFromForm();
      content.footer.columns.splice(Number(t.dataset.removeFooterCol), 1);
      renderFooterColumns();
    }
  });

  panelsEl.addEventListener('change', async (e) => {
    const input = e.target.closest('input[type="file"][data-upload-target]');
    if (!input || !input.files?.[0]) return;
    const file = input.files[0];
    const index = Number(input.dataset.uploadIndex);
    const folder = input.dataset.uploadFolder || 'projects';
    const target = input.dataset.uploadTarget;
    showToast('Görsel yükleniyor...');
    try {
      gatherContentFromForm();
      const pathValue = await uploadImageFile(file, folder);
      if (target === 'data-project-field') {
        content.works.projects[index].image = pathValue;
        renderProjects();
      } else if (target === 'data-study-field') {
        content.archive.studies[index].image = pathValue;
        renderArchiveList();
      }
      showToast('Görsel eklendi. Kaydetmeyi unutma.');
    } catch (error) {
      console.error(error);
      showToast('Görsel yüklenemedi.');
    } finally {
      input.value = '';
    }
  });
}

function bindStaticActions() {
  document.getElementById('save-btn').addEventListener('click', async () => {
    gatherContentFromForm();
    const result = await saveContent(content);
    if (result.persisted) showToast('Kalıcı olarak kaydedildi. Site güncellendi.');
    else showToast(result.error || 'Kayıt başarısız. Vercel Blob bağlantısını kontrol et.');
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    gatherContentFromForm();
    exportContent(content);
    showToast('JSON indirildi.');
  });

  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  document.getElementById('import-file').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    content = await importContentFile(file);
    renderPanels();
    showToast('JSON yüklendi. Kaydetmeyi unutmayın.');
    e.target.value = '';
  });

  document.getElementById('reset-btn').addEventListener('click', async () => {
    if (!confirm('Tüm özel değişiklikler silinip varsayılana dönülsün mü?')) return;
    clearStoredContent();
    content = await fetchDefaultContent();
    renderPanels();
    showToast('Varsayılan içerik yüklendi.');
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    setAdminAuthed(false);
    showLogin();
    document.getElementById('login-password').value = '';
  });
}

async function bootAdmin() {
  try {
    content = await loadContent();

    if (!adminReady) {
      renderTabs();
      bindDynamicActions();
      bindStaticActions();
      tabsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-tab]');
        if (btn) switchTab(btn.dataset.tab);
      });
      adminReady = true;
    }

    renderPanels();
  } catch (error) {
    console.error(error);
    showToast('Panel yüklenemedi. Sayfayı yenileyin.');
  }
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = document.getElementById('login-error');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const pass = document.getElementById('login-password').value.trim();

  submitBtn.disabled = true;
  submitBtn.textContent = 'Giriş yapılıyor...';

  try {
    const data = await loadContent();
    if (pass !== getAdminPassword(data)) {
      err.textContent = 'Yanlış şifre.';
      err.hidden = false;
      return;
    }

    err.hidden = true;
    setAdminAuthed(true, pass);
    showApp();
    await bootAdmin();
    showToast('Panele hoş geldiniz.');
  } catch (error) {
    console.error(error);
    err.textContent = `Hata: ${error.message}`;
    err.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Giriş';
  }
});

if (isAdminAuthed()) {
  showApp();
  bootAdmin();
} else {
  showLogin();
}

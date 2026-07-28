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
  { id: 'about', label: 'Tanıtım' },
  { id: 'projects', label: 'Projeler' },
  { id: 'beats', label: 'Beat Satışı' },
  { id: 'services', label: 'Hizmetler' },
  { id: 'contact', label: 'İletişim' },
  { id: 'media', label: 'Görseller' },
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

async function uploadImageFile(file, folder = 'images') {
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
    /* API yoksa data URL */
  }
  return dataUrl;
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

function ensureShape() {
  content.version = 2;
  content.admin ||= { password: 'Gülpembe3169' };
  content.seo ||= { title: '', description: '' };
  content.hero ||= { copy: '', cta: '' };
  content.about ||= { titleTR: 'TANITIM', titleEN: 'ABOUT', textTR: '', textEN: '', cutout: '' };
  content.contact ||= { textTR: '', cta: 'INSTAGRAM DM' };
  content.theme ||= { bg: '#18181c', bg2: '#222228', accent: '#9b6dff', text: '#f2f2ef' };
  content.nav ||= [];
  content.projects ||= [];
  content.beats ||= [];
  content.stems ||= [];
  content.services ||= [];
}

function renderGeneral() {
  return `
    <section class="admin-panel is-active" data-panel="general">
      <h2>Genel & SEO</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Marka', 'brand', content.brand)}
        ${field('Rol (TR)', 'roleTR', content.roleTR)}
        ${field('Rol (EN)', 'roleEN', content.roleEN)}
        ${field('E-posta', 'email', content.email)}
        ${field('Instagram handle', 'instagramHandle', content.instagramHandle)}
        ${field('Instagram URL', 'instagramUrl', content.instagramUrl)}
        ${field('Instagram DM URL', 'instagramDmUrl', content.instagramDmUrl)}
        ${field('Sayfa başlığı', 'seo.title', content.seo.title)}
        ${field('Meta açıklama', 'seo.description', content.seo.description, 'textarea', 3)}
        ${field('Radyo playlist ID', 'radioPlaylistId', content.radioPlaylistId)}
        ${field('Beat fiyatı', 'beatPrice', content.beatPrice)}
      </div>
      <div class="admin-card-block">
        <h3>Masaüstü menü (her satır: TR|EN|#href)</h3>
        <textarea data-key="navRaw" rows="6">${esc(
          (content.nav || []).map((n) => `${n.labelTR}|${n.labelEN}|${n.href}`).join('\n')
        )}</textarea>
      </div>
    </section>`;
}

function renderHero() {
  return `
    <section class="admin-panel" data-panel="hero">
      <h2>Hero</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Hero yazısı', 'hero.copy', content.hero.copy, 'textarea', 2)}
        ${field('Buton metni', 'hero.cta', content.hero.cta)}
        ${field('Hero video yolu', 'heroVideo', content.heroVideo)}
      </div>
    </section>`;
}

function renderAbout() {
  return `
    <section class="admin-panel" data-panel="about">
      <h2>Tanıtım</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Başlık TR', 'about.titleTR', content.about.titleTR)}
        ${field('Başlık EN', 'about.titleEN', content.about.titleEN)}
        ${field('Cutout görsel yolu', 'about.cutout', content.about.cutout || content.aboutCutout || '')}
        ${field('Metin TR', 'about.textTR', content.about.textTR, 'textarea', 12)}
        ${field('Metin EN', 'about.textEN', content.about.textEN, 'textarea', 12)}
      </div>
    </section>`;
}

function renderProjectsPanel() {
  return `
    <section class="admin-panel" data-panel="projects">
      <h2>Projeler</h2>
      <p class="image-upload-hint">YouTube ID gir; thumbnail otomatik oluşur.</p>
      <div id="projects-list"></div>
      <button type="button" class="btn-ghost" data-add-project>+ Proje ekle</button>
    </section>`;
}

function renderProjectsList() {
  const wrap = document.getElementById('projects-list');
  if (!wrap) return;
  wrap.innerHTML = content.projects
    .map(
      (p, i) => `
    <div class="admin-card-block" data-project="${i}">
      <div class="admin-card-head">
        <h3>Proje ${i + 1}</h3>
        <button type="button" class="btn-ghost" data-remove-project="${i}">Sil</button>
      </div>
      <div class="admin-grid admin-grid-2">
        <label>ID<input data-project-field="id" value="${esc(p.id)}" /></label>
        <label>Başlık<input data-project-field="title" value="${esc(p.title)}" /></label>
        <label>YouTube ID<input data-project-field="youtubeId" value="${esc(p.youtubeId)}" /></label>
        <label>Durum<select data-project-field="status">
          <option value="published" ${p.status === 'published' ? 'selected' : ''}>Yayında</option>
          <option value="soon" ${p.status === 'soon' ? 'selected' : ''}>Yakında</option>
        </select></label>
      </div>
    </div>`
    )
    .join('');
}

function renderBeatsPanel() {
  return `
    <section class="admin-panel" data-panel="beats">
      <h2>Beat Satışı</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Stem listesi (virgülle)', 'stemsRaw', (content.stems || []).join(', '))}
      </div>
      <div id="beats-list"></div>
      <button type="button" class="btn-ghost" data-add-beat>+ Beat ekle</button>
    </section>`;
}

function renderBeatsList() {
  const wrap = document.getElementById('beats-list');
  if (!wrap) return;
  wrap.innerHTML = content.beats
    .map(
      (b, i) => `
    <div class="admin-card-block" data-beat="${i}">
      <div class="admin-card-head">
        <h3>Beat ${i + 1}</h3>
        <button type="button" class="btn-ghost" data-remove-beat="${i}">Sil</button>
      </div>
      <div class="admin-grid admin-grid-2">
        <label>ID<input data-beat-field="id" value="${esc(b.id)}" /></label>
        <label>Numara<input data-beat-field="number" value="${esc(b.number)}" /></label>
        <label style="grid-column:1/-1">Audio yolu<input data-beat-field="audio" value="${esc(b.audio)}" /></label>
      </div>
    </div>`
    )
    .join('');
}

function renderServicesPanel() {
  return `
    <section class="admin-panel" data-panel="services">
      <h2>Hizmetler</h2>
      <div id="services-list"></div>
      <button type="button" class="btn-ghost" data-add-service>+ Hizmet ekle</button>
    </section>`;
}

function renderServicesList() {
  const wrap = document.getElementById('services-list');
  if (!wrap) return;
  wrap.innerHTML = content.services
    .map(
      (s, i) => `
    <div class="admin-card-block" data-service="${i}">
      <div class="admin-card-head">
        <h3>Hizmet ${i + 1}</h3>
        <button type="button" class="btn-ghost" data-remove-service="${i}">Sil</button>
      </div>
      <div class="admin-grid admin-grid-2">
        <label>EN<input data-service-field="en" value="${esc(s.en)}" /></label>
        <label>TR<input data-service-field="tr" value="${esc(s.tr)}" /></label>
      </div>
    </div>`
    )
    .join('');
}

function renderContact() {
  return `
    <section class="admin-panel" data-panel="contact">
      <h2>İletişim</h2>
      <div class="admin-grid admin-grid-2">
        ${field('İletişim metni', 'contact.textTR', content.contact.textTR, 'textarea', 3)}
        ${field('Buton metni', 'contact.cta', content.contact.cta)}
      </div>
    </section>`;
}

function renderMedia() {
  return `
    <section class="admin-panel" data-panel="media">
      <h2>Görseller & Medya</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Footer / portre üst (top)', 'portraitTop', content.portraitTop)}
        ${field('Footer / portre alt (bottom)', 'portraitBottom', content.portraitBottom)}
        ${field('Karga tüyü', 'crowFeather', content.crowFeather)}
        ${field('Tanıtım cutout', 'aboutCutout', content.aboutCutout)}
        ${field('Hero video', 'heroVideo', content.heroVideo)}
      </div>
      <p class="image-upload-hint">Dosyaları <code>public/images/</code>, <code>public/</code> veya <code>public/videos/</code> altına koyup yolu buraya yaz.</p>
    </section>`;
}

function renderTheme() {
  const t = content.theme;
  return `
    <section class="admin-panel" data-panel="theme">
      <h2>Tema</h2>
      <div class="admin-grid admin-grid-2">
        ${field('Arka plan', 'theme.bg', t.bg, 'color')}
        ${field('İkincil arka plan', 'theme.bg2', t.bg2, 'color')}
        ${field('Vurgu (mor)', 'theme.accent', t.accent, 'color')}
        ${field('Yazı rengi', 'theme.text', t.text, 'color')}
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
    </section>`;
}

function renderPanels() {
  ensureShape();
  panelsEl.innerHTML = [
    renderGeneral(),
    renderHero(),
    renderAbout(),
    renderProjectsPanel(),
    renderBeatsPanel(),
    renderServicesPanel(),
    renderContact(),
    renderMedia(),
    renderTheme(),
    renderAdmin(),
  ].join('');
  renderProjectsList();
  renderBeatsList();
  renderServicesList();
}

function renderTabs() {
  tabsEl.innerHTML = TABS.map(
    (tab, i) =>
      `<button type="button" class="admin-tab ${i === 0 ? 'is-active' : ''}" data-tab="${tab.id}">${tab.label}</button>`
  ).join('');
}

function switchTab(id) {
  document.querySelectorAll('.admin-tab').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tab === id));
  document.querySelectorAll('.admin-panel').forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.panel === id);
  });
}

function readListFields() {
  document.querySelectorAll('[data-project]').forEach((block) => {
    const i = Number(block.dataset.project);
    const youtubeId = block.querySelector('[data-project-field="youtubeId"]').value.trim();
    content.projects[i] = {
      id: block.querySelector('[data-project-field="id"]').value.trim() || `project-${i + 1}`,
      title: block.querySelector('[data-project-field="title"]').value,
      youtubeId,
      youtubeUrl: youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : '',
      thumbnail: youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : '',
      status: block.querySelector('[data-project-field="status"]').value,
      descriptionTR: content.projects[i]?.descriptionTR || '',
      descriptionEN: content.projects[i]?.descriptionEN || '',
    };
  });

  document.querySelectorAll('[data-beat]').forEach((block) => {
    const i = Number(block.dataset.beat);
    content.beats[i] = {
      id: block.querySelector('[data-beat-field="id"]').value.trim() || `beat-${i + 1}`,
      number: block.querySelector('[data-beat-field="number"]').value,
      audio: block.querySelector('[data-beat-field="audio"]').value,
    };
  });

  document.querySelectorAll('[data-service]').forEach((block) => {
    const i = Number(block.dataset.service);
    content.services[i] = {
      en: block.querySelector('[data-service-field="en"]').value,
      tr: block.querySelector('[data-service-field="tr"]').value,
    };
  });
}

function gatherContentFromForm() {
  readListFields();
  document.querySelectorAll('.admin-panel').forEach((panel) => {
    deepMerge(content, collectPanel(panel));
  });

  const navRaw = document.querySelector('[data-key="navRaw"]');
  if (navRaw) {
    content.nav = navRaw.value
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [labelTR, labelEN, href] = line.split('|').map((s) => (s || '').trim());
        return { labelTR: labelTR || '', labelEN: labelEN || '', href: href || '#' };
      });
    delete content.navRaw;
  }

  const stemsRaw = document.querySelector('[data-key="stemsRaw"]');
  if (stemsRaw) {
    content.stems = stemsRaw.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    delete content.stemsRaw;
  }

  if (content.about?.cutout) content.aboutCutout = content.about.cutout;
  content.version = 2;
}

function bindDynamicActions() {
  panelsEl.addEventListener('click', (e) => {
    const t = e.target;
    if (t.matches('[data-add-project]')) {
      gatherContentFromForm();
      content.projects.push({
        id: `project-${content.projects.length + 1}`,
        title: 'Yeni Proje',
        youtubeId: '',
        youtubeUrl: '',
        thumbnail: '',
        status: 'soon',
        descriptionTR: '',
        descriptionEN: '',
      });
      renderProjectsList();
    }
    if (t.matches('[data-remove-project]')) {
      gatherContentFromForm();
      content.projects.splice(Number(t.dataset.removeProject), 1);
      renderProjectsList();
    }
    if (t.matches('[data-add-beat]')) {
      gatherContentFromForm();
      const n = String(content.beats.length + 1).padStart(2, '0');
      content.beats.push({ id: `beat-${n}`, number: `BEAT ${n}`, audio: `./audio/beat-${n}.mp3` });
      renderBeatsList();
    }
    if (t.matches('[data-remove-beat]')) {
      gatherContentFromForm();
      content.beats.splice(Number(t.dataset.removeBeat), 1);
      renderBeatsList();
    }
    if (t.matches('[data-add-service]')) {
      gatherContentFromForm();
      content.services.push({ en: 'NEW SERVICE', tr: 'YENİ HİZMET' });
      renderServicesList();
    }
    if (t.matches('[data-remove-service]')) {
      gatherContentFromForm();
      content.services.splice(Number(t.dataset.removeService), 1);
      renderServicesList();
    }
  });
}

function bindStaticActions() {
  document.getElementById('save-btn').addEventListener('click', async () => {
    gatherContentFromForm();
    const result = await saveContent(content);
    if (result.persisted) showToast('Kaydedildi. Siteyi yenile.');
    else showToast(result.error || 'Kayıt başarısız.');
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
    ensureShape();
    renderPanels();
    showToast('JSON yüklendi. Kaydetmeyi unutma.');
    e.target.value = '';
  });

  document.getElementById('reset-btn').addEventListener('click', async () => {
    if (!confirm('Varsayılana dönülsün mü?')) return;
    clearStoredContent();
    content = await fetchDefaultContent();
    ensureShape();
    renderPanels();
    showToast('Varsayılan yüklendi.');
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
    ensureShape();
    if (content.version !== 2) {
      showToast('Eski içerik formatı — Sıfırla ile yeni şemaya geçebilirsin.');
    }

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
    showToast('Panel yüklenemedi.');
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

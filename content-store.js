export const STORAGE_KEY = 'kxrgx-site-content';
export const AUTH_KEY = 'kxrgx-admin-auth';
export const PASS_KEY = 'kxrgx-admin-pass';

let cachedDefault = null;

function cloneData(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function apiUrl(path) {
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).pathname;
}

export async function fetchDefaultContent() {
  if (cachedDefault) return cloneData(cachedDefault);
  const base = import.meta.env.BASE_URL || './';
  const res = await fetch(`${base}site-content.json`);
  if (!res.ok) throw new Error('site-content.json yüklenemedi');
  cachedDefault = await res.json();
  return cloneData(cachedDefault);
}

export async function loadContent() {
  try {
    const res = await fetch(apiUrl('/api/content'), { cache: 'no-store' });
    if (res.ok) {
      const remote = await res.json();
      if (remote && typeof remote === 'object' && !remote.error) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
        return remote;
      }
    }
  } catch {
    /* API yoksa fallback */
  }

  const defaults = await fetchDefaultContent();
  if (!defaults.admin) defaults.admin = {};
  if (!defaults.admin.password || defaults.admin.password === 'kxrgx') {
    defaults.admin.password = 'Gülpembe3169';
  }
  return defaults;
}

export function getAdminPassword(content) {
  const password = content?.admin?.password;
  if (typeof password === 'string' && password.length > 0 && password !== 'kxrgx') {
    return password;
  }
  return 'Gülpembe3169';
}

export async function saveContent(content) {
  const password = sessionStorage.getItem(PASS_KEY) || '';
  const payload = JSON.stringify({ password, content });

  try {
    const res = await fetch(apiUrl('/api/content'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': password,
      },
      body: payload,
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok !== false) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
      cachedDefault = cloneData(content);
      return { saved: true, persisted: true };
    }
    return {
      saved: false,
      persisted: false,
      error: data.error || `Kayıt başarısız (${res.status})`,
    };
  } catch (error) {
    return { saved: false, persisted: false, error: error.message || 'Ağ hatası' };
  }
}

export function clearStoredContent() {
  localStorage.removeItem(STORAGE_KEY);
  cachedDefault = null;
}

export function exportContent(content) {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'site-content.json';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importContentFile(file) {
  const text = await file.text();
  return JSON.parse(text);
}

export function isAdminAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === '1';
}

export function setAdminAuthed(value, password = '') {
  if (value) {
    sessionStorage.setItem(AUTH_KEY, '1');
    if (password) sessionStorage.setItem(PASS_KEY, password);
  } else {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(PASS_KEY);
  }
}

export function getSessionPassword() {
  return sessionStorage.getItem(PASS_KEY) || '';
}

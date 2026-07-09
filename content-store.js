export const STORAGE_KEY = 'kxrgx-site-content';
export const AUTH_KEY = 'kxrgx-admin-auth';

let cachedDefault = null;

function cloneData(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function deepMergeDefaults(base, override) {
  const out = cloneData(base);
  if (!override || typeof override !== 'object') return out;

  Object.keys(override).forEach((key) => {
    const value = override[key];
    if (value && typeof value === 'object' && !Array.isArray(value) && out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])) {
      out[key] = deepMergeDefaults(out[key], value);
    } else {
      out[key] = value;
    }
  });

  return out;
}

export async function fetchDefaultContent() {
  if (cachedDefault) return cloneData(cachedDefault);
  const res = await fetch('/site-content.json');
  if (!res.ok) throw new Error('site-content.json yüklenemedi');
  cachedDefault = await res.json();
  return cloneData(cachedDefault);
}

export async function loadContent() {
  const defaults = await fetchDefaultContent();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return deepMergeDefaults(defaults, JSON.parse(stored));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  return defaults;
}

export function getAdminPassword(content) {
  const password = content?.admin?.password;
  if (typeof password === 'string' && password.length > 0) return password;
  return 'kxrgx';
}

export async function saveContent(content) {
  const json = JSON.stringify(content, null, 2);
  localStorage.setItem(STORAGE_KEY, json);

  try {
    const res = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
    });
    if (res.ok) return { saved: true, persisted: true };
  } catch {
    /* dev API yoksa localStorage yeterli */
  }

  return { saved: true, persisted: false };
}

export function clearStoredContent() {
  localStorage.removeItem(STORAGE_KEY);
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

export function setAdminAuthed(value) {
  if (value) sessionStorage.setItem(AUTH_KEY, '1');
  else sessionStorage.removeItem(AUTH_KEY);
}

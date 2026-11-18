// All data lives in the browser (localStorage) - no backend needed.
const MATERIALS_KEY = 'studyflow.materials.v1';
const API_KEY_KEY = 'studyflow.apiKey';

export function loadMaterials() {
  try {
    const raw = localStorage.getItem(MATERIALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMaterials(materials) {
  try {
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials));
  } catch (err) {
    console.warn('Could not save to localStorage', err);
  }
}

export function loadApiKey() {
  try {
    return localStorage.getItem(API_KEY_KEY) || import.meta.env.VITE_GEMINI_API_KEY || '';
  } catch {
    return '';
  }
}

export function saveApiKey(key) {
  try {
    if (key) localStorage.setItem(API_KEY_KEY, key);
    else localStorage.removeItem(API_KEY_KEY);
  } catch (err) {
    console.warn('Could not save API key', err);
  }
}

export function clearAllData() {
  try {
    localStorage.removeItem(MATERIALS_KEY);
  } catch (err) {
    console.warn(err);
  }
}

// All data lives in the browser (localStorage) - no backend needed.
// Materials and calendar events are stored per user, so every account has its own data.
const LEGACY_MATERIALS_KEY = 'studyflow.materials.v1'; // before accounts existed
const API_KEY_KEY = 'studyflow.apiKey';

const materialsKey = (userId) => `studyflow.materials.v1.${userId}`;
const eventsKey = (userId) => `studyflow.events.v1.${userId}`;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Could not save to localStorage', err);
  }
}

export const loadMaterials = (userId) => read(materialsKey(userId), []);
export const saveMaterials = (userId, materials) => write(materialsKey(userId), materials);

export const loadEvents = (userId) => read(eventsKey(userId), []);
export const saveEvents = (userId, events) => write(eventsKey(userId), events);

// Materials saved before login existed are handed to the first account that signs up.
export function adoptLegacyData(userId) {
  const legacy = read(LEGACY_MATERIALS_KEY, null);
  if (!legacy) return;
  write(materialsKey(userId), legacy);
  try {
    localStorage.removeItem(LEGACY_MATERIALS_KEY);
  } catch {
    /* ignore */
  }
}

export function clearUserData(userId) {
  try {
    localStorage.removeItem(materialsKey(userId));
    localStorage.removeItem(eventsKey(userId));
  } catch (err) {
    console.warn(err);
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

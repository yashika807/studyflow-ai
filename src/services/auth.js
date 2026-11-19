// Simple front-end-only accounts for this project (no server).
// Users are kept in localStorage; passwords are salted and hashed with PBKDF2 (never stored as plain text).
// NOTE: this keeps different people's data separate on one browser - it is not a replacement for real server-side authentication.
import { adoptLegacyData } from './storage.js';

const USERS_KEY = 'studyflow.users.v1';
const SESSION_KEY = 'studyflow.session';
const ITERATIONS = 100000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

const toHex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function hashPassword(password, saltHex) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Login needs a secure page (https or localhost).');
  }
  const salt = Uint8Array.from(saltHex.match(/.{2}/g).map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256);
  return toHex(bits);
}

const publicUser = ({ id, name, email }) => ({ id, name, email });

export async function signUp({ name, email, password }) {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanName) throw new Error('Please enter your name.');
  if (!EMAIL_RE.test(cleanEmail)) throw new Error('Please enter a valid email address.');
  if ((password || '').length < 6) throw new Error('Password must be at least 6 characters.');

  const users = readUsers();
  if (users.some((u) => u.email === cleanEmail)) {
    throw new Error('An account with this email already exists. Try logging in instead.');
  }

  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const user = {
    id: crypto.randomUUID(),
    name: cleanName,
    email: cleanEmail,
    salt,
    hash: await hashPassword(password, salt),
    createdAt: Date.now(),
  };

  if (users.length === 0) adoptLegacyData(user.id); // keep materials created before login existed
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  localStorage.setItem(SESSION_KEY, user.id);
  return publicUser(user);
}

export async function logIn({ email, password }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const user = readUsers().find((u) => u.email === cleanEmail);
  const wrong = new Error('Incorrect email or password.');

  if (!user) throw wrong;
  if ((await hashPassword(password || '', user.salt)) !== user.hash) throw wrong;

  localStorage.setItem(SESSION_KEY, user.id);
  return publicUser(user);
}

export function getSessionUser() {
  try {
    const id = localStorage.getItem(SESSION_KEY);
    const user = readUsers().find((u) => u.id === id);
    return user ? publicUser(user) : null;
  } catch {
    return null;
  }
}

export function logOut() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

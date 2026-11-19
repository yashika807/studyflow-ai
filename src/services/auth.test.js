import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSessionUser, logIn, logOut, signUp } from './auth.js';

// Tests run in Node, so give them a tiny in-memory localStorage.
function installLocalStorage() {
  const store = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  });
  return store;
}

let store;
beforeEach(() => {
  store = installLocalStorage();
});

const details = { name: 'Test User', email: 'Test@Example.com', password: 'secret123' };

describe('signUp', () => {
  it('creates an account, logs the user in and never stores the plain password', async () => {
    const user = await signUp(details);
    expect(user).toMatchObject({ name: 'Test User', email: 'test@example.com' });
    expect(getSessionUser()).toEqual(user);

    const saved = store.get('studyflow.users.v1');
    expect(saved).not.toContain('secret123');
    expect(JSON.parse(saved)[0]).toHaveProperty('hash');
  });

  it('validates the input', async () => {
    await expect(signUp({ ...details, name: '  ' })).rejects.toThrow(/name/i);
    await expect(signUp({ ...details, email: 'not-an-email' })).rejects.toThrow(/email/i);
    await expect(signUp({ ...details, password: '123' })).rejects.toThrow(/6 characters/);
  });

  it('rejects a second account with the same email (any letter case)', async () => {
    await signUp(details);
    await expect(signUp({ ...details, email: 'TEST@example.com' })).rejects.toThrow(/already exists/);
  });

  it('gives the first account the materials saved before login existed', async () => {
    store.set('studyflow.materials.v1', JSON.stringify([{ id: 'm1' }]));
    const user = await signUp(details);
    expect(JSON.parse(store.get(`studyflow.materials.v1.${user.id}`))).toEqual([{ id: 'm1' }]);
    expect(store.has('studyflow.materials.v1')).toBe(false);
  });

  it('does not hand old materials to later accounts', async () => {
    await signUp(details);
    store.set('studyflow.materials.v1', JSON.stringify([{ id: 'late' }]));
    const second = await signUp({ ...details, email: 'other@example.com' });
    expect(store.has(`studyflow.materials.v1.${second.id}`)).toBe(false);
  });

  it('salts passwords so equal passwords have different hashes', async () => {
    await signUp(details);
    await signUp({ ...details, email: 'other@example.com' });
    const [a, b] = JSON.parse(store.get('studyflow.users.v1'));
    expect(a.hash).not.toBe(b.hash);
  });
});

describe('logIn / logOut', () => {
  it('logs in with the right password, ignoring email letter case', async () => {
    await signUp(details);
    logOut();
    expect(getSessionUser()).toBeNull();

    const user = await logIn({ email: ' TEST@example.com ', password: 'secret123' });
    expect(user.email).toBe('test@example.com');
    expect(getSessionUser()).toEqual(user);
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    await signUp(details);
    logOut();
    await expect(logIn({ email: 'test@example.com', password: 'wrong-password' })).rejects.toThrow('Incorrect email or password.');
    await expect(logIn({ email: 'nobody@example.com', password: 'secret123' })).rejects.toThrow('Incorrect email or password.');
    expect(getSessionUser()).toBeNull();
  });

  it('forgets the session on logout', async () => {
    await signUp(details);
    logOut();
    expect(getSessionUser()).toBeNull();
  });
});

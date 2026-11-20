// Small wrappers around localStorage. Every read and write is wrapped in
// try/catch because storage can be blocked (private windows, strict
// browser settings); the app then simply forgets between visits.
export const KEYS = {
  token: 'foodloop_token',
  theme: 'foodloop_theme',
  seenWelcome: 'foodloop_seen_welcome',
};

export function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked: nothing to do */
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage blocked: nothing to do */
  }
}

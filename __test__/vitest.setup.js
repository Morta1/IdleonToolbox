import { afterEach } from 'vitest';

// Components persist their selects through useLocalStorage, so a test that picks an option would
// otherwise change the defaults every later test in the same file renders with.
afterEach(() => {
  if (typeof localStorage === 'undefined') return;
  localStorage.clear();
  sessionStorage.clear();
});

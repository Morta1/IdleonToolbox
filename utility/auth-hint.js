// Whether the last visit ended with a firebase session. 'no' lets AppProvider skip loading the
// firebase SDK (~700 KB) for a returning anonymous visitor; absent means undecided, so firebase
// is asked. A hint, never an authority: 'no' is only ever written after firebase itself reported
// no user, or on an explicit logout.
export const AUTH_HINT_KEY = 'authHint';

// Storage access throws with site data blocked, and an unreadable hint is the same as absent.
export const readAuthHint = () => {
  try {
    return localStorage.getItem(AUTH_HINT_KEY);
  } catch {
    return null;
  }
};

export const writeAuthHint = (value) => {
  try {
    localStorage.setItem(AUTH_HINT_KEY, value);
  } catch {
    // The next visit asks firebase again, which is the safe default.
  }
};

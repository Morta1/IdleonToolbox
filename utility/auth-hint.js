// Whether the last visit ended with a firebase session. 'no' lets AppProvider skip loading the
// firebase SDK (~700 KB) for a returning anonymous visitor; absent means undecided, so firebase
// is asked, which also covers everyone who signed in before this key existed. It is a hint,
// never an authority: 'no' is only written after firebase itself reported no user or on an
// explicit logout, and every login path writes 'yes' before the next page load.
export const AUTH_HINT_KEY = 'authHint';

// Storage access throws in some contexts (blocked site data, some private windows). A hint that
// cannot be read is the same as absent: ask firebase.
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

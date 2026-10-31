// Every way a login can fail, as a short message plus an optional next step. Messages stay under
// ~60 characters so they fit one line of the login dialog on a phone.
export const LOGIN_ERRORS = {
  STEAM_URL_NO_HTTPS: {
    message: 'Url is missing "https://"',
    hint: 'Copy the whole address bar, including "https://".'
  },
  STEAM_URL_FORMAT: { message: 'Wrong url', hint: 'Copy it from the address bar after signing in to Steam.' },
  STEAM_URL_INVALID: { message: 'Incomplete Steam url', hint: 'Copy the whole address bar.' },
  STEAM_URL_REJECTED: {
    message: 'Steam didn\'t accept this url',
    hint: 'Each url works once: sign in again and paste the new one right away.'
  },
  STEAM_SERVER: { message: 'Login server error ({status})', hint: 'Try again in a few minutes.' },
  GOOGLE_UNREACHABLE: { message: 'Couldn\'t reach Google', hint: 'Check your connection and reopen this dialog.' },
  GOOGLE_CANCELLED: { message: 'Google sign-in was cancelled' },
  LOGIN_CODE_EXPIRED: { message: 'Login code expired', hint: 'Reopen this dialog.' },
  LOGIN_TIMEOUT: { message: 'Login timed out', hint: 'Reopen this dialog.' },
  APPLE_START_FAILED: { message: 'Couldn\'t start Apple sign-in', hint: 'Allow popups for this site.' },
  EMAIL_WRONG_CREDENTIALS: { message: 'Wrong email or password' },
  EMAIL_MISSING_FIELDS: { message: 'Enter your email and password' },
  INVALID_TOKEN: { message: 'Invalid login token', hint: 'Sign in again.' },
  ACCOUNT_DISABLED: { message: 'This account is disabled', hint: 'Contact Lavaflame through the game\'s support.' },
  ACCOUNT_EXISTS: { message: 'Email linked to another login', hint: 'Use the login method you use in the game.' },
  TOO_MANY_ATTEMPTS: { message: 'Too many attempts', hint: 'Wait a few minutes.' },
  NETWORK: { message: 'Couldn\'t connect', hint: 'Check your connection or ad blocker.' },
  NO_CHARACTERS: {
    message: 'No characters on this account',
    hint: 'Your save may be on another login: another Steam account, email, Google or Apple.'
  },
  SAVE_LOAD_FAILED: { message: 'Couldn\'t load your save', hint: 'Refresh the page.' },
  SESSION_RESTORE_FAILED: { message: 'You were logged out', hint: 'Sign in again.' },
  UNKNOWN: { message: 'Login failed ({code})', hint: 'Try again, and report it on Discord if it keeps happening.' }
};

const FIREBASE_CODES = {
  'auth/invalid-custom-token': 'INVALID_TOKEN',
  'auth/custom-token-mismatch': 'INVALID_TOKEN',
  'auth/user-token-expired': 'INVALID_TOKEN',
  'auth/user-disabled': 'ACCOUNT_DISABLED',
  'auth/account-exists-with-different-credential': 'ACCOUNT_EXISTS',
  'auth/too-many-requests': 'TOO_MANY_ATTEMPTS',
  'auth/network-request-failed': 'NETWORK'
};

export class LoginError extends Error {
  constructor(code, params = {}) {
    super(LOGIN_ERRORS[code]?.message ?? code);
    this.name = 'LoginError';
    this.code = code;
    this.params = params;
  }
}

export const describeLoginError = (code, params) => toLoginError(new LoginError(code, params));

const fill =(text, params) => text?.replace(/\{(\w+)\}/g, (match, key) => params?.[key] ?? match);

// Turns anything a login step can throw into what the dialog shows. A fetch that never reached its
// server throws a TypeError, which is a network failure whatever the browser calls it.
export const toLoginError = (error) => {
  let code = error?.code;
  let params = error?.params ?? {};
  if (!(error instanceof LoginError)) {
    if (FIREBASE_CODES[code]) {
      code = FIREBASE_CODES[code];
    } else if (error instanceof TypeError) {
      code = 'NETWORK';
    } else {
      params = { code: code ?? error?.message ?? 'unknown' };
      code = 'UNKNOWN';
    }
  }
  const { message, hint } = LOGIN_ERRORS[code] ?? LOGIN_ERRORS.UNKNOWN;
  return { code, message: fill(message, params), hint: fill(hint, params) };
};

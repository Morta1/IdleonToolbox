// The only place allowed to import firebase/index.js: that module runs getAuth, getDatabase and
// getFirestore at module top, so a static import from anything _app renders puts ~700 KB into the
// chunk every exported page loads. The memoised promise is cleared on rejection so a failed load
// can be retried.
let pending = null;

export const loadFirebase = () => {
  if (!pending) {
    pending = import('./index').catch((err) => {
      pending = null;
      throw err;
    });
  }
  return pending;
};

// The token kept from sign-in runs out after an hour in an open tab, so a signed-in request to a worker asks
// Firebase for the current one. If Firebase cannot be asked, the stored one still goes out and the worker answers
// for it. source goes out as X-Token-Source, for the worker's log.
export const currentToken = async (stored) => {
  const fresh = await loadFirebase().then(({ getFreshToken }) => getFreshToken()).catch(() => null);
  return fresh ? { token: fresh, source: 'fresh' } : { token: stored, source: 'stored' };
};

// Lets logout() skip signing out of an SDK that was never loaded, which is every anonymous visit.
export const firebaseRequested = () => pending !== null;

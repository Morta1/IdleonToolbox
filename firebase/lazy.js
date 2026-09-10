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

// Lets logout() skip signing out of an SDK that was never loaded, which is every anonymous visit.
export const firebaseRequested = () => pending !== null;

// The only place allowed to import firebase/index.js. That module runs getAuth, getDatabase and
// getFirestore at module top, so a static import from anything _app renders puts ~700 KB into
// the chunk every exported page loads. One memoised promise: the first caller pays for the
// download, later callers share it, and a rejected load is retried by the next call.
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

// Whether anyone has asked for firebase this session. logout() uses it to skip signing out of a
// SDK that was never loaded, which is every anonymous visitor.
export const firebaseRequested = () => pending !== null;

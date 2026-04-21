import { useContext, useEffect, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';

// Returns { authReady, signedIn }.
//
// `state.signedIn` starts as `false` before Firebase's auth listener has
// reported back, so naïvely checking it causes "Sign in to …" prompts to
// flash for users who are actually signed in. This hook treats auth as
// "not yet resolved" until one of the following happens:
//   - state.signedIn flips to true (we know the outcome)
//   - a short grace period elapses (assume not signed in)
//
// Consumers should render a loader or hide auth-gated content while
// `authReady` is false.
const DEFAULT_GRACE_MS = 1000;

const useAuthReady = (graceMs = DEFAULT_GRACE_MS) => {
  const { state } = useContext(AppContext);
  const signedIn = !!state?.signedIn;
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setElapsed(true), graceMs);
    return () => clearTimeout(t);
  }, [graceMs]);

  return {
    authReady: signedIn || elapsed,
    signedIn
  };
};

export default useAuthReady;

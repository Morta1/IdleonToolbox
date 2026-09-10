import { useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { readAuthHint } from '@utility/auth-hint';

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

const subscribe = () => () => {};

const useAuthReady = (graceMs = DEFAULT_GRACE_MS) => {
  const { state } = useContext(AppContext);
  const signedIn = !!state?.signedIn;
  const loginSettled = state?.isLoading === false;
  const [elapsed, setElapsed] = useState(false);
  // Storage is a client-only fact, so the build and the hydration render must both see `false`
  // and only the render after may see the hint (same pattern as useHydrated).
  const hasHint = useSyncExternalStore(subscribe, () => readAuthHint() === 'yes', () => false);

  useEffect(() => {
    const t = setTimeout(() => setElapsed(true), graceMs);
    return () => clearTimeout(t);
  }, [graceMs]);

  // A visitor the hint says was signed in waits for a real answer instead of the grace period,
  // which races a chunk download plus auth plus parse and, when the timer wins, redirects them
  // away from their own builds.
  const resolved = hasHint ? (signedIn || loginSettled) : (signedIn || elapsed);

  return {
    authReady: resolved,
    signedIn
  };
};

export default useAuthReady;

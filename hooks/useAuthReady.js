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
  // and only the render after may see the hint. Same pattern as useHydrated.
  const hasHint = useSyncExternalStore(subscribe, () => readAuthHint() === 'yes', () => false);

  useEffect(() => {
    const t = setTimeout(() => setElapsed(true), graceMs);
    return () => clearTimeout(t);
  }, [graceMs]);

  // The grace period was calibrated when firebase shipped with the page. It now races a chunk
  // download plus auth plus parse, and when the timer wins, a signed-in visitor is redirected away
  // from /tools/builds/new and told to sign in on my-builds. A visitor the last session left
  // signed in therefore waits for a real answer: signedIn, or login finishing either way.
  const resolved = hasHint ? (signedIn || loginSettled) : (signedIn || elapsed);

  return {
    authReady: resolved,
    signedIn
  };
};

export default useAuthReady;

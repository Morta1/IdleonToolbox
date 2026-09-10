import { createContext, useEffect, useReducer, useRef, useState } from 'react';
import { firebaseRequested, loadFirebase } from '../../../firebase/lazy';
import { useRouter } from 'next/router';
import useInterval from '@hooks/useInterval';
import { getUserToken } from '../../../services/auth/google';
import { geAppleStatus } from '../../../services/auth/apple';
import { getProfile } from '../../../services/profiles';
import { setRawJson } from '@utility/helpers';
import { errorMessage, trackEvent } from '@utility/analytics';
import { readAuthHint, writeAuthHint } from '@utility/auth-hint';
import { readLocalStorageValue } from '@mantine/hooks';
import { simulatedCompanionsKey } from '@components/constants';

export const AppContext = createContext({});

export const ACTION_TYPES = {
  LOGIN: 'login',
  DATA: 'data',
  LOGOUT: 'logout',
  DISPLAYED_CHARACTERS: 'displayedCharacters',
  FILTERS: 'filters',
  PINNED_PAGES: 'pinnedPages',
  PLANNER: 'planner',
  TRACKERS: 'trackers',
  GOD_PLANNER: 'godPlanner',
  LOGIN_ERROR: 'loginError',
  SHOW_RANK_ONE_ONLY: 'showRankOneOnly',
  SHOW_UNMAXED_BOXES_ONLY: 'showUnmaxedBoxesOnly',
  SET_LOADING: 'setLoading',
  SETTINGS: 'settings',
  HYDRATE_STORAGE: 'hydrateStorage'
};

export function appReducer(state, action) {
  const actionHandlers = {
    [ACTION_TYPES.LOGIN]: () => ({ ...state, ...action.data }),
    [ACTION_TYPES.DATA]: () => ({ ...state, ...action.data }),
    // Keeps UI preferences, drops everything else. A blocklist was tried and rotted immediately:
    // spreading state and naming the account keys to clear missed loginType/loginData, which the
    // auth poll below reads whenever waitingForAuth is set. Both login components arm that flag
    // before their fresh credentials arrive, so a second sign-in re-subscribed with the previous
    // user's uid and token. A whitelist drops any future session key by default. storageHydrated
    // rides along too: dropping it would make the persist effect skip every write after a logout.
    [ACTION_TYPES.LOGOUT]: () => {
      const { filters, pinnedPages, displayedCharacters, trackers, godPlanner, planner, settings,
        showRankOneOnly, showUnmaxedBoxesOnly, storageHydrated } = state;
      return {
        filters, pinnedPages, displayedCharacters, trackers, godPlanner, planner, settings,
        showRankOneOnly, showUnmaxedBoxesOnly,
        storageHydrated,
        signedIn: false,
        isLoading: false
      };
    },
    // localStorage is merged in an effect, never during render, so the build and the first
    // client render start from the same constant. This is the merge.
    [ACTION_TYPES.HYDRATE_STORAGE]: () => ({ ...state, ...action.data, storageHydrated: true }),
    [ACTION_TYPES.DISPLAYED_CHARACTERS]: () => ({ ...state, displayedCharacters: action.data }),
    [ACTION_TYPES.FILTERS]: () => ({ ...state, filters: action.data }),
    [ACTION_TYPES.PINNED_PAGES]: () => ({ ...state, pinnedPages: action.data }),
    [ACTION_TYPES.PLANNER]: () => ({ ...state, planner: action.data }),
    [ACTION_TYPES.TRACKERS]: () => ({ ...state, trackers: action.data }),
    [ACTION_TYPES.GOD_PLANNER]: () => ({ ...state, godPlanner: action.data }),
    [ACTION_TYPES.LOGIN_ERROR]: () => ({ ...state, loginError: action.data }),
    [ACTION_TYPES.SHOW_RANK_ONE_ONLY]: () => ({ ...state, showRankOneOnly: action.data }),
    [ACTION_TYPES.SHOW_UNMAXED_BOXES_ONLY]: () => ({ ...state, showUnmaxedBoxesOnly: action.data }),
    [ACTION_TYPES.SET_LOADING]: () => ({ ...state, isLoading: action.data }),
    [ACTION_TYPES.SETTINGS]: () => ({ ...state, settings: action.data })
  };

  const handler = actionHandlers[action.type];
  if (!handler) {
    throw new Error(`Unhandled action type: ${action.type}`);
  }

  return handler();
}

const STORAGE_KEYS = [
  'filters',
  'pinnedPages',
  'displayedCharacters',
  'trackers',
  'godPlanner',
  'manualImport',
  'lastUpdated',
  'planner',
  'settings'
];

// Identical on the build machine and on the client. Anything that only the client can know
// (localStorage) is merged by HYDRATE_STORAGE in an effect. storageHydrated is what the init and
// persist effects wait for.
export const DEFAULT_STATE = {
  showRankOneOnly: false,
  showUnmaxedBoxesOnly: false,
  isLoading: true,
  pinnedPages: [],
  storageHydrated: false
};

// Runs only inside an effect: reading storage during render would make the first client
// render differ from the export, which React reports as a hydration mismatch and answers by
// re-rendering the whole page client-side.
export const readStoredState = () => {
  const loadedState = STORAGE_KEYS.reduce((state, key) => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        state[key] = JSON.parse(value);
      }
    } catch (err) {
      console.warn(`Failed to parse ${key} from localStorage:`, err);
    }
    return state;
  }, {});

  if (!loadedState.pinnedPages) {
    loadedState.pinnedPages = [];
  }

  return loadedState;
};

// Same guard as the read side. A visitor with site data blocked gets a SecurityError from every
// localStorage touch, and the persist effect runs on the first render of every page (pinnedPages
// is always supplied), so an unguarded write would reach the root ErrorBoundary and turn the
// whole site into "The app failed to load".
export const writeStored = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to write ${key} to localStorage:`, err);
  }
};

// Same guard for the clear side. logout() calls it, and handleUnauthenticatedUser's catch calls
// logout: a SecurityError here would abort before loadEmptyAccount and leave isLoading false with
// no account, which every data page shows as an endless "Loading account data...".
export const removeStored = (key, storage = 'local') => {
  try {
    (storage === 'session' ? sessionStorage : localStorage).removeItem(key);
  } catch (err) {
    console.warn(`Failed to remove ${key} from storage:`, err);
  }
};

// Pets page simulation. Only ever applied to the user's own save - a profile view or the demo
// account must show what that account really has.
const getOwnAccountParseOptions = () => ({
  simulatedCompanions: readLocalStorageValue({ key: simulatedCompanionsKey, defaultValue: [] })
});

const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, DEFAULT_STATE);
  const router = useRouter();
  const [authCounter, setAuthCounter] = useState(0);
  const [waitingForAuth, setWaitingForAuth] = useState(false);
  const unsubscribeRef = useRef(null);

  const handleCloudUpdate = async (
    data, 
    charNames, 
    companion, 
    guildData, 
    tournament,
    serverVars, 
    accountCreateTime, 
    uid, 
    accessToken
  ) => {
    if (router?.query?.profile) {
      const { profile, ...rest } = router.query;
      router.replace({ query: rest });
    }

    const accountCreateTimeInSeconds = accountCreateTime?.seconds;
    const lastUpdated = new Date().getTime();
    
    setRawJson({
      data,
      charNames,
      companion,
      guildData,
      tournament,
      serverVars,
      accountCreateTime: accountCreateTimeInSeconds * 1000,
      lastUpdated
    });

    const { parseData } = await import('@parsers/index');
    let parsedData = parseData(
      data,
      charNames,
      companion,
      guildData,
      serverVars,
      accountCreateTimeInSeconds * 1000,
      tournament,
      getOwnAccountParseOptions()
    );

    localStorage.setItem('manualImport', JSON.stringify(false));

    dispatch({
      type: ACTION_TYPES.DATA,
      data: {
        ...parsedData,
        signedIn: true,
        emptyAccount: false,
        manualImport: false,
        profile: false,
        lastUpdated,
        tournament,
        serverVars,
        uid,
        accessToken,
        accountCreateTime: accountCreateTimeInSeconds * 1000,
        isLoading: false
      }
    });

    if (typeof window?.gtag !== 'undefined') {
      window.gtag('event', 'save_imported', {
        event_category: 'engagement',
        event_label: 'cloud',
        value: parsedData?.characters?.length ?? 0
      });
    }

    parsedData = null;
  };

  const loadEmptyAccount = async () => {
    const { parseData } = await import('@parsers/index');
    const parsedData = parseData(undefined, [], null, null, undefined, undefined, null);
    dispatch({
      type: ACTION_TYPES.DATA,
      data: { ...parsedData, signedIn: false, emptyAccount: true, isLoading: false }
    });
  };

  // clearAuthHint is opt-out for the one caller that is not an actual sign-out: the init effect's
  // error path, which cannot tell a transient firebase failure from a genuinely anonymous visitor.
  const logout = async (manualImport, data, { clearAuthHint = true } = {}) => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Firebase loads on demand, so an anonymous visitor has nothing to sign out of. And never
    // throw here: handleUnauthenticatedUser's catch calls this, and an error before
    // dispatch(LOGOUT) and loadEmptyAccount would leave isLoading false with no account, which
    // every data page shows as an endless "Loading account data...".
    if (firebaseRequested()) {
      try {
        const { userSignOut } = await loadFirebase();
        userSignOut();
      } catch (err) {
        console.warn('Sign-out skipped:', err);
      }
    }

    if (typeof window?.gtag !== 'undefined') {
      window.gtag('event', 'logout', {
        action: 'logout',
        category: 'engagement',
        value: 1
      });
    }
    
    removeStored('charactersData');
    removeStored('rawJson', 'session');
    dispatch({ type: ACTION_TYPES.LOGOUT });
    if (clearAuthHint) {
      writeAuthHint('no');
    }
    setWaitingForAuth(false);

    if (manualImport) {
      dispatch({ type: ACTION_TYPES.DATA, data });
      return;
    }

    await loadEmptyAccount();
  };

  // What keeps the init effect from running against DEFAULT_STATE is not this effect's position:
  // it is init's own `state.storageHydrated` guard plus that flag in its dep array. This effect
  // dispatches HYDRATE_STORAGE, the flag flips, and init re-runs with the stored values in hand.
  useEffect(() => {
    dispatch({ type: ACTION_TYPES.HYDRATE_STORAGE, data: readStoredState() });
  }, []);

  useEffect(() => {
    if (!router.isReady || !state.storageHydrated) return;

    const handleProfile = async () => {
      try {
        const content = await getProfile({ mainChar: router?.query?.profile });
        if (!content) {
          throw new Error('Failed to load data from profile api');
        }

        const { parseData } = await import('@parsers/index');
        let parsedData;

        if (!Object.keys(content).includes('serverVars')) {
          parsedData = parseData(content);
        } else {
          const { data, charNames, companion, guildData, serverVars, lastUpdated, accountCreateTime, tournament } = content;
          parsedData = parseData(data, charNames, companion, guildData, serverVars, accountCreateTime, tournament);
          const timestamp = lastUpdated || new Date().getTime();

          parsedData = { ...parsedData, lastUpdated: timestamp };

          setRawJson({
            data,
            charNames,
            companion,
            guildData,
            serverVars,
            accountCreateTime,
            tournament,
            lastUpdated: timestamp
          });
        }

        localStorage.setItem('manualImport', 'false');
        const lastUpdated = parsedData?.lastUpdated || new Date().getTime();
        // Skip only on an explicit 'no'. An absent hint on a profile link is a signed-in user's
        // first visit since the hint shipped, and treating that as anonymous would show them
        // "Login" with no way back to their own account.
        const askedFirebase = readAuthHint() !== 'no';
        const user = askedFirebase ? await (await loadFirebase()).checkUserStatus() : null;
        // Only on the branch that actually asked, and only ever 'no': nothing subscribes here, so
        // 'yes' would be a claim this path never verified. Without it a profile link re-downloads
        // the SDK on every visit for a visitor firebase already said has no session.
        if (askedFirebase && !user) writeAuthHint('no');

        dispatch({
          type: ACTION_TYPES.DATA,
          data: {
            ...parsedData,
            profile: true,
            manualImport: false,
            signedIn: !!user,
            emptyAccount: false,
            lastUpdated,
            isLoading: false
          }
        });

        if (typeof window?.gtag !== 'undefined') {
          window.gtag('event', 'save_imported', {
            event_category: 'engagement',
            event_label: 'profile',
            value: parsedData?.characters?.length ?? 0
          });
        }
      } catch (err) {
        console.error('Failed to load data from profile api', err);
        trackEvent('import_failed', { import_source: 'profile', error_message: errorMessage(err) });
        // Masked with a bare `as`: the 404 still reads reason/name off router.query (Next derives
        // it from the href, not from `as`), but the address bar stays /404. Spelling them into the
        // URL put them in router.query for every link built afterwards, which is how Search Console
        // ended up with hundreds of /leaderboards?reason=profile&name=... duplicates.
        router.push({ pathname: '/404', query: { reason: 'profile', name: router?.query?.profile } }, '/404');
        dispatch({
          type: ACTION_TYPES.DATA,
          data: {
            isLoading: false
          }
        });
      }
    };

    const handleDemoData = async () => {
      const demoJson = (await import('../../../data/raw.json')).default;
      const { data, charNames, companion, guildData, serverVars, lastUpdated } = demoJson;
      const { parseData } = await import('@parsers/index');
      const timestamp = lastUpdated || new Date().getTime();

      const parsedData = parseData(data, charNames, companion, guildData, serverVars);
      dispatch({
        type: ACTION_TYPES.DATA,
        data: {
          ...parsedData,
          lastUpdated: timestamp,
          demo: true,
          emptyAccount: false,
          isLoading: false
        }
      });

      if (typeof window?.gtag !== 'undefined') {
        window.gtag('event', 'save_imported', {
          event_category: 'engagement',
          event_label: 'demo',
          value: parsedData?.characters?.length ?? 0
        });
      }
    };

    const handleUnauthenticatedUser = async () => {
      try {
        // 'no' is only ever written after firebase itself reported no session, or on logout, so
        // a visitor carrying it has nothing to restore and skips the SDK download entirely.
        // Absent is undecided: ask firebase, which also covers everyone signed in before the
        // hint existed.
        if (readAuthHint() === 'no') {
          await loadEmptyAccount();
          return;
        }
        const { checkUserStatus, subscribe } = await loadFirebase();
        const user = await checkUserStatus();
        // Written the moment firebase answers, never after subscribe: subscribe does three network
        // reads and throws by design on "No characters found", and a visitor carrying 'no' who
        // signed in would keep it while holding a live session, so every later visit would skip
        // the SDK and show them Login.
        writeAuthHint(user ? 'yes' : 'no');
        if (!state?.account && user) {
          const unsub = await subscribe(user?.uid, user?.accessToken, handleCloudUpdate);
          unsubscribeRef.current = unsub;
        } else {
          await loadEmptyAccount();
        }
      } catch (error) {
        console.error(error);
        dispatch({ type: ACTION_TYPES.SET_LOADING, data: false });
        // The hint survives this on purpose. Anything can land here: a blocked SDK download, an
        // offline first paint, a firebase outage. 'no' means firebase itself reported no user, and
        // writing it from a failure would permanently mark a signed-in visitor anonymous, so every
        // later visit would skip the SDK and show them Login with no way back to their account.
        await logout(undefined, undefined, { clearAuthHint: false });
      }
    };

    const initializeApp = async () => {
      if (router?.query?.profile) {
        await handleProfile();
      } else if (router?.query?.demo) {
        await handleDemoData();
      } else if (!state?.signedIn) {
        await handleUnauthenticatedUser();
      } else {
        dispatch({ type: ACTION_TYPES.SET_LOADING, data: false });
      }
    };

    initializeApp();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [router.isReady, state.storageHydrated]);

  useEffect(() => {
    // Nothing to persist until storage has been merged in: before that, every value here is
    // DEFAULT_STATE, and writing it would wipe what the visitor saved.
    if (!state.storageHydrated) return;

    if (state?.filters) {
      writeStored('filters', state.filters);
    }
    if (state?.pinnedPages) {
      writeStored('pinnedPages', state.pinnedPages);
    }
    if (state?.displayedCharacters) {
      writeStored('displayedCharacters', state.displayedCharacters);
    }
    if (state?.planner) {
      writeStored('planner', state.planner);
    }
    if (state?.trackers) {
      writeStored('trackers', state.trackers);
    }
    if (state?.godPlanner) {
      writeStored('godPlanner', state.godPlanner);
    }
    if (state?.manualImport) {
      writeStored('manualImport', state.manualImport);
      const { lastUpdated = null } = readStoredState();
      if (state?.signedIn) {
        logout(true, { ...state, lastUpdated, signedIn: false, manualImport: true });
      }
    }
  }, [
    state?.trackers,
    state?.pinnedPages,
    state?.filters,
    state?.displayedCharacters,
    state?.planner,
    state?.manualImport,
    state?.godPlanner
  ]);

  useEffect(() => {
    if (!waitingForAuth && authCounter !== 0) {
      setAuthCounter(0);
    }
  }, [waitingForAuth, authCounter]);

  useInterval(
    async () => {
      try {
        if (state?.signedIn) return;
        
        let id_token, uid, accessToken;
        
        if (state?.loginType === 'steam') {
          const { signInWithCustom } = await loadFirebase();
          const userData = await signInWithCustom(state?.loginData?.token, dispatch);
          accessToken = userData?.accessToken;
          id_token = userData?.accessToken;
          uid = userData?.uid;
        } else if (state?.loginType === 'email') {
          id_token = state?.loginData?.accessToken;
          uid = state?.loginData?.uid;
          accessToken = id_token;
        } else {
          if (state?.loginType === 'apple') {
            const appleCredential = await geAppleStatus(state?.loginData);
            if (appleCredential?.id_token) {
              id_token = appleCredential;
            }
          } else if (state?.loginType === 'google') {
            // Anything else (a poll armed a tick before loginType landed) falls through to the
            // counter checks below instead of hitting google with an undefined device code.
            const user = (await getUserToken(state?.loginData?.deviceCode)) || {};
            id_token = user?.id_token;

            if (!id_token && user?.error && user.error !== 'authorization_pending' && user.error !== 'slow_down') {
              const message = user.error === 'access_denied'
                ? 'Google sign-in was cancelled.'
                : user.error === 'expired_token'
                  ? 'The login code expired, please re-open this dialog.'
                  : 'Could not reach Google, please check your connection and try again.';
              setWaitingForAuth(false);
              dispatch({ type: ACTION_TYPES.LOGIN_ERROR, data: message });
              return;
            }
          }
          if (id_token) {
            const { signInWithToken } = await loadFirebase();
            const userData = await signInWithToken(id_token, state?.loginType);
            uid = userData?.uid;
          }
        }

        if (id_token) {
          // Before subscribe, not after: the sign-in has already resolved, and subscribe can throw
          // on an account with no characters, which would leave a signed-in visitor marked 'no'.
          writeAuthHint('yes');
          const { subscribe } = await loadFirebase();
          const unsub = await subscribe(uid, accessToken || id_token?.id_token, handleCloudUpdate);
          unsubscribeRef.current = unsub;

          if (typeof window?.gtag !== 'undefined') {
            window.gtag('event', 'login', {
              action: 'login',
              category: 'engagement',
              value: state?.emailPasswordLogin ? 'email-password' : state?.appleLogin ? 'apple' : 'google'
            });
          }
          
          setWaitingForAuth(false);
          setAuthCounter(0);
        } else if (state?.loginData?.expiresAt && Date.now() > state.loginData.expiresAt) {
          setWaitingForAuth(false);
          dispatch({ type: ACTION_TYPES.LOGIN_ERROR, data: 'The login code expired, please re-open this dialog' });
        } else if (!state?.loginData?.expiresAt && authCounter > 12) {
          setWaitingForAuth(false);
          dispatch({ type: ACTION_TYPES.LOGIN_ERROR, data: 'Reached maximum retry limit, please re-open this dialog' });
        }

        setAuthCounter((counter) => counter + 1);
      } catch (error) {
        console.error('Error during authentication:', error);
        setWaitingForAuth(false);
        setAuthCounter(0);
        dispatch({ type: ACTION_TYPES.LOGIN_ERROR, data: error?.message });
      }
    },
    waitingForAuth ? (authCounter === 0 ? 1000 : 5000) : null
  );

  // Re-runs the parsers over the cached raw save so a companion simulation change takes effect
  // without a round trip to the cloud. Without a cached save there's nothing to re-parse, so fall
  // back to a reload, which re-fetches and picks up the new setting on the way in.
  const reparseOwnAccount = async () => {
    let rawJson;
    try {
      rawJson = JSON.parse(sessionStorage.getItem('rawJson'));
    } catch (err) {
      console.warn('Could not read cached raw save:', err);
    }

    if (!rawJson?.data) {
      window.location.reload();
      return;
    }

    dispatch({ type: ACTION_TYPES.SET_LOADING, data: true });
    const { data, charNames, companion, guildData, serverVars, accountCreateTime, tournament, lastUpdated } = rawJson;
    const { parseData } = await import('@parsers/index');
    const parsedData = parseData(data, charNames, companion, guildData, serverVars, accountCreateTime, tournament,
      getOwnAccountParseOptions());

    dispatch({
      type: ACTION_TYPES.DATA,
      data: {
        ...parsedData,
        lastUpdated: lastUpdated ?? state?.lastUpdated,
        isLoading: false
      }
    });
  };

  const providerValue = {
    state,
    dispatch,
    logout,
    waitingForAuth,
    setWaitingForAuth,
    reparseOwnAccount
  };

  return (
    <AppContext.Provider value={providerValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;

import { createContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { checkUserStatus, signInWithCustom, signInWithToken, subscribe, userSignOut } from '../../../firebase';
import demoJson from '../../../data/raw.json';

import { useRouter } from 'next/router';
import useInterval from '../../hooks/useInterval';
import { getUserToken } from '../../../logins/google';
import { offlineTools } from '../NavBar/AppDrawer/ToolsDrawer';
import { geAppleStatus } from '../../../logins/apple';
import { getProfile } from '../../../services/profiles';

export const AppContext = createContext({});

function appReducer(state, action) {
  const actionHandlers = {
    login: () => ({ ...state, ...action.data }),
    data: () => ({ ...state, ...action.data }),
    logout: () => ({
      characters: null,
      account: null,
      signedIn: false,
      emailPassword: null,
      appleLogin: null
    }),
    displayedCharacters: () => ({ ...state, displayedCharacters: action.data }),
    filters: () => ({ ...state, filters: action.data }),
    pinnedPages: () => ({ ...state, pinnedPages: action.data }),
    planner: () => ({ ...state, planner: action.data }),
    trackers: () => ({ ...state, trackers: action.data }),
    godPlanner: () => ({ ...state, godPlanner: action.data }),
    loginError: () => ({ ...state, loginError: action.data }),
    showRankOneOnly: () => ({ ...state, showRankOneOnly: action.data }),
    showUnmaxedBoxesOnly: () => ({ ...state, showUnmaxedBoxesOnly: action.data }),
    setLoading: () => ({ ...state, isLoading: action.data })
  };

  const handler = actionHandlers[action.type];
  if (!handler) {
    throw new Error(`Unhandled action type: ${action.type}`);
  }

  return handler();
}

const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, {}, init);
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  const router = useRouter();
  const [authCounter, setAuthCounter] = useState(0);
  const [waitingForAuth, setWaitingForAuth] = useState(false);
  const unsubscribeRef = useRef(null);

  function init() {
    if (typeof window === 'undefined') return {};

    // Define default values for state properties
    const defaultState = {
      showRankOneOnly: false,
      showUnmaxedBoxesOnly: false,
      isLoading: true
    };

    // Define localStorage keys to load
    const storageKeys = [
      'filters',
      'pinnedPages',
      'displayedCharacters',
      'trackers',
      'godPlanner',
      'manualImport',
      'lastUpdated',
      'planner'
    ];

    // Load and parse values from localStorage
    const loadedState = storageKeys.reduce((state, key) => {
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

    // Set default value for pinnedPages if not loaded
    if (!loadedState.pinnedPages) {
      loadedState.pinnedPages = [];
    }

    return {
      ...defaultState,
      ...loadedState
    };
  }

  useEffect(() => {
    if (!router.isReady) return;

    // Handle loading profile data from API
    const handleProfile = async () => {
      try {
        const content = await getProfile({ mainChar: router?.query?.profile });
        if (!content) {
          throw new Error('Failed to load data from profile api');
        }

        const { parseData } = await import('@parsers/index');
        let parsedData;

        // Parse data based on content format
        if (!Object.keys(content).includes('serverVars')) {
          parsedData = parseData(content);
        } else {
          const { data, charNames, companion, guildData, serverVars, lastUpdated, accountCreateTime } = content;
          parsedData = parseData(data, charNames, companion, guildData, serverVars, accountCreateTime);
          const timestamp = lastUpdated || new Date().getTime();

          parsedData = { ...parsedData, lastUpdated: timestamp };

          // Store raw data in localStorage
          localStorage.setItem('rawJson', JSON.stringify({
            data,
            charNames,
            guildData,
            serverVars,
            lastUpdated: timestamp
          }));
        }

        // Update localStorage and state
        localStorage.setItem('manualImport', 'false');
        const lastUpdated = parsedData?.lastUpdated || new Date().getTime();
        const user = await checkUserStatus();

        dispatch({
          type: 'data',
          data: {
            ...parsedData,
            profile: true,
            manualImport: false,
            signedIn: !!user,
            lastUpdated,
            isLoading: false
          }
        });
      } catch (err) {
        console.error('Failed to load data from profile api', err);
        router.push({ pathname: '/', query: router.query });
        dispatch({
          type: 'data',
          data: {
            isLoading: false
          }
        })
      }
    };

    // Main initialization logic
    const initializeApp = async () => {
      if (router?.query?.profile) {
        await handleProfile();
      } else if (router?.query?.demo) {
        await handleDemoData();
      } else if (!state?.signedIn) {
        await handleUnauthenticatedUser();
      } else {
        dispatch({ type: 'setLoading', data: false });
      }
    };

    // Handle demo data
    const handleDemoData = async () => {
      const { data, charNames, companion, guildData, serverVars, lastUpdated } = demoJson;
      const { parseData } = await import('@parsers/index');
      const timestamp = lastUpdated || new Date().getTime();

      const parsedData = parseData(data, charNames, companion, guildData, serverVars);
      dispatch({
        type: 'data',
        data: {
          ...parsedData,
          lastUpdated: timestamp,
          demo: true,
          isLoading: false
        }
      });
    };

    // Handle unauthenticated user
    const handleUnauthenticatedUser = async () => {
      try {
        const user = await checkUserStatus();
        if (!state?.account && user) {
          const unsub = await subscribe(user?.uid, user?.accessToken, handleCloudUpdate);
          unsubscribeRef.current = unsub;
        } else {
          const isAllowedPath = router.pathname === '/' ||
            checkOfflineTool() ||
            router.pathname === '/data' ||
            router.pathname === '/statistics' ||
            router.pathname === '/leaderboards';

          if (!isAllowedPath) {
            router.push({ pathname: '/', query: router?.query });
          }
          dispatch({ type: 'setLoading', data: false });
        }
      } catch (error) {
        console.error(error);
        dispatch({ type: 'setLoading', data: false });
        logout()
      }
    };

    initializeApp();

    // Cleanup subscription
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (state?.filters) {
      localStorage.setItem('filters', JSON.stringify(state.filters));
    }
    if (state?.pinnedPages) {
      localStorage.setItem('pinnedPages', JSON.stringify(state.pinnedPages));
    }
    if (state?.displayedCharacters) {
      localStorage.setItem('displayedCharacters', JSON.stringify(state.displayedCharacters));
    }
    if (state?.planner) {
      localStorage.setItem('planner', JSON.stringify(state.planner));
    }
    if (state?.trackers) {
      localStorage.setItem('trackers', JSON.stringify(state.trackers));
    }
    if (state?.godPlanner) {
      localStorage.setItem('godPlanner', JSON.stringify(state.godPlanner));
    }
    if (state?.manualImport) {
      localStorage.setItem('manualImport', JSON.stringify(state.manualImport));
      const lastUpdated = JSON.parse(localStorage.getItem('lastUpdated'));
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
  }, [waitingForAuth])

  useInterval(
    async () => {
      try {
        if (state?.signedIn) return;
        let id_token, uid, accessToken;
        if (state?.loginType === 'steam') {
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
            const appleCredential = await geAppleStatus(state?.loginData)
            if (appleCredential?.id_token) {
              id_token = appleCredential;
            }
          } else {
            const user = (await getUserToken(state?.loginData?.deviceCode)) || {};
            if (user) {
              id_token = user?.id_token;
            }
          }
          if (id_token) {
            const userData = await signInWithToken(id_token, state?.loginType);
            uid = userData?.uid;
          }
        }
        if (id_token) {
          const unsub = await subscribe(uid, accessToken || id_token?.id_token, handleCloudUpdate);
          unsubscribeRef.current = unsub;
          if (typeof window?.gtag !== 'undefined') {
            window?.gtag('event', 'login', {
              action: 'login',
              category: 'engagement',
              value: state?.emailPasswordLogin ? 'email-password' : state?.appleLogin ? 'apple' : 'google'
            });
          }
          setWaitingForAuth(false);
          setAuthCounter(0);
        } else if (authCounter > 12) {
          setWaitingForAuth(false);
          dispatch({ type: 'loginError', data: 'Reached maximum retry limit, please re-open this dialog' });
        }
        setAuthCounter((counter) => counter + 1);
      } catch (error) {
        console.error('Error: ', error?.stack)
        dispatch({ type: 'loginError', data: error?.stack });
      }
    },
    waitingForAuth ? authCounter === 0 ? 1000 : 4000 : null
  );

  const logout = (manualImport, data) => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    userSignOut();
    if (typeof window?.gtag !== 'undefined') {
      window?.gtag('event', 'logout', {
        action: 'logout',
        category: 'engagement',
        value: 1
      });
    }
    localStorage.removeItem('charactersData');
    localStorage.removeItem('rawJson');
    dispatch({ type: 'logout' });
    setWaitingForAuth(false);
    if (!manualImport) {
      router.push({ pathname: '/', query: router.query });
    } else {
      dispatch({ type: 'data', data });
    }
  };

  const handleCloudUpdate = async (data, charNames, companion, guildData, serverVars, accountCreateTime, uid, accessToken) => {
    if (router?.query?.profile) {
      const { profile, ...rest } = router.query
      router.replace({ query: rest })
    }
    // console.info('rawData', {
    //   data,
    //   charNames,
    //   companion,
    //   guildData,
    //   serverVars
    // })
    const accountCreateTimeInSeconds = accountCreateTime?.seconds;
    const lastUpdated = new Date().getTime();
    localStorage.setItem('rawJson', JSON.stringify({
      data,
      charNames,
      companion,
      guildData,
      serverVars,
      accountCreateTime: accountCreateTimeInSeconds * 1000,
      lastUpdated
    }));
    const { parseData } = await import('@parsers/index');
    let parsedData = parseData(data, charNames, companion, guildData, serverVars, accountCreateTimeInSeconds * 1000);
    localStorage.setItem('manualImport', JSON.stringify(false));
    dispatch({
      type: 'data',
      data: {
        ...parsedData,
        signedIn: true,
        manualImport: false,
        profile: false,
        lastUpdated,
        serverVars,
        uid,
        accessToken,
        accountCreateTime: accountCreateTimeInSeconds * 1000,
        isLoading: false
      }
    });
    parsedData = null;
  };

  const checkOfflineTool = () => {
    if (!router.pathname.includes('tools')) return false;
    const endPoint = router.pathname.split('/')?.[2] || '';
    const formattedEndPoint = endPoint?.replace('-', ' ')?.toCamelCase();
    return !state?.signedIn && router.pathname.includes('tools') && offlineTools[formattedEndPoint];
  };

  return (
    <AppContext.Provider
      value={{
        ...value,
        logout,
        waitingForAuth,
        setWaitingForAuth
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;

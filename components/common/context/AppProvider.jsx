import { createContext, useEffect, useReducer, useRef, useState } from 'react';
import { checkUserStatus, signInWithCustom, signInWithToken, subscribe, userSignOut } from '../../../firebase';
import demoJson from '../../../data/raw.json';

import { useRouter } from 'next/router';
import useInterval from '../../hooks/useInterval';
import { getUserToken } from '../../../logins/google';
import { offlineTools } from '../NavBar/AppDrawer/ToolsDrawer';
import { geAppleStatus } from '../../../logins/apple';
import { getProfile } from '../../../services/profiles';

export const AppContext = createContext({});

const ACTION_TYPES = {
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
  SET_LOADING: 'setLoading'
};

function appReducer(state, action) {
  const actionHandlers = {
    [ACTION_TYPES.LOGIN]: () => ({ ...state, ...action.data }),
    [ACTION_TYPES.DATA]: () => ({ ...state, ...action.data }),
    [ACTION_TYPES.LOGOUT]: () => ({
      characters: null,
      account: null,
      signedIn: false,
      emailPassword: null,
      appleLogin: null
    }),
    [ACTION_TYPES.DISPLAYED_CHARACTERS]: () => ({ ...state, displayedCharacters: action.data }),
    [ACTION_TYPES.FILTERS]: () => ({ ...state, filters: action.data }),
    [ACTION_TYPES.PINNED_PAGES]: () => ({ ...state, pinnedPages: action.data }),
    [ACTION_TYPES.PLANNER]: () => ({ ...state, planner: action.data }),
    [ACTION_TYPES.TRACKERS]: () => ({ ...state, trackers: action.data }),
    [ACTION_TYPES.GOD_PLANNER]: () => ({ ...state, godPlanner: action.data }),
    [ACTION_TYPES.LOGIN_ERROR]: () => ({ ...state, loginError: action.data }),
    [ACTION_TYPES.SHOW_RANK_ONE_ONLY]: () => ({ ...state, showRankOneOnly: action.data }),
    [ACTION_TYPES.SHOW_UNMAXED_BOXES_ONLY]: () => ({ ...state, showUnmaxedBoxesOnly: action.data }),
    [ACTION_TYPES.SET_LOADING]: () => ({ ...state, isLoading: action.data })
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
  'planner'
];

function init() {
  if (typeof window === 'undefined') return {};

  const defaultState = {
    showRankOneOnly: false,
    showUnmaxedBoxesOnly: false,
    isLoading: true
  };

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

  return {
    ...defaultState,
    ...loadedState
  };
}

const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, {}, init);
  const router = useRouter();
  const [authCounter, setAuthCounter] = useState(0);
  const [waitingForAuth, setWaitingForAuth] = useState(false);
  const unsubscribeRef = useRef(null);
  const isInitializedRef = useRef(false);

  const checkOfflineTool = () => {
    if (!router.pathname.includes('tools')) return false;
    const endPoint = router.pathname.split('/')?.[2] || '';
    const formattedEndPoint = endPoint?.replace('-', ' ')?.toCamelCase();
    return !state?.signedIn && router.pathname.includes('tools') && offlineTools[formattedEndPoint];
  };

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
    
    localStorage.setItem('rawJson', JSON.stringify({
      data,
      charNames,
      companion,
      guildData,
      tournament,
      serverVars,
      accountCreateTime: accountCreateTimeInSeconds * 1000,
      lastUpdated
    }));

    const { parseData } = await import('@parsers/index');
    let parsedData = parseData(
      data,
      charNames,
      companion,
      guildData,
      serverVars,
      accountCreateTimeInSeconds * 1000,
      tournament
    );
    
    localStorage.setItem('manualImport', JSON.stringify(false));
    
    dispatch({
      type: ACTION_TYPES.DATA,
      data: {
        ...parsedData,
        signedIn: true,
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

  const logout = (manualImport, data) => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    userSignOut();
    
    if (typeof window?.gtag !== 'undefined') {
      window.gtag('event', 'logout', {
        action: 'logout',
        category: 'engagement',
        value: 1
      });
    }
    
    localStorage.removeItem('charactersData');
    localStorage.removeItem('rawJson');
    dispatch({ type: ACTION_TYPES.LOGOUT });
    setWaitingForAuth(false);
    
    if (!manualImport) {
      router.push({ pathname: '/', query: router.query });
    } else {
      dispatch({ type: ACTION_TYPES.DATA, data });
    }
  };

  useEffect(() => {
    if (!router.isReady) return;

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
          const { data, charNames, companion, guildData, serverVars, lastUpdated, accountCreateTime } = content;
          parsedData = parseData(data, charNames, companion, guildData, serverVars, accountCreateTime);
          const timestamp = lastUpdated || new Date().getTime();

          parsedData = { ...parsedData, lastUpdated: timestamp };

          localStorage.setItem('rawJson', JSON.stringify({
            data,
            charNames,
            guildData,
            serverVars,
            lastUpdated: timestamp
          }));
        }

        localStorage.setItem('manualImport', 'false');
        const lastUpdated = parsedData?.lastUpdated || new Date().getTime();
        const user = await checkUserStatus();

        dispatch({
          type: ACTION_TYPES.DATA,
          data: {
            ...parsedData,
            profile: true,
            manualImport: false,
            signedIn: !!user,
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
        router.push({ pathname: '/', query: router.query });
        dispatch({
          type: ACTION_TYPES.DATA,
          data: {
            isLoading: false
          }
        });
      }
    };

    const handleDemoData = async () => {
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
          dispatch({ type: ACTION_TYPES.SET_LOADING, data: false });
        }
      } catch (error) {
        console.error(error);
        dispatch({ type: ACTION_TYPES.SET_LOADING, data: false });
        logout();
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
  }, [router.isReady]);

  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

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
  }, [waitingForAuth, authCounter]);

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
            const appleCredential = await geAppleStatus(state?.loginData);
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
            window.gtag('event', 'login', {
              action: 'login',
              category: 'engagement',
              value: state?.emailPasswordLogin ? 'email-password' : state?.appleLogin ? 'apple' : 'google'
            });
          }
          
          setWaitingForAuth(false);
          setAuthCounter(0);
        } else if (authCounter > 12) {
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
    waitingForAuth ? (authCounter === 0 ? 1000 : 4000) : null
  );

  const providerValue = {
    state,
    dispatch,
    logout,
    waitingForAuth,
    setWaitingForAuth
  };

  return (
    <AppContext.Provider value={providerValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;

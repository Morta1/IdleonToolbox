import { createContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  checkUserStatus,
  signInWithCustom,
  signInWithCustomToken,
  signInWithToken,
  subscribe,
  userSignOut
} from '../../../firebase';
// import { parseData } from '../../../parsers';
import demoJson from '../../../data/raw.json';

import { useRouter } from 'next/router';
import useInterval from '../../hooks/useInterval';
import { getUserToken } from '../../../logins/google';
import { CircularProgress, Stack } from '@mui/material';
import { offlineTools } from '../NavBar/AppDrawer/ToolsDrawer';
import { geAppleStatus } from '../../../logins/apple';
import { getProfile } from '../../../services/profiles';

export const AppContext = createContext({});

function appReducer(state, action) {
  switch (action.type) {
    case 'login': {
      return { ...state, ...action.data };
    }
    case 'data': {
      return { ...state, ...action.data };
    }
    case 'logout': {
      return { characters: null, account: null, signedIn: false, emailPassword: null, appleLogin: null };
    }
    case 'displayedCharacters': {
      return { ...state, displayedCharacters: action.data };
    }
    case 'filters': {
      return { ...state, filters: action.data };
    }
    case 'pinnedPages': {
      return { ...state, pinnedPages: action.data };
    }
    case 'planner': {
      return { ...state, planner: action.data };
    }
    case 'trackers': {
      return { ...state, trackers: action.data };
    }
    case 'godPlanner': {
      return { ...state, godPlanner: action.data };
    }
    case 'loginError': {
      return { ...state, loginError: action.data };
    }
    case 'showRankOneOnly': {
      return { ...state, showRankOneOnly: action.data }
    }
    case 'showUnmaxedBoxesOnly': {
      return { ...state, showUnmaxedBoxesOnly: action.data }
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, {}, init);
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  const router = useRouter();
  const [authCounter, setAuthCounter] = useState(0);
  const [waitingForAuth, setWaitingForAuth] = useState(false);
  const unsubscribeRef = useRef(null);

  function init() {
    if (typeof window !== 'undefined') {
      const filters = localStorage.getItem('filters');
      const pinnedPages = localStorage.getItem('pinnedPages') || [];
      const displayedCharacters = localStorage.getItem('displayedCharacters');
      const trackers = localStorage.getItem('trackers');
      const godPlanner = localStorage.getItem('godPlanner');
      const manualImport = localStorage.getItem('manualImport') || false;
      const lastUpdated = localStorage.getItem('lastUpdated') || false;
      const planner = localStorage.getItem('planner');
      const objects = [{ pinnedPages }, { filters }, { displayedCharacters }, { planner }, { manualImport },
        { lastUpdated },
        { trackers }, { godPlanner }, { showRankOneOnly: false }, { showUnmaxedBoxesOnly: false }];
      return objects.reduce((res, obj) => {
        try {
          const [objName, objValue] = Object.entries(obj)?.[0];
          const parsed = JSON.parse(objValue);
          return { ...res, [objName]: parsed };
        } catch (err) {
          return res;
        }
      }, {});
    }
  }

  useEffect(() => {
    if (!router.isReady) return;
    const handleProfile = async () => {
      try {
        const content = await getProfile({ mainChar: router?.query?.profile });
        if (!content) {
          throw new Error('Failed to load data from profile api');
        }
        let parsedData;
        const { parseData } = await import('@parsers/index');
        if (!Object.keys(content).includes('serverVars')) {
          parsedData = parseData(content);
        } else {
          const { data, charNames, companion, guildData, serverVars, lastUpdated, accountCreateTime } = content;
          parsedData = parseData(data, charNames, companion, guildData, serverVars, accountCreateTime);
          parsedData = { ...parsedData, lastUpdated: lastUpdated ? lastUpdated : new Date().getTime() }
          localStorage.setItem('rawJson', JSON.stringify({
            data,
            charNames,
            guildData,
            serverVars,
            lastUpdated: lastUpdated ? lastUpdated : new Date().getTime()
          }));
        }
        localStorage.setItem('manualImport', JSON.stringify(false));
        const lastUpdated = parsedData?.lastUpdated || new Date().getTime();
        const user = await checkUserStatus();
        let importData = {
          ...parsedData,
          profile: true,
          manualImport: false,
          signedIn: !!user,
          lastUpdated
        };
        dispatch({ type: 'data', data: { ...importData, lastUpdated } })
        parsedData = null;
      } catch (e) {
        console.error('Failed to load data from profile api', e);
        router.push({ pathname: '/', query: router.query });
      }
    }
    (async () => {
      if (router?.query?.profile) {
        await handleProfile()
      } else if (router?.query?.demo) {
        const { data, charNames, companion, guildData, serverVars, lastUpdated } = demoJson;
        const { parseData } = await import('@parsers/index');
        let parsedData = parseData(data, charNames, companion, guildData, serverVars);
        parsedData = { ...parsedData, lastUpdated: lastUpdated ? lastUpdated : new Date().getTime() };
        dispatch({ type: 'data', data: { ...parsedData, lastUpdated, demo: true } });
        parsedData = null;
      } else if (!state?.signedIn) {
        const user = await checkUserStatus();
        if (!state?.account && user) {
          const unsub = await subscribe(user?.uid, user?.accessToken, handleCloudUpdate);
          unsubscribeRef.current = unsub;
        } else {
          if (router.pathname === '/' || checkOfflineTool() || router.pathname === '/data' || router.pathname === '/leaderboards') return;
          router.push({ pathname: '/', query: router?.query });
        }
      }
    })();

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
        }
        else if (state?.loginType === 'email') {
          id_token = state?.loginData?.accessToken;
          uid = state?.loginData?.uid;
          accessToken = id_token;
        }
        else {
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
        } else if (authCounter > 8) {
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
        accountCreateTime: accountCreateTimeInSeconds * 1000
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

  const shouldDisplayPage = () => {
    return value?.state?.account || value?.state?.manualImport || router.pathname === '/' || checkOfflineTool() || router.pathname === '/data' || router.pathname === '/leaderboards';
  }

  return (
    <AppContext.Provider
      value={{
        ...value,
        logout,
        waitingForAuth,
        setWaitingForAuth
      }}
    >
      {shouldDisplayPage() ? (
        children
      ) : (
        <Stack m={15} direction={'row'} justifyContent={'center'}>
          <CircularProgress/>
        </Stack>
      )}
    </AppContext.Provider>
  );
};

export default AppProvider;

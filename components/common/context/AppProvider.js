import { createContext, useEffect, useMemo, useReducer, useState } from "react";
import { checkUserStatus, signInWithToken, subscribe, userSignOut } from "../../../firebase";
import { parseData } from "../../../parsers";
import demoJson from '../../../data/raw.json';

import { useRouter } from "next/router";
import useInterval from "../../hooks/useInterval";
import { getUserAndDeviceCode, getUserToken } from "../../../logins/google";
import { CircularProgress, Stack } from "@mui/material";
import { offlineTools } from "../ToolsDrawer";
import { geAppleStatus } from "../../../logins/apple";

export const AppContext = createContext({});

function appReducer(state, action) {
  switch (action.type) {
    case "view": {
      return { ...state, view: action.view };
    }
    case "data": {
      return { ...state, ...action.data };
    }
    case "logout": {
      return { characters: null, account: null, signedIn: false, emailPassword: null, appleLogin: null };
    }
    case "queryParams": {
      return { ...state, ...action.data };
    }
    case "displayedCharacters": {
      return { ...state, displayedCharacters: action.data };
    }
    case "filters": {
      return { ...state, filters: action.data };
    }
    case "planner": {
      return { ...state, planner: action.data };
    }
    case "trackers": {
      return { ...state, trackers: action.data };
    }
    case "trackersOptions": {
      return { ...state, trackersOptions: action.data };
    }
    case "godPlanner": {
      return { ...state, godPlanner: action.data };
    }
    case "emailPasswordLogin": {
      return { ...state, emailPasswordLogin: action.data };
    }
    case "appleLogin": {
      return { ...state, appleLogin: action.data };
    }
    case 'loginError': {
      return { ...state, loginError: action.data };
    }
    case 'resetLoginError': {
      return { ...state, loginError: '' };
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
  const [code, setUserCode] = useState();
  const [listener, setListener] = useState({ func: null });

  function init() {
    if (typeof window !== "undefined") {
      const filters = localStorage.getItem("filters");
      const displayedCharacters = localStorage.getItem("displayedCharacters");
      const trackers = localStorage.getItem("trackers");
      const trackersOptions = localStorage.getItem("trackersOptions");
      const godPlanner = localStorage.getItem("godPlanner");
      const manualImport = localStorage.getItem("manualImport") || false;
      const lastUpdated = localStorage.getItem("lastUpdated") || false;
      const planner = localStorage.getItem("planner");
      const objects = [{ filters }, { displayedCharacters }, { planner }, { manualImport }, { lastUpdated },
        { trackers }, { trackersOptions }, { godPlanner }];
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
    const pastebinImport = async () => {
      try {
        const url = encodeURIComponent(`https://pastebin.com/raw/${router?.query?.pb}`);
        const data = await fetch(`https://api.allorigins.win/raw?url=${url}`);
        const content = await data.json();
        let parsedData;
        if (!Object.keys(content).includes('serverVars')) {
          parsedData = parseData(content);
        } else {
          const { data, charNames, guildData, serverVars, lastUpdated } = content;
          parsedData = parseData(data, charNames, guildData, serverVars);
          parsedData = { ...parsedData, lastUpdated: lastUpdated ? lastUpdated : new Date().getTime() }
          localStorage.setItem("rawJson", JSON.stringify({
            data,
            charNames,
            guildData,
            serverVars,
            lastUpdated: lastUpdated ? lastUpdated : new Date().getTime()
          }));
        }
        localStorage.setItem("manualImport", JSON.stringify(false));
        const lastUpdated = parsedData?.lastUpdated || new Date().getTime();
        let importData = {
          ...parsedData,
          pastebin: true,
          manualImport: false,
          signedIn: false,
          lastUpdated
        };
        dispatch({ type: 'data', data: { ...importData, lastUpdated, manualImport: false, pastebin: true } })
      } catch (e) {
        console.error('Failed to load data from pastebin', e);
        router.push({ pathname: '/', query: router.query });
      }
    }

    let unsubscribe;
    (async () => {
      if (router?.query?.pb) {
        pastebinImport()
      } else if (router?.query?.demo) {
        const { data, charNames, guildData, serverVars, lastUpdated } = demoJson;
        let parsedData = parseData(data, charNames, guildData, serverVars);
        parsedData = { ...parsedData, lastUpdated: lastUpdated ? lastUpdated : new Date().getTime() };
        dispatch({ type: 'data', data: { ...parsedData, lastUpdated, demo: true } });
      } else if (!state?.signedIn) {
        const user = await checkUserStatus();
        if (!state?.account && user) {
          unsubscribe = await subscribe(user?.uid, handleCloudUpdate);
          setListener({ func: unsubscribe });
        } else {
          if (router.pathname === '/' || checkOfflineTool() || router.pathname === '/data') return;
          router.push({ pathname: '/', query: router?.query });
        }
      }
    })();

    return () => {
      typeof unsubscribe === "function" && unsubscribe();
      typeof listener.func === "function" && listener.func();
    };
  }, []);

  useEffect(() => {
    if (state?.filters) {
      localStorage.setItem("filters", JSON.stringify(state.filters));
    }
    if (state?.displayedCharacters) {
      localStorage.setItem("displayedCharacters", JSON.stringify(state.displayedCharacters));
    }
    if (state?.planner) {
      localStorage.setItem("planner", JSON.stringify(state.planner));
    }
    if (state?.trackers) {
      localStorage.setItem("trackers", JSON.stringify(state.trackers));
    }
    if (state?.trackersOptions) {
      localStorage.setItem("trackersOptions", JSON.stringify(state.trackersOptions));
    }
    if (state?.godPlanner) {
      localStorage.setItem("godPlanner", JSON.stringify(state.godPlanner));
    }
    if (state?.manualImport) {
      localStorage.setItem("manualImport", JSON.stringify(state.manualImport));
      const lastUpdated = JSON.parse(localStorage.getItem("lastUpdated"));
      if (state?.signedIn) {
        logout(true, { ...state?.data, lastUpdated, manualImport: true });
      }
    }
    if (state?.emailPasswordLogin || state?.appleLogin) {
      setWaitingForAuth(true);
    }
  }, [state?.trackers,
    state?.trackersOptions,
    state?.filters,
    state?.displayedCharacters,
    state?.planner,
    state?.manualImport,
    state?.emailPasswordLogin,
    state?.godPlanner,
    state?.appleLogin]);

  useInterval(
    async () => {
      try {
        if (state?.signedIn) return;
        let id_token, uid, type;
        if (state?.emailPasswordLogin) {
          id_token = state?.emailPasswordLogin?.accessToken;
          uid = state?.emailPasswordLogin?.uid;
        } else {
          if (state?.appleLogin) {
            const appleCredential = await geAppleStatus(state?.appleLogin)
            if (appleCredential?.id_token) {
              id_token = appleCredential;
              type = 'apple';
            }
          } else {
            const user = (await getUserToken(code?.deviceCode)) || {};
            if (user) {
              id_token = user?.id_token;
              type = 'google'
            }
          }
          if (id_token) {
            const userData = await signInWithToken(id_token, type);
            uid = userData?.uid;
          }
        }
        if (id_token) {
          const unsubscribe = await subscribe(uid, handleCloudUpdate);
          if (typeof window?.gtag !== "undefined") {
            window?.gtag("event", "login", {
              action: "login",
              category: "engagement",
              value: state?.emailPasswordLogin ? 'email-password' : state?.appleLogin ? 'apple' : 'google'
            });
          }
          setListener({ func: unsubscribe });
          setWaitingForAuth(false);
          setAuthCounter(0);
        } else if (authCounter > 5) {
          setWaitingForAuth(false);
        }
        setAuthCounter((counter) => counter + 1);
      } catch (error) {
        console.error('Error: ', error?.stack)
        dispatch({ type: 'loginError', data: error?.stack });
      }
    },
    waitingForAuth ? 6000 : null
  );

  const login = async () => {
    const codeReqResponse = await getUserAndDeviceCode();
    setUserCode({ userCode: codeReqResponse?.user_code, deviceCode: codeReqResponse?.device_code });
    setWaitingForAuth(true);
    return codeReqResponse?.user_code;
  };

  const logout = (manualImport, data) => {
    typeof listener.func === "function" && listener.func();
    userSignOut();
    if (typeof window?.gtag !== "undefined") {
      window?.gtag("event", "logout", {
        action: "logout",
        category: "engagement",
        value: 1
      });
    }
    localStorage.removeItem("charactersData");
    localStorage.removeItem("rawJson");
    dispatch({ type: "logout" });
    setWaitingForAuth(false);
    if (!manualImport) {
      router.push({ pathname: '/', query: router.query });
    } else {
      dispatch({ type: "data", data });
    }
  };

  const handleCloudUpdate = (data, charNames, guildData, serverVars) => {
    if (router?.query?.pb) return;
    console.info('rawData', {
      data,
      charNames,
      guildData,
      serverVars
    })
    const lastUpdated = new Date().getTime();
    localStorage.setItem("rawJson", JSON.stringify({ data, charNames, guildData, serverVars, lastUpdated }));
    const parsedData = parseData(data, charNames, guildData, serverVars);
    // localStorage.setItem("charactersData", JSON.stringify(parsedData));
    localStorage.setItem("manualImport", JSON.stringify(false));
    dispatch({
      type: "data",
      data: { ...parsedData, signedIn: true, manualImport: false, lastUpdated, serverVars }
    });
  };

  const checkOfflineTool = () => {
    if (!router.pathname.includes("tools")) return false;
    const endPoint = router.pathname.split("/")?.[2] || "";
    const formattedEndPoint = endPoint?.replace("-", " ")?.toCamelCase();
    return !state?.signedIn && router.pathname.includes("tools") && offlineTools[formattedEndPoint];
  };

  return (
    <AppContext.Provider
      value={{
        ...value,
        login,
        logout,
        setWaitingForAuth
      }}
    >
      {value?.state?.account || value?.state?.manualImport || router.pathname === "/" || checkOfflineTool() || router.pathname === '/data' ? (
        children
      ) : (
        <Stack m={15} direction={"row"} justifyContent={"center"}>
          <CircularProgress/>
        </Stack>
      )}
    </AppContext.Provider>
  );
};

export default AppProvider;

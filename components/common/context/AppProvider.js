import { createContext, useEffect, useMemo, useReducer, useState } from "react";
import { checkUserStatus, signInWithToken, subscribe, userSignOut } from "../../../firebase";
import { parseData } from "../../../parsers";
import { useRouter } from "next/router";
import useInterval from "../../hooks/useInterval";
import { getUserAndDeviceCode, getUserToken } from "../../../google/login";
import { CircularProgress, Stack } from "@mui/material";
import { offlineTools } from "../ToolsDrawer";

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
      return { characters: null, account: null, signedIn: false };
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
      const manualImport = localStorage.getItem("manualImport") || false;
      const lastUpdated = localStorage.getItem("lastUpdated") || false;
      const planner = localStorage.getItem("planner") || '{"materials":[],"items":[]}';
      const objects = [{ filters }, { displayedCharacters }, { planner }, { manualImport }, { lastUpdated }];
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
    if (state?.filters) {
      localStorage.setItem("filters", JSON.stringify(state.filters));
    }
  }, [state?.filters]);

  useEffect(() => {
    if (state?.displayedCharacters) {
      localStorage.setItem("displayedCharacters", JSON.stringify(state.displayedCharacters));
    }
  }, [state?.displayedCharacters]);

  useEffect(() => {
    if (state?.planner) {
      localStorage.setItem("planner", JSON.stringify(state.planner));
    }
  }, [state?.planner]);

  useEffect(() => {
    if (state?.manualImport) {
      localStorage.setItem("manualImport", JSON.stringify(state.manualImport));
    }
  }, [state?.manualImport]);

  useEffect(() => {
    if (state?.manualImport) {
      const charactersData = JSON.parse(localStorage.getItem("charactersData"));
      dispatch({ type: "data", data: { ...charactersData } });
    }
    if (state?.signedIn) return;
    let unsubscribe;
    (async () => {
      const user = await checkUserStatus();
      if (user && !state?.account) {
        unsubscribe = await subscribe(user?.uid, handleCloudUpdate);
        setListener({ func: unsubscribe });
      } else {
        if (!state?.signedIn && router.pathname !== "/") {
          router.push("/");
        }
      }
    })();

    return () => {
      typeof unsubscribe === "function" && unsubscribe();
      typeof listener.func === "function" && listener.func();
    };
  }, []);
  //

  useInterval(
    async () => {
      if (state?.signedIn) return;
      let { id_token } = (await getUserToken(code?.deviceCode)) || {};
      if (id_token) {
        const userData = await signInWithToken(id_token);
        const unsubscribe = await subscribe(userData?.uid, handleCloudUpdate);
        if (typeof window?.gtag !== "undefined") {
          window?.gtag("event", "login", {
            action: "login",
            category: "engagement",
            value: 1
          });
        }
        setListener({ func: unsubscribe });
        setWaitingForAuth(false);
        setAuthCounter(0);
      } else if (authCounter > 5) {
        setWaitingForAuth(false);
      }
      setAuthCounter((counter) => counter + 1);
    },
    waitingForAuth ? 5000 : null
  );

  const login = async () => {
    const codeReqResponse = await getUserAndDeviceCode();
    setUserCode({ userCode: codeReqResponse?.user_code, deviceCode: codeReqResponse?.device_code });
    setWaitingForAuth(true);
    return codeReqResponse?.user_code;
  };

  const logout = () => {
    console.log("listener", listener.func)
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
    router.push("/");
  };

  const handleCloudUpdate = (data, charNames, guildData, serverVars) => {
    console.log("data, charNames, guildData, serverVars", data, charNames, guildData, serverVars);
    localStorage.setItem("rawJson", JSON.stringify({ data, charNames, guildData, serverVars }));
    const parsedData = parseData(data, charNames, guildData, serverVars);
    localStorage.setItem("charactersData", JSON.stringify(parsedData));
    localStorage.setItem("manualImport", JSON.stringify(false));
    dispatch({
      type: "data",
      data: { ...parsedData, signedIn: true, manualImport: false, lastUpdated: new Date().getTime(), serverVars }
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
      {value?.state?.account || value?.state?.manualImport || router.pathname === "/" || checkOfflineTool() ? (
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

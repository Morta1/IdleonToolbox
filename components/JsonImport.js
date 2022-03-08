import { CircularProgress, Dialog, DialogContent, DialogTitle, IconButton } from "@material-ui/core";
import React, { useContext, useEffect, useState } from "react";
import styled from 'styled-components';
import ErrorIcon from "@material-ui/icons/Error";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { AppContext } from './Common/context';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import parseIdleonData from "../parser";
import NumberTooltip from "./Common/Tooltips/NumberTooltip";
import { getGlobalTime } from "../parser/parserUtils";
import useInterval from "./Common/Timer/useInterval";
import { prefix } from "../Utilities";
import { checkUserStatus, signInWithToken, subscribe, userSignOut } from "../firebase";
import { getUserAndDeviceCode, getUserToken } from "../google/login";
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import { format } from "date-fns";

const getDate = () => {
  try {
    return new Date()?.getTime();
  } catch (err) {
    console.log('Failed parsing date')
    return new Date()?.getTime();
  }
}

const jsonError = 'An error occurred while parsing data';

const JsonImport = () => {
  const {
    setUserData,
    userData,
    setUserLastUpdated,
    setUserConnected,
    lastUpdated,
    signedIn, setSignedIn
  } = useContext(AppContext);

  const [loadIframe, setLoadIframe] = useState(false);
  const [fetchDataInterval, setFetchDataInterval] = useState();
  const [timeoutCount, setTimeoutCount] = useState(0);
  const [firstTime, setFirstTime] = useState(true);

  const [manualImport, setManualImport] = useState(false);
  const [manualResult, setManualResult] = useState(null);

  const [dialog, setDialog] = useState({ open: false, waitingForAuth: false });
  const [authCounter, setAuthCounter] = useState(0);

  useEffect(() => {
    (async () => {
      if (manualImport || signedIn) return;
      const user = await checkUserStatus();
      if (user) {
        const unsubscribe = await subscribe(user?.uid, handleCloudUpdate)
        setDialog({ ...dialog, listener: unsubscribe })
      }
    })()
    return () => {
      clearInterval(fetchDataInterval);
    }
  }, []);

  useInterval(() => {
    const charData = localStorage.getItem('globalData');
    if (charData) {
      const globalData = JSON.parse(localStorage.getItem('globalData'));
      const globalTime = (getGlobalTime(globalData?.serializedData) ?? 0) * 1000;
      const timePassed = (new Date().getTime() - (lastUpdated ?? 0)) / 1000;
      if (globalTime > lastUpdated) {
        console.debug(`Global Time ${globalTime} is higher than lastUpdated: ${lastUpdated}`);
      }
      if (timePassed > 60 * 5) {
        console.debug(`Five minutes has passed, updating`);
      }
      if (firstTime) {
        console.debug(`First Connection, updating`);
      }
      if (firstTime || !userData || globalTime > lastUpdated || timePassed > 60 * 5) {
        setUserData(parseIdleonData(globalData?.serializedData, globalData?.usernameList, globalData.serializedGuildData));
        setUserConnected(true);
        setUserLastUpdated(new Date().getTime());
        setFirstTime(false);
      }
    }
    if (timeoutCount > 4 && !userData) {
      setUserConnected(false);
      endInterval(fetchDataInterval, { success: false });
    }
    setTimeoutCount((i) => i + 1);
  }, fetchDataInterval ? 10000 : null);

  useInterval(async () => {
    let { id_token } = await getUserToken(dialog?.deviceCode) || {};
    if (id_token) {
      const userData = await signInWithToken(id_token);
      const unsubscribe = await subscribe(userData?.uid, handleCloudUpdate);
      setDialog({ ...dialog, listener: unsubscribe, open: false, waitingForAuth: false });
      setAuthCounter(0);
    } else if (authCounter > 5) {
      setDialog({ ...dialog, waitingForAuth: false, error: true })
    }
    setAuthCounter((counter) => counter + 1);
  }, dialog?.waitingForAuth ? 5000 : null);

  const handleCloudUpdate = (data, charNames, guildData) => {
    localStorage.setItem('rawJson', JSON.stringify({ data, charNames, guildData }));
    const parsedData = parseIdleonData(data, charNames, guildData);
    setUserData(parsedData);
    setUserLastUpdated(getDate());
    setSignedIn(true);
  }
  const handleSignOut = (manual) => {
    if (!manual) {
      setUserData(null);
      setUserLastUpdated(null);
    }
    setSignedIn(false);
    typeof dialog?.listener === 'function' && dialog?.listener();
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'logout', {
        action: "logout",
        category: "engagement",
        value: 1,
      });
    }
  }

  const endInterval = () => {
    setLoadIframe(false);
    setUserConnected(false);
    setTimeoutCount(0);
    setFirstTime(true);
    setFetchDataInterval(false)
  }

  const handleManualImport = async () => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'paste', {
        method: "JSON",
        category: "engagement",
        value: 1,
      });
    }
    try {
      const { data, userNames, guildData } = JSON.parse(await navigator.clipboard.readText());
      const parsedData = parseIdleonData(data, userNames, guildData);
      setUserData(parsedData);
      setUserLastUpdated(getDate());
      setManualResult(true);
      setManualImport(true);
      endInterval(fetchDataInterval);
      await userSignOut(handleSignOut, true)
    } catch (err) {
      setManualImport(true);
      setManualResult(false);
      console.error('Error parsing data', err);
      endInterval(fetchDataInterval);
      await userSignOut(handleSignOut, true)
    }
  }

  const handleGoogleLogin = async () => {
    const codeReqResponse = await getUserAndDeviceCode();
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'login', {
        method: "TOKEN",
        category: "engagement",
        value: 1,
      });
    }
    setDialog({
      open: true,
      loading: true,
      userCode: codeReqResponse?.user_code,
      deviceCode: codeReqResponse?.device_code,
      waitingForAuth: true
    });
  }

  const handleDialogClose = () => {
    setDialog({ ...dialog, waitingForAuth: false, open: false });
    setAuthCounter(0);
  }

  return (
    <JsonImportStyled>
      <div className={'controls'}>
        {lastUpdated && signedIn ?
          <div style={{ fontSize: 12 }}>Last
            Updated <div>{lastUpdated ? format(lastUpdated, 'dd/MM/yyyy HH:mm:ss') : ''}</div></div> : null}
        {manualImport ? manualResult ?
          <NumberTooltip title={'Updated'}><CheckCircleIcon className={'updated-info'}
                                                            style={{ marginRight: 5, color: 'rgb(76, 175, 80)' }}
          /></NumberTooltip> :
          <NumberTooltip title={jsonError}><ErrorIcon style={{ marginRight: 5, color: '#f48fb1' }}
          /></NumberTooltip> : null}
        <NumberTooltip title={'Paste raw JSON'}>
          <IconButton onClick={handleManualImport}>
            <FileCopyIcon/>
          </IconButton>
        </NumberTooltip>
        {!signedIn ? <NumberTooltip title={'Google Sign-in'}>
          <div className={'google-sign-in'}>
            <img onClick={handleGoogleLogin} className={'google'} width={48} height={48}
                 src={`${prefix}data/google.svg`} alt=""/>
          </div>
        </NumberTooltip> : <NumberTooltip title={'Sign out'}>
          <IconButton onClick={() => userSignOut(handleSignOut)}>
            <ExitToAppIcon/>
          </IconButton>
        </NumberTooltip>}
      </div>
      <Dialog open={dialog?.open} onClose={handleDialogClose}>
        <StyledDialogTitle disableTypography>
          <img width={32} height={32}
               style={{ marginRight: 10 }}
               src={`${prefix}data/google.svg`} alt=""/>
          Connect with Google</StyledDialogTitle>
        <StyledDialogContent>Please go to <a target='_blank' className={'link'}
                                             href="https://www.google.com/device"
                                             rel="noreferrer">https://www.google.com/device</a> and
          enter the following code: <div className={'code'}>{dialog?.userCode}</div>
          {dialog?.error ?
            <div className={'center'}>Failed to auth, please refresh and try
              again.</div> :
            <div className={'center'}>Trying to authenticate: <StyledLoader size={22}/>
            </div>}
        </StyledDialogContent>
      </Dialog>
      {loadIframe ? <iframe height='0px' width='0px' src={'https://www.legendsofidleon.com/ytGl5oc/'}/> : null}
    </JsonImportStyled>
  );
};


const StyledDialogTitle = styled(DialogTitle)`
  & {
    display: flex;
    align-items: center;
    font-weight: bold;
    font-size: 22px;
  }
`
const StyledLoader = styled(CircularProgress)`
  && {
    color: white;
  }
`;

const StyledDialogContent = styled(DialogContent)`
  & {
    padding: 24px;

    a {
      font-weight: bold;
      color: white;

      &:active, &:link, &:visited {
        color: white;
      }
    }

    .code {
      width: max-content;
      border: 1px solid white;
      font-weight: bold;
      padding: 15px;
      margin: 0 auto;
    }

    .center {
      display: flex;
      justify-content: center;
      gap: 15px;
      align-items: center;
      margin: 15px 0;
    }

  }
`;

const JsonImportStyled = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  margin-left: auto;

  .controls {
    display: flex;
    align-items: center;
    gap: 10px;

    .google-sign-in {
      height: 48px;
      width: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .google {
      cursor: pointer;
      height: 24px;
      width: 24px;
    }
  }

  iframe {
    position: absolute;
    top: 5000px;
    left: 5000px;
  }

  .updated-info {
    -webkit-animation: cssAnimation 5s forwards;
    animation: cssAnimation 5s forwards;
  }

  @keyframes cssAnimation {
    0% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
  @-webkit-keyframes cssAnimation {
    0% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
`;

export default JsonImport;

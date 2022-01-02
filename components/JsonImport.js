import { Button, CircularProgress, IconButton } from "@material-ui/core";
import { useContext, useEffect, useRef, useState } from "react";
import styled from 'styled-components';
import ErrorIcon from "@material-ui/icons/Error";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { format } from 'date-fns'
import { AppContext } from './Common/context';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import parseIdleonData from "../parser";
import NumberTooltip from "./Common/Tooltips/NumberTooltip";

const getDate = () => {
  try {
    return format(new Date(), 'dd/MM/yyyy HH:mm:ss');
  } catch (err) {
    console.log('Failed parsing date')
    return new Date();
  }
}

const jsonError = 'An error occurred while parsing data';
const connectError = 'Please make sure you\'ve downloaded the latest idleon-data-extractor extension and that you\'re connected to idleon website';

const JsonImport = () => {
  const { setUserData, setUserLastUpdated, connected, setUserConnected } = useContext(AppContext);

  const [loadIframe, setLoadIframe] = useState(false);
  const [fetchDataInterval, setFetchDataInterval] = useState();
  const [timeoutCount, setTimeoutCount] = useState(0);

  const [fetching, setFetching] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [manualImport, setManualImport] = useState(false);
  const [manualResult, setManualResult] = useState(null);
  const countRef = useRef(0);
  countRef.current = timeoutCount;

  useEffect(() => {
    setResult(connected ? { success: true } : null);
  }, [connected]);
  useEffect(() => {
    // autoUpdate();
    return () => {
      clearInterval(fetchDataInterval);
    }
  }, [])

  const autoUpdate = () => {
    try {
      localStorage.removeItem('globalData');
      setLoading(true);
      setLoadIframe(true);
      setResult(null);
      const fetchData = setInterval(fetchFromWeb, 10000);
      setFetchDataInterval(fetchData);
    } catch (e) {
      console.log('Failed to load JSON from idleon', e);
      setFetching(false);
      setLoading(false);
    }
  };

  const fetchFromWeb = () => {
    const charData = localStorage.getItem('globalData');
    if (charData) {
      const parsed = JSON.parse(localStorage.getItem('globalData'));
      setUserLastUpdated(getDate());
      setUserData(parseIdleonData(parsed?.serializedData, parsed?.usernameList));
      setLoading(false);
      setResult({ success: true });
      setUserConnected(true);
      setFetching(true);
    }
    if (countRef.current > 4 && !charData) {
      console.log('Please make sure idleon-data-extractor is installed and you\'re logged in and try again.')
      setUserConnected(false);
      endInterval(fetchDataInterval, { success: false });
    }
    setTimeoutCount(countRef.current + 1);
  }

  const endInterval = (interval, result) => {
    setLoadIframe(false);
    setFetching(false);
    setLoading(false);
    setResult(result ? result : null);
    setUserConnected(false);
    setTimeoutCount(0);
    clearInterval(interval);
  }

  const handleManualImport = async () => {
    try {
      const data = JSON.parse(await navigator.clipboard.readText());
      const parsedData = parseIdleonData(data);
      setUserData(parsedData);
      setUserLastUpdated(getDate());
      setManualResult(true);
      setManualImport(true);
      endInterval(fetchDataInterval);
    } catch (err) {
      setManualImport(true);
      setManualResult(false);
      console.error('Error parsing data', err);
      endInterval(fetchDataInterval);
    }
  }


  return (
    <JsonImportStyled>
      <div className={'controls'}>
        {manualImport ? manualResult ?
          <NumberTooltip title={'Updated'}><CheckCircleIcon className={'updated-info'}
                                                            style={{ marginRight: 5, color: 'rgb(76, 175, 80)' }}
          /></NumberTooltip> :
          <NumberTooltip title={jsonError}><ErrorIcon style={{ marginRight: 5, color: '#f48fb1' }}
          /></NumberTooltip> : null}
        {result ? result?.success ? <CheckCircleIcon style={{ marginRight: 5, color: 'rgb(76, 175, 80)' }}
                                                     titleAccess={'Connected'}/> :
          <NumberTooltip title={connectError}><ErrorIcon style={{ marginRight: 5, color: '#f48fb1' }}
          /></NumberTooltip> : null}
        {!loading ? !fetching && !connected ? <NumberTooltip
            title={'Please make sure you\'ve connected to idleon website and downloaded idleon-data-extractor extension'}>
            <StyledButton onClick={() => autoUpdate()}>Connect</StyledButton></NumberTooltip> : null :
          <StyledLoader size={24}/>
        }
        <NumberTooltip title={'Paste raw JSON'}>
          <IconButton onClick={handleManualImport}>
            <FileCopyIcon/>
          </IconButton>
        </NumberTooltip>
      </div>
      {loadIframe ? <iframe height='0px' width='0px' src={'https://www.legendsofidleon.com/ytGl5oc/'}/> : null}
    </JsonImportStyled>
  );
};


const StyledButton = styled(Button)`
  && {
    text-transform: none;
  }
`;

const StyledLoader = styled(CircularProgress)`
  && {
    color: white;
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

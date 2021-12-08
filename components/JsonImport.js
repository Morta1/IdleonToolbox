import { Button, CircularProgress, IconButton } from "@material-ui/core";
import { useContext, useEffect, useRef, useState } from "react";
import styled from 'styled-components';
import ErrorIcon from "@material-ui/icons/Error";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { format } from 'date-fns'
import { AppContext } from './Common/context';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { extVersion } from "../Utilities";
import { useRouter } from "next/router";

const getDate = () => {
  try {
    return format(new Date(), 'dd/MM/yyyy HH:mm:ss');
  } catch (err) {
    console.log('Failed parsing date')
    return new Date();
  }
}

const extensionError = 'Please make sure the latest version of idleon-data-extractor is installed and try again.';
const jsonError = 'An error occurred while parsing data';

const JsonImport = () => {
  const { userData, setUserData, setUserLastUpdated } = useContext(AppContext);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadIframe, setLoadIframe] = useState(false);
  const [result, setResult] = useState(null);
  const [fetchDataInterval, setFetchDataInterval] = useState();
  const [timeoutCount, setTimeoutCount] = useState(0)
  const countRef = useRef(0);
  const [hasData, setHasData] = useState(false);
  const [errorText, setErrorText] = useState('');
  countRef.current = timeoutCount;

  useEffect(() => {
    if (userData) {
      setHasData(true);
    }
    return () => {
      clearInterval(fetchDataInterval);
    }
  }, [userData])

  const endInterval = (interval, success) => {
    setHasData(success);
    setLoading(false);
    setLoadIframe(false);
    setResult({ success });
    setTimeoutCount(0);
    setErrorText(extensionError);
    clearInterval(interval);
  }

  const onImport = async () => {
    try {
      if (!loading) {
        setLoading(true);
        setLoadIframe(true)
        const oldParsedData = JSON.parse(localStorage.getItem('characterData'));
        localStorage.removeItem('characterData');
        const fetchData = setInterval(() => {
          if (countRef.current > 50) {
            console.log('Please make sure the latest version of idleon-data-extractor is installed and you\'re logged in and try again.');
            setUserData(oldParsedData);
            endInterval(fetchData, false);
            return;
          }
          setTimeoutCount(countRef.current + 1);
          const charData = localStorage.getItem('characterData');
          if (charData) {
            const parsedData = JSON.parse(localStorage.getItem('characterData'));
            setUserData(parsedData);
            setUserLastUpdated(getDate());
            endInterval(fetchData, true);
          }
        }, 1000);
        setFetchDataInterval(fetchData);
      }
    } catch (e) {
      console.log('Failed to load family JSON', e);
      setLoading(false);
    }
  };

  const handleManualImport = async () => {
    try {
      const data = JSON.parse(await navigator.clipboard.readText());
      console.log(data);
      setUserData(data);
      setUserLastUpdated(getDate());
      setResult({ success: true });
      if (data?.version === extVersion) {
        router.reload();
      }
    } catch (err) {
      console.log('Error parsing data');
      setResult({ success: false });
      setErrorText(jsonError);
    }
  }

  return (
    <JsonImportStyled>
      {result ? result?.success ?
        <CheckCircleIcon className={'updated-info'} style={{ marginRight: 5, color: 'rgb(76, 175, 80)' }}
                         titleAccess={'Updated'}/> :
        <ErrorIcon style={{ marginRight: 5, color: '#f48fb1' }}
                   titleAccess={errorText}/> : null}
      {result?.success ?
        <div className={'updated-info'} style={{ marginRight: 10, color: 'white' }}/> : null}
      <IconButton title={'Paste JSON'} onClick={handleManualImport}>
        <FileCopyIcon/>
      </IconButton>
      <span style={{ marginRight: 12 }}>OR</span>
      <StyledButton variant="contained" color="primary" onClick={onImport}>{loading ?
        <StyledLoader size={24}/> : hasData ? 'Update' : 'Fetch Data'}</StyledButton>
      {loadIframe ? <iframe height='1px' width={'1px'} src={'https://www.legendsofidleon.com/ytGl5oc/'}/> : null}
    </JsonImportStyled>
  );
};

const StyledButton = styled(Button)`
  && {
    width: 150px;
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

  iframe {
    position: absolute;
    top: -5000px;
    left: -5000px;
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

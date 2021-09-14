import { Button, CircularProgress } from "@material-ui/core";
import { useContext, useEffect, useRef, useState } from "react";
import styled from 'styled-components';
import ErrorIcon from "@material-ui/icons/Error";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { format } from 'date-fns'
import { AppContext } from './context';

const getDate = () => {
  try {
    return format(new Date(), 'MM/dd/yyyy HH:mm:ss');
  } catch (err) {
    console.log('Failed parsing date')
    return new Date();
  }
}

const JsonImport = () => {
  const { userData, setUserData } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [loadIframe, setLoadIframe] = useState(false);
  const [result, setResult] = useState(null);
  const [fetchDataInterval, setFetchDataInterval] = useState();
  const [timeoutCount, setTimeoutCount] = useState(0)
  const countRef = useRef(0);
  const [hasData, setHasData] = useState(false);
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
    setResult({ success, date: getDate() });
    setTimeoutCount(0);
    clearInterval(interval);
  }

  const onImport = async () => {
    try {
      if (!loading) {
        setLoading(true);
        setLoadIframe(true)
        localStorage.clear();
        const fetchData = setInterval(() => {
          if (countRef.current > 50) {
            console.log('Please make sure idleon-data-extractor is installed and you\'re logged in and try again.');
            endInterval(fetchData, false);
          }
          setTimeoutCount(countRef.current + 1);
          const charData = localStorage.getItem('characterData');
          if (charData) {
            const parsedData = JSON.parse(localStorage.getItem('characterData'));
            setUserData(parsedData);
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

  return (
    <JsonImportStyled>
      {result ? result?.success ?
        <CheckCircleIcon style={{ marginRight: 5, color: 'rgb(76, 175, 80)' }}
                         titleAccess={`Updated at: ${result?.date}`}/> :
        <ErrorIcon style={{ marginRight: 5, color: '#f48fb1' }}
                   titleAccess={'Please make sure idleon-data-extractor is installed and try again.'}/> : null}
      {result?.success ? <div style={{ marginRight: 10, color: 'white' }}>Updated at: {result?.date}</div> : null}
      <StyledButton variant="contained" color="primary" onClick={onImport}>{loading ?
        <StyledLoader size={24}/> : hasData ? 'Update' : 'Fetch Data'}</StyledButton>

      {loadIframe ? <iframe height='1px' width={'1px'} src={'https://legendsofidleon.com'}/> : null}
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
`;

export default JsonImport;

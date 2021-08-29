import { Button, CircularProgress } from "@material-ui/core";
import { useEffect, useRef, useState } from "react";
import styled from 'styled-components';
import ErrorIcon from "@material-ui/icons/Error";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { format } from 'date-fns'

const getDate = () => {
  try {
    return format(new Date(), 'MM/dd/yyyy HH:mm:ss');
  } catch (err) {
    console.log('Failed parsing date')
    return new Date();
  }
}

const JsonImport = ({ handleImport }) => {
  const [loading, setLoading] = useState(false);
  const [loadIframe, setLoadIframe] = useState(false);
  const [result, setResult] = useState(null);
  const [fetchDataInterval, setFetchDataInterval] = useState();
  const [timeoutCount, setTimeoutCount] = useState(0)
  const countRef = useRef(0)
  countRef.current = timeoutCount;

  useEffect(() => {
    return () => {
      clearInterval(fetchDataInterval);
    }
  }, [])

  const endInterval = (interval, success) => {
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
            console.log('Please make sure idleon-data-extractor is installed and try again.');
            endInterval(fetchData, false);

          }
          setTimeoutCount(countRef.current + 1);
          const charData = localStorage.getItem('characterData');
          if (charData) {
            const parsedData = JSON.parse(localStorage.getItem('characterData'));
            handleImport(parsedData);
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
      <StyledButton variant="contained" color="primary" onClick={onImport}>{loading ?
        <StyledLoader size={24}/> : 'Fetch Data'}</StyledButton>
      {result ? result?.success ?
        <CheckCircleIcon style={{ marginLeft: 5, color: 'rgb(76, 175, 80)' }}
                         titleAccess={`Updated at: ${result?.date}`}/> :
        <ErrorIcon style={{ marginLeft: 5, color: '#f48fb1' }}
                   titleAccess={'Please make sure idleon-data-extractor is installed and try again.'}/> : null}
      {result?.success ? <div style={{ marginLeft: 5 }}>Updated at: {result?.date}</div> : null}
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
  margin-left: 10px;

  iframe {
    position: absolute;
    top: -5000px;
    left: -5000px;
  }
`;

export default JsonImport;

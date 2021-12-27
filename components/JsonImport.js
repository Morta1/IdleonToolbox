import { IconButton } from "@material-ui/core";
import { useContext, useState } from "react";
import styled from 'styled-components';
import ErrorIcon from "@material-ui/icons/Error";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { format } from 'date-fns'
import { AppContext } from './Common/context';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useRouter } from "next/router";
import parseIdleonData from "../parser";

const getDate = () => {
  try {
    return format(new Date(), 'dd/MM/yyyy HH:mm:ss');
  } catch (err) {
    console.log('Failed parsing date')
    return new Date();
  }
}

const jsonError = 'An error occurred while parsing data';

const JsonImport = () => {
  const { setUserData, setUserLastUpdated } = useContext(AppContext);
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [errorText, setErrorText] = useState('');

  const handleManualImport = async () => {
    try {
      const data = JSON.parse(await navigator.clipboard.readText());
      const parsedData = parseIdleonData(data);
      setUserData(parsedData);
      setUserLastUpdated(getDate());
      setResult({ success: true });
      router.reload();
    } catch (err) {
      console.error('Error parsing data', err);
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
    </JsonImportStyled>
  );
};

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

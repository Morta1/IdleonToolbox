import { Button, CircularProgress } from "@material-ui/core";
import { useState } from "react";
import styled from 'styled-components';

const JsonImport = ({ handleImport }) => {
  const [loading, setLoading] = useState(false);

  const onImport = async () => {
    try {
      setLoading(true);
      const dataFromClipboard = await navigator.clipboard.read();
      const blob = await dataFromClipboard[0].getType("text/plain");
      const text = await blob.text();
      const json = JSON.parse(text);
      handleImport(json);
      setLoading(false);
    } catch (e) {
      console.log('Failed to load family JSON', e);
      setLoading(false);
    }
  };

  return (
    <JsonImportStyled>
      <Button variant="contained" color="primary" onClick={onImport}>Import JSON</Button>
      {loading ? <CircularProgress size={'small'} color={'secondary'}/> : null}
    </JsonImportStyled>
  );
};

const JsonImportStyled = styled.div`
  display: inline-flex;
  align-items: center;
  margin-left: 10px;
`;

export default JsonImport;

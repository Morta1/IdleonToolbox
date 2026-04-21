import React, { useContext } from 'react';
import { Button } from '@mui/material';
import Tooltip from '@components/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useRouter } from 'next/router';
import { AppContext } from '@components/common/context/AppProvider';

const UseAsTemplateButton = ({ shortId }) => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const signedIn = !!state?.signedIn;

  const handleClick = () => {
    if (!signedIn) return;
    router.push(`/tools/builds/new?from=${encodeURIComponent(shortId)}`);
  };

  const button = (
    <span>
      <Button
        startIcon={<ContentCopyIcon/>}
        variant="outlined"
        size="small"
        onClick={handleClick}
        disabled={!signedIn}
      >
        Use as template
      </Button>
    </span>
  );

  if (!signedIn) {
    return <Tooltip title="Sign in to use this build as a template">{button}</Tooltip>;
  }
  return button;
};

export default UseAsTemplateButton;

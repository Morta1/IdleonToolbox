import { Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { handleLoadJson } from '@utility/helpers';
import { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import Link from '@mui/material/Link';

const SteamWorkaround = ({ setOpen }) => {
  const { dispatch } = useContext(AppContext);

  return <Stack>
    <Typography color={'warning.main'} sx={{ mb: 2 }} variant={'body1'}>This method is highly inaccurate, as it lacks
      companion data, server variables, and guild information; however, it still allows you to track your
      progress.</Typography>
    <Typography>1. Go to <Link href={'https://github.com/Morta1/idleon-steam-data-extractor/releases'}>idleon steam data
      extractor</Link> and download the latest release</Typography>
    <Typography>2. Open the app</Typography>
    <Typography>3. Make sure the game is running (in steam of course)</Typography>
    <Typography>4. Click "Run"</Typography>
    <Typography>5. Click "Copy JSON"</Typography>
    <Typography>6. Come back to IT and click the button below ("Load Steam JSON")</Typography>

    <Button sx={{ mt: 2 }} variant="contained"
            onClick={async () => {
              await handleLoadJson(dispatch);
              setOpen(false);
            }}>Load Steam Json</Button>
  </Stack>;
};

export default SteamWorkaround;


import {
  Checkbox,
  Collapse,
  Container,
  Fade,
  FormControlLabel,
  FormHelperText,
  Link,
  Popover,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import Button from '@mui/material/Button';
import React, { useContext, useEffect, useState } from 'react';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import InfoIcon from '@mui/icons-material/Info';
import styled from '@emotion/styled';
import { useRouter } from 'next/router';
import MenuItem from '@mui/material/MenuItem';
import useTimeout from '../components/hooks/useTimeout';
import LoadingButton from '@mui/lab/LoadingButton';
import NormalTimer from '../components/common/Timer/Normal';
import { format, intervalToDuration, isValid } from 'date-fns';
import { expandLeaderboardInfo, uploadProfile } from '../services/profiles';
import { AppContext } from '@components/common/context/AppProvider';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { NextSeo } from 'next-seo';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import Popper from '@components/common/Popper';

const HOURS = 4;
const WAIT_TIME = 1000 * 60 * 60 * HOURS;
const Data = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const [key, setKey] = useState('all');
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpload, setLastUpload] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [leaderboardConsent, setLeaderboardConsent] = useState(false);
  const [error, setError] = useState('');
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    if (state?.uid) {
      setLastUpload(localStorage.getItem(`${state?.uid}/lastUpload`));
      setLeaderboardConsent(localStorage.getItem(`${state?.uid}/leaderboardConsent`) === 'true');
    }
  }, [state?.uid]);

  useEffect(() => {
    if (lastUpload) {
      setIsDisabled((WAIT_TIME - (Date.now() - lastUpload)) > 0);
    }
  }, [lastUpload])

  const handleCopyITRaw = async (e) => {
    try {
      setAnchorEl(e.currentTarget)
      await navigator.clipboard.writeText(localStorage.getItem('rawJson'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyRaw = async (e) => {
    try {
      setAnchorEl(e.currentTarget)
      const data = JSON.parse(localStorage.getItem('rawJson'));
      await navigator.clipboard.writeText(JSON.stringify(data?.data));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStorageClear = () => {
    if (key === 'all') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (!key.includes('lastUpload')) {
          localStorage.removeItem(key)
        }
      })
    } else {
      if (key === 'last-upload-time') {
        localStorage.removeItem(`${state?.uid}/lastUpload`);
        setLastUpload(false);
      } else {
        localStorage.removeItem(key)
      }
    }
    router.reload();
  }

  const handleAllowLeaderboard = (e) => {
    localStorage.setItem(`${state?.uid}/leaderboardConsent`, !leaderboardConsent);
    setLeaderboardConsent(!leaderboardConsent)
  }
  const handleUpdate = async () => {
    const userData = JSON.parse(localStorage.getItem('rawJson'));
    delete userData.data.GemsOwned;
    delete userData.data.ServerGems;
    delete userData.data.ServerGemsReceived;
    delete userData.data.BundlesReceived;
    delete userData.data.GemsPacksPurchased;
    const parsedData = expandLeaderboardInfo(state?.account, state?.characters)
    setUploaded(false);
    if (!lastUpload || ((WAIT_TIME - (Date.now() - lastUpload)) < 0)) {
      setLoading(true);
      try {
        await uploadProfile({
          profile: { ...userData, parsedData },
          uid: state?.uid,
          leaderboardConsent
        }, state?.accessToken);
        setUploaded(true);
        const now = Date.now();
        localStorage.setItem(`${state?.uid}/lastUpload`, now);
        setLastUpload(now);
      } catch (err) {
        setError(err);
      }
      setLoading(false)
    }
  }

  useTimeout(() => {
    setAnchorEl(null);
  }, anchorEl ? 1000 : null)

  return <Container>
    <NextSeo
      title="Data | Idleon Toolbox"
      description="Website settings and profile management"
    />
    <div>
      <Typography variant={'h4'}>Data</Typography>
      <Typography variant={'body1'}>Use this when asked for data</Typography>
      <ButtonStyle component={'span'} variant={'outlined'} startIcon={<FileCopyIcon/>}
                   onClick={handleCopyITRaw}>
        IdleonToolbox JSON
      </ButtonStyle>
      <div>
        <Stack mt={3} direction={'row'} alignItems={'center'}>
          <ButtonStyle sx={{ textTransform: 'none', fontSize: 12 }}
                       variant={'outlined'}
                       startIcon={<FileCopyIcon/>}
                       size="small"
                       onClick={handleCopyRaw}>
            Raw Game JSON
          </ButtonStyle>
          <IconButton onClick={() => setShowRawData(!showRawData)}>
            <ArrowRightIcon style={{
              transform: showRawData ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease-in-out'
            }}/>
          </IconButton>
        </Stack>
        <Collapse in={showRawData}>
          <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
            {JSON.stringify(JSON.parse(localStorage.getItem('rawJson')), null, 2)}
          </div>
        </Collapse>
      </div>
      <Popper anchorEl={anchorEl} handleClose={() => setAnchorEl(null)}/>
    </div>
    <Typography variant={'h4'} mt={8}>Local Storage</Typography>
    <Typography component={'div'} variant={'caption'} mb={2} color={'warning.light'}>Use this if
      you're having any issues
      loading the website</Typography>
    <div>
      <Stack direction={'row'} gap={2}>
        <TextField sx={{ width: 250 }} label={'Local storage key'} select value={key}
                   onChange={(e) => setKey(e.target.value)}>
          <MenuItem value={'all'}>All</MenuItem>
          <MenuItem value={'filters'}>Characters page filters</MenuItem>
          <MenuItem value={'trackers'}>Dashboard config</MenuItem>
          <MenuItem value={'planner'}>Item Planner</MenuItem>
          <MenuItem value={'material-tracker'}>Material tracker</MenuItem>
          <MenuItem value={'last-upload-time'}>Last upload time</MenuItem>
        </TextField>
        <ButtonStyle color={'warning'} variant={'outlined'} onClick={handleStorageClear} startIcon={<InfoIcon/>}>
          Clear
        </ButtonStyle>
      </Stack>
    </div>
    {!router.query.profile && state?.characters ? <>
      <Typography variant={'h4'} mt={8}>Profile</Typography>
      <Typography variant={'body1'}>* You can update your profile once every 4 hours</Typography>
      <Typography variant={'body1'} mb={3}>* Gems and bundle information won't be saved</Typography>
      <Typography variant={'body1'} mb={3}>* Your profile
        link: <Link
          href={`https://idleontoolbox.com/?profile=${state?.characters?.[0]?.name}`}>https://idleontoolbox.com/?profile={state?.characters?.[0]?.name}</Link>
      </Typography>
      <div>
        <Stack direction={'row'} alignItems={'center'} gap={2}>
          <LoadingButton disabled={isDisabled}
                         loading={loading} onClick={handleUpdate}
                         variant={'contained'}>Upload my profile</LoadingButton>
          <Fade in={uploaded}>
            <CheckCircleIcon color={'success'}/>
          </Fade>
        </Stack>
        <FormControlLabel
          control={<Checkbox name={'mini'} checked={leaderboardConsent}
                             size={'small'}
                             onChange={handleAllowLeaderboard}/>}
          label={'Participate in idleontoolbox leaderboard ranking'}/>
        <FormHelperText sx={{ whiteSpace: 'pre-wrap' }}>{`Leave this box unchecked if you prefer not to participate in the leaderboard.
To exclude your profile, simply uncheck the box and re-upload your profile.`}</FormHelperText>
        <Typography sx={{ mt: 1 }} color={'error'} variant={'body2'}>{error}</Typography>
        {isValid(parseInt(lastUpload)) ? <Typography sx={{ mt: 3 }} variant={'body2'}>Last
          update: {format(parseInt(lastUpload), 'dd/MM/yyyy HH:mm:ss')}</Typography> : null}
        {lastUpload ? <Stack direction={'row'} alignItems={'center'} gap={1}>
          {lastUpload ? <Typography variant={'body2'}>Time to next upload: </Typography> : null}
          {lastUpload
            ? <NormalTimer
              done={(WAIT_TIME - (Date.now() - lastUpload)) < 0}
              date={intervalToDuration({
                start: new Date(parseInt(lastUpload)),
                end: new Date().getTime() - WAIT_TIME
              })}/>
            : null}
        </Stack> : null}
      </div>
    </> : null
    }
    {showRawData ? <Box sx={{
      position: 'fixed',
      right: 50,
      bottom: 95
    }}>
      <IconButton onClick={() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth' // Optional: Add smooth scrolling
        });
      }} size={'large'}>
        <ArrowUpwardIcon/>
      </IconButton>
    </Box> : null}
  </Container>
};

const ButtonStyle = styled(Button)`
  text-transform: none;
`

export default Data;

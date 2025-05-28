import {
  Card,
  CardContent,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Fade,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Link,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import Button from '@mui/material/Button';
import React, { useContext, useEffect, useState } from 'react';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import styled from '@emotion/styled';
import { useRouter } from 'next/router';
import MenuItem from '@mui/material/MenuItem';
import useTimeout from '../components/hooks/useTimeout';
import NormalTimer from '../components/common/Timer/Normal';
import { format, intervalToDuration, isValid } from 'date-fns';
import { expandLeaderboardInfo, uploadProfile } from '../services/profiles';
import { AppContext } from '@components/common/context/AppProvider';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { NextSeo } from 'next-seo';
import Box from '@mui/material/Box';
import Popper from '@components/common/Popper';
import { isProd, notateNumber } from '@utility/helpers';
import { Adsense } from '@ctrl/react-adsense';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';
import { TitleAndValue } from '@components/common/styles';
import { useLocalStorage } from '@mantine/hooks';
import CookiePolicyDialog from '@components/common/Etc/CookiePolicyDialog';

const HOURS = 4;
const WAIT_TIME = 1000 * 60 * 60 * HOURS;
const Data = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const [key, setKey] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpload, setLastUpload] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [openPolicy, setOpenPolicy] = useState(false);
  const [leaderboardConsent, setLeaderboardConsent] = useLocalStorage({
    key: 'data:leaderboardConsent',
    defaultValue: false
  });
  const [removeGemsInfo, setRemoveGemsInfo] = useLocalStorage({ key: 'data:removeGemsInfo', defaultValue: true });
  const [error, setError] = useState('');
  const showWideSideBanner = useMediaQuery('(min-width: 1200px)', { noSsr: true });
  const showNarrowSideBanner = useMediaQuery('(min-width: 850px)', { noSsr: true });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state?.uid) {
      setLastUpload(localStorage.getItem(`${state?.uid}/lastUpload`));
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
      const data = JSON.parse(localStorage.getItem('rawJson'));
      const extraData = expandLeaderboardInfo(state?.account, state?.characters);
      await navigator.clipboard.writeText(JSON.stringify({ ...data, extraData }, null, 2));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyRaw = async (e) => {
    try {
      setAnchorEl(e.currentTarget)
      const data = JSON.parse(localStorage.getItem('rawJson'));
      await navigator.clipboard.writeText(JSON.stringify(data?.data, null, 2));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = async (e) => {
    try {
      setAnchorEl(e.currentTarget)
      await navigator.clipboard.writeText(`https://idleontoolbox.com/?profile=${state?.characters?.[0]?.name}`);
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

  const handleUpdate = async () => {
    const userData = JSON.parse(localStorage.getItem('rawJson'));
    if (removeGemsInfo) {
      delete userData.data.GemsOwned;
      delete userData.data.ServerGems;
      delete userData.data.ServerGemsReceived;
      delete userData.data.BundlesReceived;
      delete userData.data.GemsPacksPurchased;
      delete userData.data.CYGems;
    }
    const parsedData = expandLeaderboardInfo(state?.account, state?.characters)
    setUploaded(false);
    if (!lastUpload || ((WAIT_TIME - (Date.now() - lastUpload)) < 0)) {
      setLoading(true);
      setError('');
      try {
        await uploadProfile({
          profile: { ...userData, parsedData },
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
    <h1>Data page</h1>
    <>
      <Stack direction={'column'} gap={1} flexWrap={'wrap'}>
        <Section title={'Data'} description={'This is idleon toolbox formatted data, use this when asking for support'}>
          <ButtonStyle component={'span'} variant={'outlined'} startIcon={<FileCopyIcon/>}
                       onClick={handleCopyITRaw}>
            Copy
          </ButtonStyle>
          <ButtonStyle sx={{ ml: 'auto', minWidth: 32 }} component={'span'} variant={'outlined'} size={'small'}
                       onClick={() => setOpen(true)}>
            <VisibilityIcon fontSize={'small'}/>
          </ButtonStyle>
          <Dialog open={open} onClose={() => setOpen(false)}>
            <DialogTitle>
              <Stack direction={'row'} justifyContent={'space-between'}>
                <Typography variant={'h6'}>Raw idleon data</Typography>
                <ButtonStyle sx={{ ml: 'auto' }} component={'span'} size={'small'} variant={'outlined'}
                             onClick={handleCopyRaw}>
                  Copy
                </ButtonStyle>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
                {JSON.stringify(JSON.parse(localStorage.getItem('rawJson')), null, 2)}
              </div>
            </DialogContent>
          </Dialog>
        </Section>
        <Section title={'Configurations'}
                 description={'Various local configurations, use this if you\'re having any issues loading the website'}>
          <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
            <TextField sx={{ width: 220 }} size="small" label={''} select value={key}
                       onChange={(e) => setKey(e.target.value)}>
              <MenuItem value={'all'}>All</MenuItem>
              <MenuItem value={'filters'}>Characters page filters</MenuItem>
              <MenuItem value={'trackers'}>Dashboard config</MenuItem>
              <MenuItem value={'planner'}>Item Planner</MenuItem>
              <MenuItem value={'material-tracker'}>Material tracker</MenuItem>
              <MenuItem value={'last-upload-time'}>Last upload time</MenuItem>
              <MenuItem value={'pinnedPages'}>Pinned Pages</MenuItem>
            </TextField>
            <ButtonStyle size={'small'} color={'warning'} variant={'outlined'} onClick={handleStorageClear}
                         startIcon={<IconInfoCircleFilled/>}>
              Clear
            </ButtonStyle>
          </Stack>
        </Section>
        <Section title={'Cookie Policy'}
                 description={'Review the site\'s cookie policy'}>
          <ButtonStyle variant={'outlined'} onClick={() => setOpenPolicy(true)}>Learn
            more</ButtonStyle>
          <CookiePolicyDialog open={openPolicy} onClose={() => setOpenPolicy(false)}/>
        </Section>
      </Stack>
      <Popper anchorEl={anchorEl} handleClose={() => setAnchorEl(null)}/>
    </>

    {!router.query.profile && state?.characters ? <>
      <>
        <Stack direction={'row'} gap={3}>
          <Card sx={{ mt: 3 }} variant="outlined">
            <CardContent>
              <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                <Typography variant={'h6'} mb={1}>Profile Management</Typography>
                <Tooltip title={<PeakStats {...expandLeaderboardInfo(state?.account, state?.characters)} />}>
                  <IconInfoCircleFilled size={18}/>
                </Tooltip>
              </Stack>
              <Typography variant={'body1'} mb={1}>Your profile link</Typography>
              <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
                <Box sx={{
                  height: 40,
                  border: '1px solid rgb(123 140 154 / 50%)',
                  p: 1,
                  borderRadius: '4px',
                  backgroundColor: '#1d2025',
                  overflow: 'hidden'
                }}>
                  <Link
                    sx={{
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    href={`https://idleontoolbox.com/?profile=${state?.characters?.[0]?.name}`}>https://idleontoolbox.com/?profile={state?.characters?.[0]?.name}</Link>
                </Box>
                <ButtonStyle component={'span'} variant={'outlined'} startIcon={<FileCopyIcon/>} sx={{ height: 40 }}
                             onClick={handleCopyLink}>
                  Copy
                </ButtonStyle>
              </Stack>
              <Divider sx={{ my: 2 }}></Divider>
              <Typography variant={'h6'} my={1}>Upload your profile</Typography>
              <Typography variant={'body1'}>* You can update your profile once every 4 hours</Typography>
              <Box mt={2}>
                <Stack direction={'row'} alignItems={'center'} gap={2}>
                  <ButtonStyle disabled={isDisabled}
                               loading={loading} onClick={handleUpdate}
                               variant={'contained'}>Upload my profile</ButtonStyle>
                  <Fade in={uploaded}>
                    <CheckCircleIcon color={'success'}/>
                  </Fade>
                </Stack>
                <FormGroup sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={<Switch checked={removeGemsInfo} onChange={() => setRemoveGemsInfo(!removeGemsInfo)}/>}
                    label="Remove current/total gems and bundle info."/>
                  <FormControlLabel control={<Switch checked={leaderboardConsent}
                                                     onChange={() => setLeaderboardConsent(!leaderboardConsent)}/>}
                                    label="Participate in idleontoolbox leaderboard ranking"/>
                </FormGroup>
                <FormHelperText sx={{ whiteSpace: 'pre-wrap' }}>{`Turn this off if you prefer not to participate in the leaderboard.
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
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </>
    </> : null}

    {showWideSideBanner || showNarrowSideBanner ? <Box
      sx={{
        backgroundColor: isProd ? '' : '#d73333',
        width: showWideSideBanner ? 300 : showNarrowSideBanner ? 160 : 0,
        height: 600,
        position: 'absolute',
        top: 150,
        right: 100
      }}>
      {isProd && showWideSideBanner ? <Adsense
        client="ca-pub-1842647313167572"
        slot="9767369641"
      /> : null}
      {isProd && showNarrowSideBanner && !showWideSideBanner ? <Adsense
        client="ca-pub-1842647313167572"
        slot="7851151731"
      /> : null}
    </Box> : null}
  </Container>
};

const PeakStats = ({
                     dropRate,
                     defence,
                     accuracy,
                     hp,
                     mp,
                     logBook,
                     totalShinyLevels,
                     slab,
                     greenMushroomKills,
                     totalBoats,
                     totalTomePoints,
                     highestVillagerExpPerHour
                   }) => {
  return <Stack>
    <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Calculated stats</Typography>
    <Divider sx={{ my: 1 }}/>
    <TitleAndValue title={'Drop Rate'} value={`${notateNumber(dropRate, 'MultiplierInfo')}x`}/>
    <TitleAndValue title={'Defence'} value={notateNumber(defence)}/>
    <TitleAndValue title={'Accuracy'} value={notateNumber(accuracy)}/>
    <TitleAndValue title={'HP'} value={notateNumber(hp)}/>
    <TitleAndValue title={'MP'} value={notateNumber(mp)}/>
    <TitleAndValue title={'Log Book'} value={notateNumber(logBook)}/>
    <TitleAndValue title={'Total Shiny Levels'} value={notateNumber(totalShinyLevels)}/>
    <TitleAndValue title={'Slab'} value={notateNumber(slab)}/>
    <TitleAndValue title={'Green Mushroom Kills'} value={notateNumber(greenMushroomKills)}/>
    <TitleAndValue title={'Total Boats'} value={notateNumber(totalBoats)}/>
    <TitleAndValue title={'Total Tome Points'} value={notateNumber(totalTomePoints)}/>
    <TitleAndValue title={'Highest villager exp / hr'} value={notateNumber(highestVillagerExpPerHour)}/>
  </Stack>
}

const Section = ({ title, description, children }) => {
  return <Card variant="outlined" sx={{ maxWidth: { xs: 'auto', sm: 360 } }}>
    <Box sx={{ p: 2 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography gutterBottom variant="h5" component="div">{title}</Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{description}</Typography>
    </Box>
    <Divider/>
    <Stack direction={'row'} sx={{ p: 2 }}>{children}</Stack>
  </Card>
}

const ButtonStyle = styled(Button)`
  text-transform: none;
`

export default Data;

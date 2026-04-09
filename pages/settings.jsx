import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { PreferencesContext } from '@components/common/context/PreferencesProvider';
import useFormatDate from '@hooks/useFormatDate';
import {
  Button,
  Checkbox,
  Collapse,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { NextSeo } from 'next-seo';
import {
  IconCalendarTime,
  IconDatabase,
  IconInfoCircle,
  IconUserCircle
} from '@tabler/icons-react';
import styled from '@emotion/styled';
import HtmlTooltip from '@components/Tooltip';
import { useRouter } from 'next/router';
import { intervalToDuration, isValid } from 'date-fns';
import { expandLeaderboardInfo, uploadProfile } from '../services/profiles';
import { notateNumber, sortKeys } from '@utility/helpers';
import useTimeout from '@hooks/useTimeout';
import NormalTimer from '../components/common/Timer/Normal';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Popper from '@components/common/Popper';
import { TitleAndValue } from '@components/common/styles';
import { useLocalStorage } from '@mantine/hooks';

const HOURS = 4;
const WAIT_TIME = 1000 * 60 * 60 * HOURS;

const SectionHeader = ({ icon: Icon, title, description }) => (
  <>
    <Stack direction="row" alignItems="center" gap={1}>
      <Icon size={22}/>
      <Typography variant="h6">{title}</Typography>
    </Stack>
    <Typography variant="body2" color="text.secondary">{description}</Typography>
  </>
);

const SettingRow = ({ label, description, children }) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }}
         justifyContent="space-between" gap={1} sx={{ py: 0.5 }}>
    <Stack sx={{ minWidth: 0 }}>
      <Typography variant="body1">{label}</Typography>
      {description && <Typography variant="body2" color="text.secondary" component="div">{description}</Typography>}
    </Stack>
    {children}
  </Stack>
);


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
};

const ButtonStyle = styled(Button)`
  text-transform: none;
`;

const Settings = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const { dateFormat, setDateFormat, timeFormat, setTimeFormat } = useContext(PreferencesContext);
  const formatDate = useFormatDate();

  // Profile management state
  const [showClearOptions, setShowClearOptions] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpload, setLastUpload] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [anonId, setAnonId] = useState(null);
  const [leaderboardConsent, setLeaderboardConsent] = useLocalStorage({
    key: 'data:leaderboardConsent',
    defaultValue: 'off'
  });
  const [removeGemsInfo, setRemoveGemsInfo] = useLocalStorage({ key: 'data:removeGemsInfo', defaultValue: true });
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  useEffect(() => {
    if (state?.uid) {
      setLastUpload(localStorage.getItem(`${state?.uid}/lastUpload`));
      setAnonId(localStorage.getItem(`${state.uid}/anonId`));
    }
  }, [state?.uid]);

  useEffect(() => {
    if (lastUpload) {
      setIsDisabled((WAIT_TIME - (Date.now() - lastUpload)) > 0);
    }
  }, [lastUpload]);

  useTimeout(() => {
    setAnchorEl(null);
  }, anchorEl ? 1000 : null);

  const handleCopyITRaw = async (e) => {
    try {
      setAnchorEl(e.currentTarget);
      const data = JSON.parse(sessionStorage.getItem('rawJson'));
      const extraData = expandLeaderboardInfo(state?.account, state?.characters);
      await navigator.clipboard.writeText(JSON.stringify(sortKeys({ ...data, extraData }), null, 2));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyRaw = async (e) => {
    try {
      setAnchorEl(e.currentTarget);
      const data = JSON.parse(sessionStorage.getItem('rawJson'));
      await navigator.clipboard.writeText(JSON.stringify(sortKeys(data?.data), null, 2));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = async (e) => {
    try {
      setAnchorEl(e.currentTarget);
      await navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_IT_URL}?profile=${state?.characters?.[0]?.name}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStorageClear = (keys) => {
    keys.forEach((storageKey) => {
      if (storageKey === 'all') {
        Object.keys(localStorage).forEach(k => {
          if (!k.includes('lastUpload')) {
            localStorage.removeItem(k);
          }
        });
      } else if (storageKey === 'last-upload-time') {
        localStorage.removeItem(`${state?.uid}/lastUpload`);
        setLastUpload(false);
      } else {
        localStorage.removeItem(storageKey);
      }
    });
    router.reload();
  };

  const handleUpdate = async () => {
    const userData = JSON.parse(sessionStorage.getItem('rawJson'));
    if (removeGemsInfo) {
      delete userData.data.GemsOwned;
      delete userData.data.ServerGems;
      delete userData.data.ServerGemsReceived;
      delete userData.data.BundlesReceived;
      delete userData.data.GemsPacksPurchased;
      delete userData.data.CYGems;
    }
    const parsedData = expandLeaderboardInfo(state?.account, state?.characters);
    setUploaded(false);
    if (!lastUpload || ((WAIT_TIME - (Date.now() - lastUpload)) < 0)) {
      setLoading(true);
      setError('');
      try {
        const normalizedConsent = leaderboardConsent === true ? 'public' : leaderboardConsent === false ? 'off' : leaderboardConsent;
        const result = await uploadProfile({
          profile: { ...userData, parsedData },
          leaderboardConsent: normalizedConsent
        }, state?.accessToken);
        const newAnonId = result?.anonId || null;
        setAnonId(newAnonId);
        if (newAnonId) {
          localStorage.setItem(`${state.uid}/anonId`, newAnonId);
        } else {
          localStorage.removeItem(`${state.uid}/anonId`);
        }
        setUploaded(true);
        const now = Date.now();
        localStorage.setItem(`${state?.uid}/lastUpload`, now);
        setLastUpload(now);

        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'profile_uploaded', {
            event_category: 'engagement',
            event_label: 'success',
            value: 1
          });
        }
      } catch (err) {
        setError(err);
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'profile_uploaded', {
            event_category: 'engagement',
            event_label: 'failure',
            value: 1
          });
        }
      }
      setLoading(false);
    }
  };

  if (!state?.signedIn && !state?.profile && !state?.manualImport && !state?.demo) {
    return null;
  }

  return <>
    <NextSeo title="Settings - Idleon Toolbox" description="Configure your Idleon Toolbox preferences and manage your profile"/>
    <Container maxWidth="md" sx={{ my: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Settings</Typography>
      <Stack divider={<Divider/>} spacing={3}>
        {/* Profile — only show for account owner, not public profiles */}
        {state?.characters && !router.query.profile ? <Stack spacing={1.5}>
          <SectionHeader icon={IconUserCircle} title="Profile" description="Manage your public profile and leaderboard participation"/>

          <SettingRow label="Profile link" description="Share this link so others can view your profile">
            <ButtonStyle component="span" variant="outlined" size="small" startIcon={<FileCopyIcon/>}
                         onClick={handleCopyLink}>
              Copy link
            </ButtonStyle>
          </SettingRow>

          <Stack spacing={1}>
            <SettingRow
              label="Upload profile"
              description={<>
                Can be updated once every 4 hours
                {isValid(parseInt(lastUpload)) && <> &middot; Last: {formatDate(parseInt(lastUpload))}</>}
                {lastUpload && isDisabled && <Stack direction="row" alignItems="center" gap={0.5} component="span">
                  {' '}&middot; Next in: <NormalTimer
                    done={!isDisabled}
                    date={intervalToDuration({
                      start: new Date(parseInt(lastUpload)),
                      end: new Date().getTime() - WAIT_TIME
                    })}/>
                </Stack>}
                {anonId && <> &middot; Anonymous ID: <strong>{anonId}</strong></>}
                {error && <Typography color="error" variant="body2">{error}</Typography>}
                <br/>
                <Typography component="span" variant="body2" color="primary"
                            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            onClick={() => setStatsOpen(true)}>
                  View calculated stats
                </Typography>
              </>}
            >
              <Stack direction="row" alignItems="center" gap={1}>
                <ButtonStyle disabled={isDisabled} loading={loading} onClick={handleUpdate}
                             variant="contained" size="small">Upload</ButtonStyle>
                {uploaded && <CheckCircleIcon color="success" fontSize="small"/>}
              </Stack>
            </SettingRow>
            <Dialog open={statsOpen} onClose={() => setStatsOpen(false)}>
              <DialogTitle>Calculated Stats</DialogTitle>
              <DialogContent>
                <PeakStats {...expandLeaderboardInfo(state?.account, state?.characters)} />
              </DialogContent>
            </Dialog>

            <Stack sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'divider' }} spacing={1}>
              <SettingRow label="Hide gem info" description="Remove gems and bundle data from uploads">
                <Switch checked={removeGemsInfo} onChange={() => setRemoveGemsInfo(!removeGemsInfo)}/>
              </SettingRow>

              <SettingRow label={<Stack direction="row" alignItems="center" gap={0.5}>
                Public visibility
                <HtmlTooltip title={<Stack spacing={0.5}>
                  <Typography variant="body2"><strong>Off</strong> - Profile hidden, not on leaderboards</Typography>
                  <Typography variant="body2"><strong>Public</strong> - Profile visible, ranked by name</Typography>
                  <Typography variant="body2"><strong>Anonymous</strong> - Profile hidden, ranked anonymously</Typography>
                </Stack>}>
                  <IconInfoCircle size={16} style={{ cursor: 'pointer' }}/>
                </HtmlTooltip>
              </Stack>} description="Controls both your public profile and leaderboard listing">
                <ToggleButtonGroup
                  value={leaderboardConsent === true ? 'public' : leaderboardConsent === false ? 'off' : leaderboardConsent}
                  exclusive
                  onChange={(_, val) => { if (val) setLeaderboardConsent(val); }}
                  size="small"
                >
                  <ToggleButton value="off">Off</ToggleButton>
                  <ToggleButton value="public">Public</ToggleButton>
                  <ToggleButton value="anonymous">Anonymous</ToggleButton>
                </ToggleButtonGroup>
              </SettingRow>
            </Stack>
          </Stack>
        </Stack> : null}

        {/* Data */}
        <Stack spacing={1.5}>
          <SectionHeader icon={IconDatabase} title="Data" description="Support data and local storage management"/>

          <SettingRow label="Support data" description="Copy Idleon Toolbox formatted data for troubleshooting">
            <ButtonStyle component="span" variant="outlined" size="small" startIcon={<FileCopyIcon/>}
                         onClick={handleCopyITRaw}>
              Copy for support
            </ButtonStyle>
          </SettingRow>

          <SettingRow label="Raw game data" description="View or copy the raw JSON data from the game">
            <ButtonStyle component="span" variant="outlined" size="small"
                         onClick={() => setOpen(true)}>
              View
            </ButtonStyle>
          </SettingRow>

          <Dialog open={open} onClose={() => setOpen(false)}>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="h6">Raw idleon data</Typography>
                <ButtonStyle sx={{ ml: 'auto' }} component="span" size="small" variant="outlined"
                             onClick={handleCopyRaw}>
                  Copy
                </ButtonStyle>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
                {open ? JSON.stringify(sortKeys(JSON.parse(sessionStorage.getItem('rawJson'))?.data), null, 2) : null}
              </div>
            </DialogContent>
          </Dialog>

          <Stack spacing={1}>
            <SettingRow label="Clear local data" description="Remove locally stored configurations">
              <ButtonStyle size="small" variant="outlined"
                           onClick={() => { setShowClearOptions(!showClearOptions); setSelectedKeys([]); }}>
                {showClearOptions ? 'Hide' : 'Manage'}
              </ButtonStyle>
            </SettingRow>
            <Collapse in={showClearOptions}>
              <Stack sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                {[
                  { key: 'filters', label: 'Character filters' },
                  { key: 'trackers', label: 'Dashboard config' },
                  { key: 'planner', label: 'Item Planner' },
                  { key: 'material-tracker', label: 'Material tracker' },
                  { key: 'last-upload-time', label: 'Last upload time' },
                  { key: 'pinnedPages', label: 'Pinned Pages' }
                ].map(({ key: storageKey, label }) => (
                  <FormControlLabel
                    key={storageKey}
                    label={<Typography variant="body2">{label}</Typography>}
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedKeys.includes(storageKey)}
                        onChange={(e) => {
                          setSelectedKeys(e.target.checked
                            ? [...selectedKeys, storageKey]
                            : selectedKeys.filter(k => k !== storageKey));
                        }}
                      />
                    }
                  />
                ))}
                <Stack direction="row" gap={1} sx={{ mt: 1 }}>
                  <ButtonStyle size="small" variant="outlined"
                               disabled={selectedKeys.length === 0}
                               onClick={() => handleStorageClear(selectedKeys)}>
                    Clear selected
                  </ButtonStyle>
                  <ButtonStyle size="small" variant="text"
                               onClick={() => handleStorageClear(['all'])}>
                    Clear all
                  </ButtonStyle>
                </Stack>
              </Stack>
            </Collapse>
          </Stack>

        </Stack>
        {/* Formatting */}
        <Stack spacing={1.5}>
          <SectionHeader icon={IconCalendarTime} title="Formatting" description="Date, and time display preferences"/>
          <SettingRow label="Date format" description="How dates appear across the site">
            <ToggleButtonGroup
              value={dateFormat}
              exclusive
              onChange={(_, val) => { if (val) setDateFormat(val); }}
              size="small"
            >
              <ToggleButton value="DMY">DD/MM</ToggleButton>
              <ToggleButton value="MDY">MM/DD</ToggleButton>
            </ToggleButtonGroup>
          </SettingRow>
          <SettingRow label="Time format" description="12-hour or 24-hour clock">
            <ToggleButtonGroup
              value={timeFormat}
              exclusive
              onChange={(_, val) => { if (val) setTimeFormat(val); }}
              size="small"
            >
              <ToggleButton value="24h">24h</ToggleButton>
              <ToggleButton value="12h">12h</ToggleButton>
            </ToggleButtonGroup>
          </SettingRow>
        </Stack>
      </Stack>
    </Container>
    <Popper anchorEl={anchorEl} handleClose={() => setAnchorEl(null)}/>
  </>;
};

export default Settings;

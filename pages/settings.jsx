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
import { uploadProfile } from '../services/profiles';
import { expandLeaderboardInfo } from '../services/leaderboardInfo';
import { copyForSupport, copyRawData, notateNumber, sortKeys } from '@utility/helpers';
import { errorMessage } from '@utility/analytics';
import { CLIPBOARD_ERROR_MESSAGE, copyText } from '@utility/clipboard';
import useTimeout from '@hooks/useTimeout';
import NormalTimer from '../components/common/Timer/Normal';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Popper from '@components/common/Popper';
import { TitleAndValue } from '@components/common/styles';
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks';

const HOURS = 4;
const WAIT_TIME = 1000 * 60 * 60 * HOURS;

const ACCESS_LABELS = { off: 'Off', public: 'Public', anonymous: 'Anonymous' };

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
      <Typography variant="body1" component="div">{label}</Typography>
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
                     highestVillagerExpPerHour,
                     totalVillagerExpPerHour
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
    <TitleAndValue title={'Total villager exp / hr'} value={notateNumber(totalVillagerExpPerHour)}/>
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
  const [popperMessage, setPopperMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [lastUpload, setLastUpload, removeLastUpload] = useLocalStorage({ key: `${state?.uid}/lastUpload` });
  const [anonId, setAnonId, removeAnonId] = useLocalStorage({ key: `${state?.uid}/anonId` });
  const [lastUploadAccess, setLastUploadAccess, removeLastUploadAccess] = useLocalStorage({
    key: `${state?.uid}/lastUploadAccess`
  });
  const [lastUploadParticipation, setLastUploadParticipation, removeLastUploadParticipation] = useLocalStorage({
    key: `${state?.uid}/lastUploadParticipation`
  });
  const [profileAccess, setProfileAccess] = useLocalStorage({
    key: 'data:profileAccess',
    defaultValue: 'off'
  });
  const [leaderboardParticipation, setLeaderboardParticipation] = useLocalStorage({
    key: 'data:leaderboardParticipation',
    defaultValue: 'off'
  });
  const [removeGemsInfo, setRemoveGemsInfo] = useLocalStorage({ key: 'data:removeGemsInfo', defaultValue: true });
  const [, setMigrated] = useLocalStorage({ key: 'profileAccess:migrated' });
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  useEffect(() => {
    if (lastUpload) {
      setIsDisabled((WAIT_TIME - (Date.now() - lastUpload)) > 0);
    }
  }, [lastUpload]);

  // One-time migration: derive new profileAccess + leaderboardParticipation
  // from the old profileVisibility + leaderboardConsent localStorage keys.
  useEffect(() => {
    if (readLocalStorageValue({ key: 'profileAccess:migrated' })) return;
    setMigrated('1');

    let oldConsent = readLocalStorageValue({ key: 'data:leaderboardConsent' });
    const oldVis = readLocalStorageValue({ key: 'data:profileVisibility' });

    // Normalize legacy boolean consent
    if (oldConsent === true) oldConsent = 'public';
    if (oldConsent === false) oldConsent = 'off';
    if (oldConsent == null) oldConsent = 'off';

    let newAccess;
    let newParticipation;
    if (oldConsent === 'anonymous') {
      newAccess = 'anonymous';
      newParticipation = 'on';
    } else if (oldVis === 'off') {
      newAccess = 'off';
      newParticipation = 'off';
    } else if (oldConsent === 'public') {
      newAccess = 'public';
      newParticipation = 'on';
    } else if (oldVis === 'on') {
      newAccess = 'public';
      newParticipation = 'off';
    } else {
      newAccess = 'off';
      newParticipation = 'off';
    }

    setProfileAccess(newAccess);
    setLeaderboardParticipation(newParticipation);
  }, []);

  useTimeout(() => {
    setAnchorEl(null);
  }, anchorEl ? (popperMessage ? 4000 : 1000) : null);

  const showPopper = (target, message = null) => {
    setPopperMessage(message);
    setAnchorEl(target);
  };

  // The popper reports the result, so it can only be shown once the write has actually resolved.
  const runCopy = async (target, copy) => {
    let copied = false;
    try {
      copied = await copy();
    } catch (err) {
      console.error(err);
    }
    showPopper(target, copied ? null : CLIPBOARD_ERROR_MESSAGE);
  };

  const handleCopyITRaw = async (e) => {
    await runCopy(e.currentTarget, () => copyForSupport(state?.account, state?.characters));
  };

  const handleCopyRaw = async (e) => {
    await runCopy(e.currentTarget, () => copyRawData());
  };

  const handleCopyLink = async (e) => {
    const target = e.currentTarget;
    const charName = state?.characters?.[0]?.name;
    if (!charName) return;
    await runCopy(target, () => copyText(`${process.env.NEXT_PUBLIC_IT_URL}/account/misc/general?profile=${encodeURIComponent(charName)}`));
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
        removeLastUpload();
        removeLastUploadAccess();
        removeLastUploadParticipation();
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
        // Safety: no leaderboard without a profile
        const safeParticipation = profileAccess === 'off' ? 'off' : leaderboardParticipation;
        const result = await uploadProfile({
          profile: { ...userData, parsedData },
          profileAccess,
          leaderboardParticipation: safeParticipation
        }, state?.accessToken);
        const newAnonId = result?.anonId || null;
        if (newAnonId) {
          setAnonId(newAnonId);
        } else {
          removeAnonId();
        }
        setUploaded(true);
        setLastUpload(Date.now());
        setLastUploadAccess(profileAccess);
        setLastUploadParticipation(safeParticipation);

        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'profile_uploaded', {
            event_category: 'engagement',
            event_label: 'success',
            upload_status: 'success',
            profile_access: profileAccess,
            leaderboard: safeParticipation,
            value: 1
          });
        }
      } catch (err) {
        setError(err);
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'profile_uploaded', {
            event_category: 'engagement',
            event_label: 'failure',
            upload_status: 'failure',
            value: 0,
            error_message: errorMessage(err)
          });
        }
      }
      setLoading(false);
    }
  };

  if (!state?.signedIn && !state?.profile && !state?.manualImport && !state?.demo) {
    return null;
  }

  const effectiveParticipation = profileAccess === 'off' ? 'off' : leaderboardParticipation;
  const settingsChangedSinceUpload = lastUploadAccess
    && (lastUploadAccess !== profileAccess || lastUploadParticipation !== effectiveParticipation);

  return <>
    <NextSeo title="Settings | Idleon Toolbox" description="Configure your Idleon Toolbox preferences and manage your profile"/>
    <Container maxWidth="md" sx={{ my: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>Settings</Typography>
      <Stack divider={<Divider/>} spacing={3}>
        {/* Profile - only show for account owner, not public profiles */}
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
                {lastUploadAccess && <> &middot; Uploaded as: <strong>{ACCESS_LABELS[lastUploadAccess] ?? lastUploadAccess}</strong></>}
                {lastUploadParticipation && <> &middot; Leaderboard:
                  {' '}<strong>{lastUploadParticipation === 'on' ? 'On' : 'Off'}</strong></>}
                {settingsChangedSinceUpload && <Typography component="span" variant="body2" color="warning.main">
                  {' '}&middot; Now set to <strong>{ACCESS_LABELS[profileAccess] ?? profileAccess}</strong>
                  {' '}/ leaderboard <strong>{effectiveParticipation === 'on' ? 'On' : 'Off'}</strong> - upload again to apply
                </Typography>}
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
                Profile access
                <HtmlTooltip title={<Stack spacing={0.5}>
                  <Typography variant="body2"><strong>Off</strong> - Profile not visible anywhere</Typography>
                  <Typography variant="body2"><strong>Public</strong> - Profile viewable by character name</Typography>
                  <Typography variant="body2"><strong>Anonymous</strong> - Profile viewable only via anonymous ID</Typography>
                </Stack>}>
                  <IconInfoCircle size={16} style={{ cursor: 'pointer' }}/>
                </HtmlTooltip>
              </Stack>} description="Control how your profile can be accessed">
                <ToggleButtonGroup
                  value={profileAccess}
                  exclusive
                  onChange={(_, val) => {
                    if (!val) return;
                    setProfileAccess(val);
                    if (val === 'off') {
                      setLeaderboardParticipation('off');
                    }
                  }}
                  size="small"
                >
                  <ToggleButton value="off">Off</ToggleButton>
                  <ToggleButton value="public">Public</ToggleButton>
                  <ToggleButton value="anonymous">Anonymous</ToggleButton>
                </ToggleButtonGroup>
              </SettingRow>

              <SettingRow label="Leaderboard participation"
                          description="Appear in public rankings (requires profile access to be enabled)">
                <Switch
                  checked={leaderboardParticipation === 'on'}
                  disabled={profileAccess === 'off'}
                  onChange={() => {
                    setLeaderboardParticipation(leaderboardParticipation === 'on' ? 'off' : 'on');
                  }}
                />
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
    <Popper anchorEl={anchorEl} handleClose={() => setAnchorEl(null)} message={popperMessage ?? undefined}/>
  </>;
};

export default Settings;

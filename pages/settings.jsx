import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { PreferencesContext } from '@components/common/context/PreferencesProvider';
import useFormatDate from '@hooks/useFormatDate';
import useNow from '@hooks/useNow';
import { useThemeMode } from '@components/common/NavBar/ThemeRows';
import {
  Button,
  Checkbox,
  Collapse,
  Container,
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
  IconUserCircle
} from '@tabler/icons-react';
import { styled } from '@mui/material/styles';
import InfoButton from '@components/common/InfoButton';
import Notice from '@components/common/Notice';
import Panel from '@components/common/cards/Panel';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { useRouter } from 'next/router';
import { isValid } from 'date-fns';
import { uploadProfile } from '../services/profiles';
import { expandLeaderboardInfo } from '../services/leaderboardInfo';
import { copyForSupport, copyRawData, formatNum, sortKeys } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { errorMessage } from '@utility/analytics';
import { CLIPBOARD_ERROR_MESSAGE, copyText } from '@utility/clipboard';
import { notify } from '@components/common/Overlays/notify';
import AppDialog from '@components/common/Overlays/AppDialog';
import Timer from '@components/common/Timer';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks';

const HOURS = 4;
const WAIT_TIME = 1000 * 60 * 60 * HOURS;

const ACCESS_LABELS = { off: 'Off', public: 'Public', anonymous: 'Anonymous' };

const SectionHeader = ({ icon: Icon, title, description }) => (
  <>
    <Stack direction="row" alignItems="center" gap={1}>
      <Icon size={22}/>
      <Typography variant={'sectionTitle'} component={'h2'}>{title}</Typography>
    </Stack>
    <Typography variant="body2" color="text.secondary">{description}</Typography>
  </>
);

const SettingRow = ({ label, description, children }) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }}
         justifyContent="space-between" gap={1} sx={{ py: 0.5 }}>
    <Stack sx={{ minWidth: 0 }}>
      <Typography variant="body2" component="div" sx={{ fontWeight: 'fontWeightMedium' }}>{label}</Typography>
      {description && <Typography variant="body2" color="text.secondary" component="div">{description}</Typography>}
    </Stack>
    {children}
  </Stack>
);


// Computed only while its dialog is open: it runs getMaxDamage per character, and a section that throws there stays inside
// the dialog. Lane A where the game has a key for the number (TotalStats, Player*, the villagers'
// Holes.VillagerExpPerHour, Summoning.TomePTS: each read in N.js); whole for what the game counts.
const StatsDialogBody = ({ account, characters }) => {
  const {
    dropRate, defence, accuracy, hp, mp, logBook, totalShinyLevels, slab, greenMushroomKills, totalBoats, totalTomePoints,
    highestVillagerExpPerHour, totalVillagerExpPerHour
  } = expandLeaderboardInfo(account, characters);
  const rows = [
    ['Drop rate', `${formatGame(dropRate, 'TotalStats.Drop_Rarity')}x`],
    ['Defence', formatGame(defence, 'TotalStats.Defence')],
    ['Accuracy', formatGame(accuracy, 'PlayerAccTot')],
    ['HP', formatNum(hp)],
    ['MP', formatNum(mp)],
    ['Log book', formatNum(logBook, 'whole')],
    ['Total shiny levels', formatNum(totalShinyLevels, 'whole')],
    ['Slab', formatNum(slab, 'whole')],
    ['Green mushroom kills', formatNum(greenMushroomKills, 'whole')],
    ['Total boat levels', formatNum(totalBoats, 'whole')],
    ['Total tome points', formatGame(totalTomePoints, 'Summoning.TomePTS')],
    ['Highest villager EXP per hour', formatGame(highestVillagerExpPerHour, 'Holes.VillagerExpPerHour')],
    ['Total villager EXP per hour', formatGame(totalVillagerExpPerHour, 'Holes.VillagerExpPerHour')]
  ];
  return <Stack sx={{ mx: -2, '& > * + *': { borderTop: 1, borderColor: 'divider' } }}>
    {rows.map(([label, value]) => <Panel.KV key={label} label={label} value={value}/>)}
  </Stack>;
};

const ButtonStyle = styled(Button)`
  text-transform: none;
`;

const Settings = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const { dateFormat, setDateFormat, timeFormat, setTimeFormat } = useContext(PreferencesContext);
  const { mode, setMode } = useThemeMode();
  const formatDate = useFormatDate();

  // Profile management state
  const [showClearOptions, setShowClearOptions] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [lastUpload, setLastUpload, removeLastUpload] = useLocalStorage({ key: `${state?.uid}/lastUpload` });
  const now = useNow(10000);
  const isDisabled = Boolean(lastUpload) && now > 0 && (WAIT_TIME - (now - lastUpload)) > 0;
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

  // The snackbar says how the copy went, so it shows once the write has resolved.
  const runCopy = async (copy, successMessage) => {
    let copied = false;
    try {
      copied = await copy();
    } catch (err) {
      console.error(err);
    }
    notify(copied ? successMessage : CLIPBOARD_ERROR_MESSAGE);
  };

  const handleCopyITRaw = async () => {
    await runCopy(() => copyForSupport(state?.account, state?.characters), 'Copied to clipboard');
  };

  const handleCopyRaw = async () => {
    await runCopy(() => copyRawData(), 'Copied to clipboard');
  };

  const handleCopyLink = async () => {
    const charName = state?.characters?.[0]?.name;
    if (!charName) return;
    await runCopy(() => copyText(`${process.env.NEXT_PUBLIC_IT_URL}/account/misc/general?profile=${encodeURIComponent(charName)}`), 'Copied the profile link');
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
        if (storageKey === 'trackers') localStorage.removeItem('trackers-legacy-backup');
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

  // A guest can still set the date and time formats. isLoading is true on the export and the first render, so the note
  // never flashes at an account that is still loading, and both renders match.
  const hasAccount = Boolean(state?.signedIn || state?.profile || state?.manualImport || state?.demo);
  const effectiveParticipation = profileAccess === 'off' ? 'off' : leaderboardParticipation;
  const settingsChangedSinceUpload = lastUploadAccess
    && (lastUploadAccess !== profileAccess || lastUploadParticipation !== effectiveParticipation);

  return <>
    <NextSeo title="Settings | Idleon Toolbox" description="Configure your Idleon Toolbox preferences and manage your profile"/>
    {/* Its title's box 14 px under whatever is above it, as on every page: main's 24 px padding less 10 */}
    <Container maxWidth="md" disableGutters sx={{ mt: '-10px', mb: 3 }}>
      <Typography variant="pageTitle" component="h1" sx={{ mb: 3 }}>Settings</Typography>
      {!hasAccount && !state?.isLoading
        ? <Notice tone={'signin'} sx={{ mb: 3 }}>Your profile and data settings show here once you sign in.</Notice>
        : null}
      <Stack divider={<Divider/>} spacing={3}>
        {/* Profile: only for the account owner, not public profiles */}
        {hasAccount && state?.characters && !router.query.profile ? <Stack spacing={1.5}>
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
              description={<Stack alignItems="flex-start" gap={0.25} component="span">
                <span>
                  Updates once every 4 hours.
                  {isValid(parseInt(lastUpload)) ? <> Last uploaded {formatDate(parseInt(lastUpload), { showSeconds: false })}
                    {isDisabled ? <>, next in <Timer type={'countdown'} date={parseInt(lastUpload) + WAIT_TIME} placeholder={'now'}/></> : null}
                    {lastUploadAccess ? <>, as <strong>{ACCESS_LABELS[lastUploadAccess] ?? lastUploadAccess}</strong></> : null}
                    {lastUploadParticipation ? <> with the leaderboard <strong>{lastUploadParticipation === 'on' ? 'on' : 'off'}</strong></> : null}.</> : null}
                </span>
                {settingsChangedSinceUpload ? <Typography component="span" variant="body2" color="text.warning">
                  Now set to <strong>{ACCESS_LABELS[profileAccess] ?? profileAccess}</strong> with the leaderboard
                  {' '}<strong>{effectiveParticipation === 'on' ? 'on' : 'off'}</strong>: upload again to apply.
                </Typography> : null}
                {anonId ? <span>Your anonymous ID is <strong>{anonId}</strong>.</span> : null}
                <Button variant="text" size="small" onClick={() => setStatsOpen(true)} sx={{ p: 0, minWidth: 0 }}>
                  View calculated stats
                </Button>
              </Stack>}
            >
              <Stack direction="row" alignItems="center" gap={1}>
                <ButtonStyle disabled={isDisabled} loading={loading} onClick={handleUpdate}
                             variant="contained" size="small">Upload</ButtonStyle>
                {uploaded && <CheckCircleIcon fontSize="small" sx={{ color: 'text.success' }}/>}
              </Stack>
            </SettingRow>
            {error ? <Notice tone={'error'}>{errorMessage(error)}</Notice> : null}
            <AppDialog open={statsOpen} onClose={() => setStatsOpen(false)} size="l" title="Calculated stats">
              {statsOpen ? <ErrorBoundary title={'The calculated stats didn\'t load'}>
                <StatsDialogBody account={state?.account} characters={state?.characters}/>
              </ErrorBoundary> : null}
            </AppDialog>

            <Stack sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'divider' }} spacing={1}>
              <SettingRow label="Hide gem info" description="Remove gems and bundle data from uploads">
                <Switch checked={removeGemsInfo} onChange={() => setRemoveGemsInfo(!removeGemsInfo)} inputProps={{ 'aria-label': 'Hide gem info' }}/>
              </SettingRow>

              <SettingRow label={<Stack direction="row" alignItems="center" gap={0.5}>
                Profile access
                <InfoButton label={'Profile access'}>
                  Off: not visible anywhere. Public: anyone with your character's name can view it. Anonymous: only people with your anonymous ID can view it.
                </InfoButton>
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
                  inputProps={{ 'aria-label': 'Leaderboard participation' }}
                  onChange={() => {
                    setLeaderboardParticipation(leaderboardParticipation === 'on' ? 'off' : 'on');
                  }}
                />
              </SettingRow>
            </Stack>
          </Stack>
        </Stack> : null}

        {/* Data */}
        {hasAccount ? <Stack spacing={1.5}>
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

          <AppDialog open={open} onClose={() => setOpen(false)} size="l" title="Raw game data"
                     actions={[{ label: 'Copy raw data', main: true, onClick: handleCopyRaw }]}>
            <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
              {open ? JSON.stringify(sortKeys(JSON.parse(sessionStorage.getItem('rawJson'))?.data), null, 2) : null}
            </div>
          </AppDialog>

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
                  { key: 'pinnedPages', label: 'Pinned pages' }
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

        </Stack> : null}
        {/* Display */}
        <Stack spacing={1.5}>
          <SectionHeader icon={IconCalendarTime} title="Display" description="Theme, date and time preferences"/>
          <SettingRow label="Theme" description="Dark is the default. System follows your device">
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, val) => { if (val) setMode(val); }}
              size="small"
            >
              <ToggleButton value="dark">Dark</ToggleButton>
              <ToggleButton value="light">Light</ToggleButton>
              <ToggleButton value="system">System</ToggleButton>
            </ToggleButtonGroup>
          </SettingRow>
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
  </>;
};

export default Settings;

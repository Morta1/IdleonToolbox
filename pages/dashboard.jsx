import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppContext, writeStored } from '@components/common/context/AppProvider';
import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import Characters from '../components/dashboard/Characters';
import Account from '../components/dashboard/Account';
import { tryToParse } from '@utility/helpers';
import Etc from '../components/dashboard/Etc';
import { NextSeo } from 'next-seo';
import DashboardSettings from '../components/common/DashboardSettings';
import { DashboardSettingsProvider } from '@components/common/context/DashboardSettingsProvider';
import Button from '@mui/material/Button';
import { IconSettingsFilled } from '@tabler/icons-react';
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import DefaultsNote from '@components/dashboard/settings/DefaultsNote';
import { buildModel } from '@utility/dashboard/settingsModel';
import { runAction } from '@utility/dashboard/settingsActions';
import { alertLabel, buildQuickEdit } from '@utility/dashboard/quickEdit';
import UndoSnackbar from '@components/dashboard/settings/UndoSnackbar';
import { trackSettingsEvent } from '@utility/dashboard/settingsAnalytics';
import AlertQuickEdit from '@components/dashboard/settings/AlertQuickEdit';
import { diffTrackers, LEGACY_BACKUP_KEY, loadTrackers, toStoredTrackers } from '@utility/dashboard/trackerStore';

// Roughly the height of a quick edit popover with a picker in it.
const QUICK_EDIT_ROOM = 440;

const Dashboard = () => {
  const { dispatch, state } = useContext(AppContext);
  const { characters, account, lastUpdated } = state;
  const [open, setOpen] = useState(false);
  // Set when the modal is opened by clicking an alert, so it lands on that alert's own setting.
  const [settingsTarget, setSettingsTarget] = useState(null);
  // The alert whose popover is open: its target, the extras its call site passed, where it was
  // clicked, and the config at that moment (what Undo goes back to).
  const [quickEdit, setQuickEdit] = useState(null);
  const [quickUndo, setQuickUndo] = useState(null);
  const [quickEditCount, setQuickEditCount] = useState(0);
  const [initialLoad] = useState(() => loadTrackers(baseTrackers, state?.trackers));
  const [config, setConfig] = useState(initialLoad.config);
  // Set when the stored config could not be converted: keep saving it the pre-R1 way.
  const [legacyMode, setLegacyMode] = useState(initialLoad.status === 'failed');

  // The defaults note is for users whose old full-copy config was just converted to edits: it holds
  // how many settings differed at that moment and stays until dismissed. Edits made later never set it.
  const [defaultsNoteCount, setDefaultsNoteCount] = useLocalStorage({ key: 'dashboard-defaults-note-pending' });

  useEffect(() => {
    if (initialLoad.status === 'converted') {
      if (!readLocalStorageValue({ key: LEGACY_BACKUP_KEY })) writeStored(LEGACY_BACKUP_KEY, initialLoad.legacy);
      dispatch({ type: 'trackers', data: initialLoad.stored });
      const converted = Object.keys(diffTrackers(baseTrackers, initialLoad.config)).length;
      if (converted > 0) setDefaultsNoteCount(converted);
    } else if (initialLoad.status === 'failed' && typeof window.gtag !== 'undefined') {
      window.gtag('event', 'dashboard_config_conversion_failed', {
        event_category: 'dashboard',
        event_label: String(initialLoad.error?.message ?? '').slice(0, 100)
      });
    }
    // Runs once: initialLoad never changes after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [filters, setFilters] = React.useState(tryToParse(localStorage.getItem('dashboard-filters')) || ['account',
    'characters', 'timers']);
  const [hideAlertless, setHideAlertless] = useLocalStorage({
    key: 'dashboard-hide-alertless',
    defaultValue: false
  });
  // No defaultValue: mantine would write it back to storage and a never-set key must stay distinguishable.
  const [defaultsNoteDismissed, setDefaultsNoteDismissed] = useLocalStorage({
    key: 'dashboard-defaults-note-dismissed'
  });
  // Storage is read in an effect, so hold the note back until then instead of flashing it for users who dismissed it.
  const [storageRead, setStorageRead] = useState(false);
  useEffect(() => setStorageRead(true), []);
  const [initialFilter, setInitialFilter] = useState('all');

  const handleOpenSettings = (configType, path, source) => {
    trackSettingsEvent('alert_settings_opened', { source });
    // The window has its own Undo; a stale popover one would wipe edits made there.
    setQuickUndo(null);
    setSettingsTarget(configType ? { configType, path } : null);
    setOpen(true);
  };

  const quickEditFor = (current, configType, target, extra) =>
    buildQuickEdit(current, buildModel(current, baseTrackers, diffTrackers(baseTrackers, current)), configType, target, extra);

  const handleOpenAlert = (element, configType, target, extra = {}) => {
    if (!quickEditFor(config, configType, target, extra)) {
      handleOpenSettings(configType, target, 'alert');
      return;
    }
    const rect = element.getBoundingClientRect();
    setQuickUndo(null);
    setQuickEditCount((count) => count + 1);
    setQuickEdit({
      id: quickEditCount + 1, configType, target, extra,
      // Open below the icon, or above it when the space below is short: MUI would otherwise slide
      // the popover up over the icon that was clicked.
      ...(window.innerHeight - rect.bottom < QUICK_EDIT_ROOM && rect.top > window.innerHeight - rect.bottom
        ? { anchorPosition: { top: rect.top - 4, left: rect.left }, above: true }
        : { anchorPosition: { top: rect.bottom + 4, left: rect.left }, above: false }),
      // The popover shows the icon that was clicked, not the tracker's own one (The Hole vs Bravery).
      iconSrc: element.querySelector('img')?.getAttribute('src') ?? null,
      element,
      snapshot: config
    });
  };

  // A change that hides the clicked alert removes its icon: close the popover rather than leave it
  // floating over other icons. The snackbar's Undo takes over. Watched in the DOM because the
  // alert lists recompute in their own effects, a render after the config change.
  // Only after a checkbox: a threshold hides and shows its alert on every keystroke while typing.
  const closeOnHide = useRef(false);
  useEffect(() => {
    const element = quickEdit?.element;
    if (!element) return;
    const observer = new MutationObserver(() => {
      if (element.isConnected || !closeOnHide.current) return;
      // Closing drops focus to the page, so hand it to the snackbar's Undo.
      setQuickUndo((undo) => undo ? { ...undo, focus: true } : undo);
      setQuickEdit(null);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [quickEdit]);

  const quickModel = quickEdit ? quickEditFor(config, quickEdit.configType, quickEdit.target, quickEdit.extra) : null;

  const handleQuickAction = (name, ...args) => {
    closeOnHide.current = name.startsWith('toggle');
    handleConfigChange(runAction(baseTrackers, config, name, ...args));
    if (quickUndo?.id !== quickEdit.id) trackSettingsEvent('alert_quick_edit_changed', { kind: quickModel.kind });
    if (name === 'resetPath') trackSettingsEvent('alert_settings_reset', { scope: 'option' });
    setQuickUndo({ id: quickEdit.id, label: `Updated: ${quickModel.kind === 'tracker' || !quickModel.option ? quickModel.tracker.label : quickModel.option.label}`, previous: quickEdit.snapshot });
  };

  const undoQuickEdit = () => {
    handleConfigChange(quickUndo.previous);
    setQuickUndo(null);
    setQuickEdit(null);
  };

  const handleCloseSettings = () => {
    setOpen(false);
    setSettingsTarget(null);
    setInitialFilter('all');
  };

  const handleConfigChange = (updatedConfig) => {
    setConfig(updatedConfig);
    dispatch({ type: 'trackers', data: legacyMode ? updatedConfig : toStoredTrackers(baseTrackers, updatedConfig) });
  }

  const handleFilters = (event, newFilters) => {
    if (newFilters.length === 0) return;
    setFilters(newFilters);
    localStorage.setItem('dashboard-filters', JSON.stringify(newFilters));
  };

  const handleHideAlertless = (checked) => {
    setHideAlertless(checked);
  };

  const isDisplayed = (filter) => {
    return filters.includes(filter)
  }

  const handleFileUpload = (data) => {
    const result = loadTrackers(baseTrackers, data);
    setConfig(result.config);
    setLegacyMode(result.status === 'failed');
    dispatch({ type: 'trackers', data: result.stored ?? result.config });
  }

  return <>
    <NextSeo
      title="Dashboard | Idleon Toolbox"
      description="Provides key information about your account and alerts you when there are unfinished tasks"
    />
    <Stack>
      {storageRead && !defaultsNoteDismissed && defaultsNoteCount > 0 ? <DefaultsNote count={defaultsNoteCount}
                                                               onReview={() => {
                                                                 setInitialFilter('edited');
                                                                 handleOpenSettings(null, null, 'note');
                                                               }}
                                                               onDismiss={() => setDefaultsNoteDismissed(true)}/> : null}
      <Stack mb={2} direction={'row'} alignItems={'center'} gap={3} flexWrap={'wrap'}>
        <ToggleButtonGroup value={filters} onChange={handleFilters}>
          <ToggleButton value="account">Account</ToggleButton>
          <ToggleButton value="characters">Characters</ToggleButton>
          <ToggleButton value="timers">Timers</ToggleButton>
        </ToggleButtonGroup>
        <Button variant={'outlined'} sx={{ textTransform: 'none', height: 32 }}
                startIcon={<IconSettingsFilled size={20}/>}
                onClick={() => {
                  handleOpenSettings(null, null, 'button');
                }}>
          Configure alerts
        </Button>
      </Stack>
      <Stack gap={2}>
        <DashboardSettingsProvider onOpenAlert={handleOpenAlert}
                                   labelFor={(configType, target, extra) => alertLabel(config, configType, target, extra)}>
          {isDisplayed('account') ? <Account trackers={config?.account} characters={characters}
                                             account={account} lastUpdated={lastUpdated}/> : null}
          {isDisplayed('characters') ? <Characters trackers={config?.characters} characters={characters}
                                                   account={account} lastUpdated={lastUpdated}
                                                   hideAlertless={hideAlertless}/> : null}
          {isDisplayed('timers') ? <Etc characters={characters} account={account} trackers={config?.timers}
                                        lastUpdated={lastUpdated}/> : null}
        </DashboardSettingsProvider>
      </Stack>
    </Stack>
    <DashboardSettings onFileUpload={handleFileUpload} onChange={handleConfigChange} open={open}
                       onClose={handleCloseSettings} config={config} target={settingsTarget}
                       initialFilter={initialFilter}
                       exportConfig={legacyMode ? config : toStoredTrackers(baseTrackers, config)}
                       hideAlertless={hideAlertless} onHideAlertlessChange={handleHideAlertless}/>
    <AlertQuickEdit quickEdit={quickModel} open={Boolean(quickModel)} anchorPosition={quickEdit?.anchorPosition} above={quickEdit?.above}
                    iconSrc={quickEdit?.iconSrc}
                    // Escape unmounts the popover without blurring its field; blur first so its clamp runs.
                    onClose={() => {
                      document.activeElement?.blur?.();
                      setQuickEdit(null);
                    }} onAction={handleQuickAction}
                    onUndo={quickUndo?.id === quickEdit?.id ? undoQuickEdit : undefined}
                    onOpenAll={() => {
                      setQuickEdit(null);
                      handleOpenSettings(quickEdit.configType, quickEdit.target, 'quick_edit');
                    }}/>
    {quickUndo && !quickEdit ? <UndoSnackbar key={quickUndo.id} label={quickUndo.label} onUndo={undoQuickEdit} autoFocus={quickUndo.focus}
                                             onClose={() => setQuickUndo(null)}/> : null}
  </>
};

export default Dashboard;

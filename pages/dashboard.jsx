import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppContext, writeStored } from '@components/common/context/AppProvider';
import { Stack } from '@mui/material';
import ErrorBoundary from '@components/common/ErrorBoundary';
import Notice from '@components/common/Notice';
import PageSettings from '@components/common/PageSettings';
import Toolbar from '@components/common/Toolbar';
import { MissingData } from '@components/common/styles';
import SectionToggles from '@components/dashboard/SectionToggles';
import { normalizeSectionOrder } from '@utility/dashboard/sectionOrder';
import Characters from '../components/dashboard/Characters';
import Account from '../components/dashboard/Account';
import Etc from '../components/dashboard/Etc';
import Goals from '@components/dashboard/goals/Goals';
import { NextSeo } from 'next-seo';
import DashboardSettings from '../components/common/DashboardSettings';
import { DashboardSettingsProvider } from '@components/common/context/DashboardSettingsProvider';
import { readLocalStorageValue, useLocalStorage } from '@mantine/hooks';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import DefaultsNote from '@components/dashboard/settings/DefaultsNote';
import { buildModel } from '@utility/dashboard/settingsModel';
import { runAction } from '@utility/dashboard/settingsActions';
import { alertLabel, alertPage, buildQuickEdit, pageHref } from '@utility/dashboard/quickEdit';
import { useRouter } from 'next/router';
import usePageTop from '@hooks/usePageTop';
import { closeNotice, notify } from '@components/common/Overlays/notify';
import { trackSettingsEvent } from '@utility/dashboard/settingsAnalytics';
import AlertQuickEdit from '@components/dashboard/settings/AlertQuickEdit';
import { diffTrackers, LEGACY_BACKUP_KEY, loadTrackers, toStoredTrackers } from '@utility/dashboard/trackerStore';

const GOALS_FILTER_ADDED_KEY = 'dashboard-goals-filter-added';
const SECTION_TITLES = { goals: 'The goals', account: 'The Account alerts', characters: 'The Characters alerts', timers: 'The timers' };

const Dashboard = () => {
  const router = useRouter();
  const { dispatch, state } = useContext(AppContext);
  const { characters, account, lastUpdated } = state;
  const guest = Boolean(state?.emptyAccount);
  // No save was read: an alert or a timer would be computed from nothing, so only the page's note shows.
  const noSave = guest || Boolean(account?.failedSections?.includes('*'));
  const [open, setOpen] = useState(false);
  // Set when the modal is opened by clicking an alert, so it lands on that alert's own setting.
  const [settingsTarget, setSettingsTarget] = useState(null);
  // The alert whose quick edit is open: its target, the extras its call site passed, the icon that
  // was clicked, and the config at that moment (what Undo goes back to).
  const [quickEdit, setQuickEdit] = useState(null);
  // The quick edit closes first and lets go of its alert once it has slid out, so it leaves the way it came.
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickUndo, setQuickUndo] = useState(null);
  const [quickEditCount, setQuickEditCount] = useState(0);
  // The Undo notice a closed quick edit left, so a newer edit or the full window can take it away.
  const quickNotice = useRef(null);
  // The quick edit's last change, kept outside render: Esc blurs the field first, and the value that
  // blur settles changes the config inside the close handler, after quickUndo and quickChanged were read.
  const pendingQuick = useRef(null);
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
  const [filters, setFilters] = React.useState(readLocalStorageValue({ key: 'dashboard-filters' }) || ['account',
    'characters', 'timers', 'goals']);
  // Goals arrived after users had saved their filters: add it to a saved list once, then never again.
  useEffect(() => {
    if (readLocalStorageValue({ key: GOALS_FILTER_ADDED_KEY })) return;
    const saved = readLocalStorageValue({ key: 'dashboard-filters' });
    if (Array.isArray(saved) && !saved.includes('goals')) {
      const next = [...saved, 'goals'];
      // Runs once per browser: the flag below stops it, so no render cascade.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilters(next);
      writeStored('dashboard-filters', next);
    }
    writeStored(GOALS_FILTER_ADDED_KEY, true);
  }, []);
  // No defaultValue and read in an effect by mantine: the first render is the default order, like the export.
  const [savedOrder, setSavedOrder] = useLocalStorage({ key: 'dashboard-section-order' });
  const sectionOrder = normalizeSectionOrder(savedOrder);
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
  const [sectionsBarBottom, setSectionsBarBottom] = useState(0);
  const pageTop = usePageTop();

  const handleOpenSettings = (configType, path, source) => {
    trackSettingsEvent('alert_settings_opened', { source });
    // The window has its own Undo; a stale popover one would wipe edits made there.
    setQuickUndo(null);
    pendingQuick.current = null;
    closeNotice(quickNotice.current);
    setSettingsTarget(configType ? { configType, path } : null);
    setOpen(true);
  };

  const quickEditFor = (current, configType, target, extra) =>
    buildQuickEdit(current, buildModel(current, baseTrackers, diffTrackers(baseTrackers, current)), configType, target, extra);

  const handleOpenAlert = (element, configType, target, extra = {}, message = null) => {
    closeNotice(quickNotice.current);
    if (!quickEditFor(config, configType, target, extra)) {
      handleOpenSettings(configType, target, 'alert');
      return;
    }
    setQuickUndo(null);
    pendingQuick.current = null;
    setQuickEditCount((count) => count + 1);
    setQuickOpen(true);
    setQuickEdit({
      id: quickEditCount + 1, configType, target, extra, message,
      // The quick edit shows the icon that was clicked, not the tracker's own one (The Hole vs Bravery).
      iconSrc: element.querySelector('img')?.getAttribute('src') ?? null,
      snapshot: config
    });
  };

  const quickModel = quickEdit ? quickEditFor(config, quickEdit.configType, quickEdit.target, quickEdit.extra) : null;

  const changedFrom = (next, previous) =>
    JSON.stringify(diffTrackers(baseTrackers, next)) !== JSON.stringify(diffTrackers(baseTrackers, previous));

  const handleQuickAction = (name, ...args) => {
    const next = runAction(baseTrackers, config, name, ...args);
    handleConfigChange(next);
    if (quickUndo?.id !== quickEdit.id) trackSettingsEvent('alert_quick_edit_changed', { kind: quickModel.kind });
    if (name === 'resetPath') trackSettingsEvent('alert_settings_reset', { scope: 'option' });
    const undo = { id: quickEdit.id, label: `Updated: ${quickModel.kind === 'tracker' || !quickModel.option ? quickModel.tracker.label : quickModel.option.label}`, previous: quickEdit.snapshot };
    setQuickUndo(undo);
    pendingQuick.current = { ...undo, next };
  };

  // Ticking something off and on again is no change: no Undo for it.
  const quickChanged = Boolean(quickUndo) && changedFrom(config, quickUndo.previous);

  const undoQuickEdit = () => {
    handleConfigChange(quickUndo.previous);
    setQuickUndo(null);
    pendingQuick.current = null;
    setQuickOpen(false);
  };

  const closeQuickEdit = () => {
    const pending = pendingQuick.current;
    pendingQuick.current = null;
    if (pending?.id === quickEdit?.id && changedFrom(pending.next, pending.previous)) {
      quickNotice.current = notify(pending.label, {
        undo: () => {
          handleConfigChange(pending.previous);
          setQuickUndo(null);
        }
      });
    }
    setQuickOpen(false);
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
    writeStored('dashboard-filters', newFilters);
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

  const sections = {
    goals: <Goals/>,
    account: <Account trackers={config?.account} characters={characters} account={account} lastUpdated={lastUpdated}/>,
    characters: <Characters trackers={config?.characters} characters={characters} account={account}
                            lastUpdated={lastUpdated} hideAlertless={hideAlertless} onHideAlertless={setHideAlertless}/>,
    timers: <Etc characters={characters} account={account} trackers={config?.timers} lastUpdated={lastUpdated}/>
  };

  return <>
    <NextSeo
      title="Dashboard | Idleon Toolbox"
      description="Provides key information about your account and alerts you when there are unfinished tasks"
    />
    <Stack>
      {account?.failedSections?.length
        ? <MissingData sections={account.failedSections}/>
        : guest ? <Notice tone={'signin'} sx={{ mb: 2 }}>Your alerts, timers and goals show here once you sign in.</Notice> : null}
      {storageRead && !defaultsNoteDismissed && defaultsNoteCount > 0 ? <DefaultsNote count={defaultsNoteCount}
                                                               onReview={() => {
                                                                 setInitialFilter('edited');
                                                                 handleOpenSettings(null, null, 'note');
                                                               }}
                                                               onDismiss={() => setDefaultsNoteDismissed(true)}/> : null}
      {/* With no save no section draws, so there is nothing for its pills to show */}
      {noSave ? null : <Toolbar noun={'sections'} onStickyBottom={setSectionsBarBottom}>
        <Toolbar.Lead>
          <SectionToggles order={sectionOrder} filters={filters} onFilters={handleFilters} onReorder={setSavedOrder}/>
        </Toolbar.Lead>
      </Toolbar>}
      <PageSettings onOpen={() => handleOpenSettings(null, null, 'button')} label={'Configure alerts'}
                    changed={Object.keys(diffTrackers(baseTrackers, config)).length > 0}/>
      {/* A section's own Toolbar pins right under the page's, the way a pinned tab strip takes this variable. Its own
          stacking context keeps it under the page's bar while it scrolls up to its pin. */}
      <Stack gap={2} sx={{ position: 'relative', zIndex: 0, '--page-tabs-pinned': `${Math.max(0, sectionsBarBottom - pageTop)}px` }}>
        <DashboardSettingsProvider onOpenAlert={handleOpenAlert}
                                   labelFor={(configType, target, extra) => alertLabel(config, configType, target, extra)}
                                   hrefFor={(configType, target) => {
                                     const page = alertPage(config, configType, target);
                                     return page ? pageHref(page, router.query) : null;
                                   }}>
          {/* Each section fails alone: a throw in one leaves its note and the others. */}
          {sectionOrder.map((id) => isDisplayed(id) && !noSave
            ? <ErrorBoundary key={id} title={`${SECTION_TITLES[id]} didn't load`} resetKey={lastUpdated}>{sections[id]}</ErrorBoundary>
            : null)}
        </DashboardSettingsProvider>
      </Stack>
    </Stack>
    <DashboardSettings onFileUpload={handleFileUpload} onChange={handleConfigChange} open={open}
                       onClose={handleCloseSettings} config={config} target={settingsTarget}
                       initialFilter={initialFilter}
                       exportConfig={legacyMode ? config : toStoredTrackers(baseTrackers, config)}/>
    <AlertQuickEdit quickEdit={quickModel} open={quickOpen && Boolean(quickModel)} iconSrc={quickEdit?.iconSrc}
                    message={quickEdit?.message}
                    onExited={() => setQuickEdit(null)}
                    pageHref={quickModel?.page ? pageHref(quickModel.page, router.query) : null}
                    // Escape unmounts the popover without blurring its field; blur first so its clamp runs.
                    onClose={() => {
                      document.activeElement?.blur?.();
                      closeQuickEdit();
                    }} onAction={handleQuickAction}
                    onUndo={quickChanged && quickUndo?.id === quickEdit?.id ? undoQuickEdit : undefined}
                    onOpenAll={() => {
                      closeQuickEdit();
                      handleOpenSettings(quickEdit.configType, quickEdit.target, 'quick_edit');
                    }}/>
  </>
};

export default Dashboard;

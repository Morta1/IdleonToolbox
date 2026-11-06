import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Notice from '@components/common/Notice';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDebouncedValue } from '@mantine/hooks';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconFileExport } from '@tabler/icons-react';
import { handleDownload } from '@utility/helpers';
import FileUploadButton, { FILE_BUTTON_SX } from '@components/common/DownloadButton';
import { ShowField } from '@components/common/Toolbar';
import { resolveSettingsTarget } from '@utility/dashboard/settingsTarget';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, loadTrackers, TRACKERS_SCHEMA } from '@utility/dashboard/trackerStore';
import { allTrackers, buildModel, FILTERS, matchesFilter, searchModel } from '@utility/dashboard/settingsModel';
import { runAction } from '@utility/dashboard/settingsActions';
import { resetScope, trackSettingsEvent } from '@utility/dashboard/settingsAnalytics';
import SettingsNav from '@components/dashboard/settings/SettingsNav';
import SectionPane from '@components/dashboard/settings/SectionPane';
import SearchResults from '@components/dashboard/settings/SearchResults';
import { EditedDot } from '@components/dashboard/settings/EditedTag';
import { closeNotice, notify } from '@components/common/Overlays/notify';
import NoticeSlot from '@components/common/Overlays/NoticeSlot';

const TITLE_ID = 'configure-alerts-title';
const TAP = { minWidth: { xs: 44, sm: 'auto' }, minHeight: { xs: 44, sm: 'auto' } };
const notAConfig = (fileName) => `Nothing changed: ${fileName} isn't an alert config made with Export.`;
// Each refusal is a note of its own (id), so the same wrong file twice is read out twice.
const refusal = (fileName) => (previous) => ({ message: notAConfig(fileName), id: (previous?.id ?? 0) + 1 });

const FILTER_LABELS = { all: 'All', on: 'On', off: 'Off', edited: 'Edited', threshold: 'Has threshold' };

const DashboardSettings = ({
  open, onClose, config, onChange, onFileUpload, exportConfig, target, initialFilter = 'all'
}) => {
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const edits = diffTrackers(baseTrackers, config);
  const model = buildModel(config, baseTrackers, edits);
  const [tabIndex, setTabIndex] = useState(0);
  const [sectionKey, setSectionKey] = useState(model[0].sections[0].key);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [filter, setFilter] = useState(initialFilter);
  const [query, setQuery] = useState('');
  const paneRef = useRef(null);
  // One event per pause in typing, carrying only how many results the query found.
  const [settledQuery] = useDebouncedValue(query.trim(), 1000);
  useEffect(() => {
    if (open && settledQuery) trackSettingsEvent('alert_settings_search', { results: searchModel(model, settledQuery).length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settledQuery]);
  const [expanded, setExpanded] = useState({});
  const [highlight, setHighlight] = useState(null);
  const undoNotice = useRef(null);
  const [importError, setImportError] = useState(null);
  // The refusal's x hands the focus back to Import, where it came from.
  const importButton = useRef(null);

  // The dialog stays mounted while closed, so every opening re-points it: at the alert that
  // opened it, or back to the first section.
  const [seen, setSeen] = useState({ open: false, target });
  if (seen.open !== open || seen.target !== target) {
    setSeen({ open, target });
    if (!open) {
      setHighlight(null);
      setExpanded({});
    } else {
      const resolved = resolveSettingsTarget(config, target?.configType, target?.path);
      setQuery('');
      setImportError(null);
      if (resolved) {
        const tab = model[resolved.tab];
        const section = tab.sections.find((item) => item.section === resolved.section) ?? tab.sections[0];
        const path = [resolved.configType, resolved.section, resolved.trackerName].filter(Boolean).join('.');
        setTabIndex(resolved.tab);
        setSectionKey(section.key);
        setFilter('all');
        setMobileDetail(true);
        setExpanded(resolved.trackerName ? { [path]: true } : {});
        setHighlight(resolved.trackerName ? { path, optionName: resolved.optionName } : null);
      } else {
        // Reviewing edits starts where the first edit is, not on a section that may have none.
        const editedTab = initialFilter === 'edited' ? model.findIndex((item) => item.edited) : -1;
        const startTab = Math.max(editedTab, 0);
        const startSection = editedTab >= 0 ? model[editedTab].sections.find((item) => item.edited) : model[0].sections[0];
        setFilter(initialFilter);
        setTabIndex(startTab);
        setSectionKey(startSection.key);
        setExpanded({});
        setMobileDetail(editedTab >= 0);
        setHighlight(null);
      }
    }
  }
  useEffect(() => {
    closeNotice(undoNotice.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target]);

  const run = (name, ...args) => {
    if (name === 'resetPath') trackSettingsEvent('alert_settings_reset', { scope: resetScope(model, args[0]) });
    return runAction(baseTrackers, config, name, ...args);
  };
  const onAction = (name, ...args) => onChange(run(name, ...args));
  const showUndo = (label) => {
    const previous = config;
    undoNotice.current = notify(label, { undo: () => onChange(previous) });
  };
  const onBulk = (label, name, ...args) => {
    showUndo(label);
    onChange(run(name, ...args));
  };
  // Never a dialog from a dialog (Overlays board): Reset all runs at once and its Undo notice takes it back.
  const resetAll = () => onBulk('All alerts reset to defaults', 'resetPath', null);

  const tab = model[tabIndex];
  const section = tab.sections.find((item) => item.key === sectionKey) ?? tab.sections[0];
  // Spaces alone are not a search.
  const searching = query.trim();
  const results = searchModel(model, searching);
  const counting = searching ? results.map(({ tracker }) => tracker) : allTrackers(model);
  const countFor = (key) => counting.filter((tracker) => matchesFilter(tracker, key)).length;

  const changeTab = (index) => {
    setTabIndex(index);
    setSectionKey(model[index].sections[0].key);
    setMobileDetail(model[index].sections.length === 1);
  };
  const changeSection = (key) => {
    setSectionKey(key);
    setMobileDetail(true);
  };
  const jumpTo = (path) => {
    setMobileDetail(true);
    setExpanded((prev) => ({ ...prev, [path]: true }));
    setHighlight({ path, optionName: null });
  };
  const showResult = ({ tab: resultTab, section: resultSection, tracker, option }) => {
    setQuery('');
    setTabIndex(model.indexOf(resultTab));
    setSectionKey(resultSection.key);
    setMobileDetail(true);
    setExpanded((prev) => ({ ...prev, [tracker.path]: true }));
    setHighlight({ path: tracker.path, optionName: option?.name ?? null });
  };

  const handleExport = () => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'dashboard_config_exported', { event_category: 'engagement', event_label: 'dashboard', value: 1 });
    }
    handleDownload(exportConfig ?? config, 'it-dashboard-config');
  };
  const handleImport = (data, fileName = 'That file') => {
    if (!(data?.schema === TRACKERS_SCHEMA || (data?.account && data?.characters))) {
      setImportError(refusal(fileName));
      return;
    }
    setImportError(null);
    const imported = loadTrackers(baseTrackers, data).config;
    const editCount = Object.keys(diffTrackers(baseTrackers, imported)).length;
    showUndo(`Imported ${allTrackers(model).length} alerts, ${editCount} edited from default`);
    onFileUpload(data);
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'dashboard_config_imported', { event_category: 'engagement', event_label: 'dashboard', value: 1 });
    }
  };

  const search = <TextField
    size="small" fullWidth value={query} placeholder={isSm ? `Search ${allTrackers(model).length} alerts` : `Search ${allTrackers(model).length} alerts, options and descriptions`}
    onChange={(e) => {
      setQuery(e.target.value);
      // Results replace the pane, so start them at the top rather than at the old scroll position.
      paneRef.current?.scrollTo?.(0, 0);
    }}
    slotProps={{
      htmlInput: { 'aria-label': 'Search alerts' },
      input: {
        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment>,
        endAdornment: query ? <IconButton aria-label="Clear search" size="small" sx={{ ...TAP, my: { xs: '-4px', sm: 0 } }} onClick={() => setQuery('')}><CloseIcon fontSize="small"/></IconButton> : null
      }
    }}/>;

  const fileButtons = <>
    <FileUploadButton ref={importButton} onFileUpload={handleImport}
                      onInvalidFile={(fileName) => setImportError(refusal(fileName))}>
      Import
    </FileUploadButton>
    <Button onClick={handleExport} startIcon={<IconFileExport size={18}/>} variant="outlined" size="small"
            sx={FILE_BUTTON_SX}>Export</Button>
  </>;

  const filterRow = <Stack direction="row" columnGap={2} rowGap={1} alignItems="center" flexWrap="wrap">
    <ShowField value={filter} onChange={setFilter} options={FILTERS.map((key) => [key, FILTER_LABELS[key], countFor(key)])} fullWidth={isSm}/>
    {searching ? <Typography variant="caption" color="text.secondary">While searching, counts are results</Typography> : null}
    <Typography variant="caption" color="text.secondary" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <EditedDot label={null}/>Changed from default
    </Typography>
  </Stack>;

  // The player's file, not a bug: no Report or Reload, and the x or the next import clears it
  const importNote = importError ? <Notice key={importError.id} tone={'error'} action={false} onDismiss={() => setImportError(null)} focusAfter={importButton}>
    {importError.message}
  </Notice> : null;

  const pane = searching
    ? <SearchResults results={results.filter(({ tracker }) => matchesFilter(tracker, filter))} query={searching} onAction={onAction} onShow={showResult}
                     onClear={() => setQuery('')}/>
    : <SectionPane section={section} filter={filter} expanded={expanded}
                   onToggleExpanded={(path) => setExpanded((prev) => ({ ...prev, [path]: !prev[path] }))}
                   onSetExpanded={(paths, value) => setExpanded((prev) => ({ ...prev, ...Object.fromEntries(paths.map((path) => [path, value])) }))}
                   target={highlight} onAction={onAction} onBulk={onBulk} onShowAll={() => setFilter('all')}/>;

  const nav = <SettingsNav model={model} tabIndex={tabIndex} onTabChange={changeTab} sectionKey={section.key}
                           onSectionChange={changeSection} onTrackerJump={jumpTo}/>;

  return <>
    <Dialog open={open} onClose={onClose} aria-labelledby={TITLE_ID} fullWidth maxWidth="lg" fullScreen={isSm}
            PaperProps={{ sx: { height: { sm: '90vh' } } }}>
      <DialogTitle component="div" id="configure-alerts-header" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pb: { xs: 1, sm: 1.5 } }}>
        <Stack direction="row" alignItems="center" gap={2}>
          {isSm && mobileDetail && !searching
            ? <IconButton aria-label="Back to sections" sx={TAP} onClick={() => setMobileDetail(false)}><ArrowBackIcon/></IconButton> : null}
          <Typography id={TITLE_ID} variant={'sectionTitle'} component="h1" sx={{ whiteSpace: 'nowrap' }}>Configure alerts</Typography>
          {!isSm ? <Box sx={{ flex: 1, maxWidth: 520 }}>{search}</Box> : null}
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ ml: 'auto' }}>
            {!isSm ? fileButtons : null}
            {!isSm ? <Button size="small" color="inherit" disabled={!Object.keys(edits).length} onClick={resetAll}>Reset all</Button> : null}
            <IconButton aria-label="Close" sx={TAP} onClick={onClose}><CloseIcon/></IconButton>
          </Stack>
        </Stack>
        {!isSm ? filterRow : null}
        {!isSm ? importNote : null}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, display: 'flex', minHeight: 0 }}>
        {isSm
          ? <Box ref={paneRef} sx={{ p: 1.5, width: '100%', overflowY: 'auto' }}>
            {/* A phone keeps only the title row fixed: the rest scrolls away with the list, for the room to read it */}
            <Stack gap={1.5} sx={{ mb: 1.5 }}>
              <Stack direction="row" gap={0.5}>{fileButtons}</Stack>
              {search}
              {filterRow}
              {importNote}
            </Stack>
            {searching || mobileDetail ? pane : <>
              {nav}
              <Button fullWidth color="inherit" sx={{ ...TAP, mt: 2 }} disabled={!Object.keys(edits).length} onClick={resetAll}>Reset all alerts</Button>
            </>}
          </Box>
          : <>
            <Box sx={{ width: 288, flexShrink: 0, borderRight: 1, borderColor: 'divider', p: 1.5, overflowY: 'auto' }}>{nav}</Box>
            <Box ref={paneRef} sx={{ flex: 1, minWidth: 0, p: 2.5, overflowY: 'auto' }}>{pane}</Box>
          </>}
      </DialogContent>
      <NoticeSlot open={open}/>
    </Dialog>
</>;
};

export default DashboardSettings;

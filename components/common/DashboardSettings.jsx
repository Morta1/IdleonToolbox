import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconFileExport } from '@tabler/icons-react';
import { handleDownload } from '@utility/helpers';
import FileUploadButton from '@components/common/DownloadButton';
import { resolveSettingsTarget } from '@utility/dashboard/settingsTarget';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, loadTrackers } from '@utility/dashboard/trackerStore';
import { allTrackers, buildModel, FILTERS, matchesFilter, searchModel } from '@utility/dashboard/settingsModel';
import * as settingsActions from '@utility/dashboard/settingsActions';
import SettingsNav from '@components/dashboard/settings/SettingsNav';
import SectionPane from '@components/dashboard/settings/SectionPane';
import SearchResults from '@components/dashboard/settings/SearchResults';

const FILTER_LABELS = { all: 'All', on: 'On', off: 'Off', edited: 'Edited', threshold: 'Has threshold' };

const DashboardSettings = ({
  open, onClose, config, onChange, onFileUpload, exportConfig, target,
  hideAlertless, onHideAlertlessChange, initialFilter = 'all'
}) => {
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const edits = diffTrackers(baseTrackers, config);
  const model = buildModel(config, baseTrackers, edits);
  const [tabIndex, setTabIndex] = useState(0);
  const [sectionKey, setSectionKey] = useState(model[0].sections[0].key);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [filter, setFilter] = useState(initialFilter);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState({});
  const [highlight, setHighlight] = useState(null);
  const [undo, setUndo] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState(null);

  // The dialog stays mounted while closed, so every opening re-points it: at the alert that
  // opened it, or back to the first section.
  useEffect(() => {
    if (!open) return;
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
      setFilter(initialFilter);
      setMobileDetail(false);
      setHighlight(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target]);

  const run = (name, ...args) => name === 'resetPath'
    ? settingsActions.resetPath(baseTrackers, config, ...args)
    : settingsActions[name](config, ...args);
  const onAction = (name, ...args) => onChange(run(name, ...args));
  const onBulk = (label, name, ...args) => {
    setUndo({ label, previous: config });
    onChange(run(name, ...args));
  };

  const tab = model[tabIndex];
  const section = tab.sections.find((item) => item.key === sectionKey) ?? tab.sections[0];
  const results = searchModel(model, query);
  const counting = query ? results.map(({ tracker }) => tracker) : allTrackers(model);
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
    if (!(data?.schema === 2 || (data?.account && data?.characters))) {
      setImportError(`${fileName} isn't an alert config. Nothing was changed. Pick a file made with Export.`);
      return;
    }
    setImportError(null);
    const imported = loadTrackers(baseTrackers, data).config;
    const editCount = Object.keys(diffTrackers(baseTrackers, imported)).length;
    setUndo({ label: `Imported ${allTrackers(model).length} alerts, ${editCount} edited from default`, previous: config });
    onFileUpload(data);
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'dashboard_config_imported', { event_category: 'engagement', event_label: 'dashboard', value: 1 });
    }
  };

  const search = <TextField
    size="small" fullWidth value={query} placeholder={`Search ${allTrackers(model).length} alerts, options and descriptions`}
    onChange={(e) => setQuery(e.target.value)}
    slotProps={{
      htmlInput: { 'aria-label': 'Search alerts' },
      input: {
        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment>,
        endAdornment: query ? <IconButton aria-label="Clear search" size="small" onClick={() => setQuery('')}><CloseIcon fontSize="small"/></IconButton> : null
      }
    }}/>;

  const chips = <Stack direction="row" gap={1} alignItems="center" sx={{ overflowX: 'auto', pb: 0.5 }}>
    {FILTERS.map((key) => <Chip key={key} label={`${FILTER_LABELS[key]} ${countFor(key)}`}
                                color={filter === key ? 'primary' : 'default'} variant={filter === key ? 'filled' : 'outlined'}
                                onClick={() => setFilter(key)} sx={{ minHeight: { xs: 44, sm: 32 } }}/>)}
    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', ml: 1 }}>
      {query ? 'While searching, counts are results' : 'Every count is alerts, not options'}
    </Typography>
  </Stack>;

  const hideAlertlessRow = tab.configType === 'characters' ? <Stack direction="row" alignItems="center" gap={1.5}
                                                                    sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
    <Switch checked={Boolean(hideAlertless)} onChange={(e) => onHideAlertlessChange(e.target.checked)}
            inputProps={{ 'aria-label': 'Hide characters without alerts' }}/>
    <Box>
      <Typography variant="body2" fontWeight={500}>Hide characters without alerts</Typography>
      <Typography variant="caption" color="text.secondary">Saved in this browser, not in your exported config</Typography>
    </Box>
  </Stack> : null;

  const pane = query
    ? <SearchResults results={results.filter(({ tracker }) => matchesFilter(tracker, filter))} query={query} onAction={onAction} onShow={showResult}/>
    : <SectionPane section={section} filter={filter} expanded={expanded}
                   onToggleExpanded={(path) => setExpanded((prev) => ({ ...prev, [path]: !prev[path] }))}
                   target={highlight} onAction={onAction} onBulk={onBulk} onShowAll={() => setFilter('all')}
                   extraTop={hideAlertlessRow}/>;

  const nav = <SettingsNav model={model} tabIndex={tabIndex} onTabChange={changeTab} sectionKey={section.key}
                           onSectionChange={changeSection} onTrackerJump={jumpTo}/>;

  return <>
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" fullScreen={isSm}
            PaperProps={{ sx: { height: { sm: '90vh' } } }}>
      <DialogTitle component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" gap={2}>
          {isSm && mobileDetail && !query
            ? <IconButton aria-label="Back to sections" onClick={() => setMobileDetail(false)}><ArrowBackIcon/></IconButton> : null}
          <Typography variant="h6" component="h1" sx={{ whiteSpace: 'nowrap' }}>Configure alerts</Typography>
          {!isSm ? <Box sx={{ flex: 1, maxWidth: 520 }}>{search}</Box> : null}
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ ml: 'auto' }}>
            <FileUploadButton onFileUpload={handleImport}
                              onInvalidFile={(fileName) => setImportError(`${fileName} isn't an alert config. Nothing was changed. Pick a file made with Export.`)}>
              Import
            </FileUploadButton>
            {isSm ? <IconButton aria-label="Export" onClick={handleExport}><IconFileExport size={18}/></IconButton>
              : <Button onClick={handleExport} startIcon={<IconFileExport size={18}/>} size="small">Export</Button>}
            {!isSm ? <Button size="small" color="inherit" onClick={() => setConfirmReset(true)}>Reset all</Button> : null}
            <IconButton aria-label="Close" onClick={onClose}><CloseIcon/></IconButton>
          </Stack>
        </Stack>
        {isSm ? search : null}
        {chips}
        {importError ? <Alert severity="error" onClose={() => setImportError(null)}>{importError}</Alert> : null}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, display: 'flex', minHeight: 0 }}>
        {isSm
          ? <Box sx={{ p: 1.5, width: '100%', overflowY: 'auto' }}>{query || mobileDetail ? pane : nav}</Box>
          : <>
            <Box sx={{ width: 288, flexShrink: 0, borderRight: 1, borderColor: 'divider', p: 1.5, overflowY: 'auto' }}>{nav}</Box>
            <Box sx={{ flex: 1, minWidth: 0, p: 2.5, overflowY: 'auto' }}>{pane}</Box>
          </>}
      </DialogContent>
    </Dialog>
    <Dialog open={confirmReset} onClose={() => setConfirmReset(false)} PaperProps={{ role: 'alertdialog' }}>
      <DialogTitle>Reset every alert to default?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This turns all {allTrackers(model).length} alerts back to their default and clears your {Object.keys(edits).length} edits. Export first if you want a copy.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
        <Button variant="contained" onClick={() => {
          setConfirmReset(false);
          onBulk('All alerts reset to defaults', 'resetPath', null);
        }}>Reset all</Button>
      </DialogActions>
    </Dialog>
    <Snackbar open={Boolean(undo)} autoHideDuration={6000} onClose={() => setUndo(null)} message={undo?.label}
              ContentProps={{ role: 'status' }}
              action={<Button color="primary" size="small" onClick={() => {
                onChange(undo.previous);
                setUndo(null);
              }}>Undo</Button>}/>
  </>;
};

export default DashboardSettings;

import React, { useContext, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { IconDownload, IconInfoCircle, IconPlus, IconUpload } from '@tabler/icons-react';
import { NextSeo } from 'next-seo';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, downloadFile, prefix, tryToParse } from 'utility/helpers';
import { addEquippedItems, getAllItems } from 'parsers/items';
import Tooltip from 'components/Tooltip';
import StructuredData, { createHowToData } from '@components/common/StructuredData';
import SimpleLoader from '@components/common/SimpleLoader';
import PlanCard from 'components/tools/item-planner/PlanCard';
import AddItemForm from 'components/tools/item-planner/AddItemForm';
import { trackEvent } from 'utility/analytics';
import {
  addItemToPlan,
  addPlan,
  buildPlanView,
  getValidPlannerSections,
  removePlan,
  renamePlan,
  setItemCount
} from 'utility/itemPlanner';

const EMPTY_STATE_SPRITES = ['EquipmentTools16', 'EquipmentPunching11', 'GodshardBar'];
const BUTTON_HEIGHT = { xs: 44, sm: 36 };

const ItemPlanner = () => {
  const { state, dispatch } = useContext(AppContext);
  const sections = getValidPlannerSections(state?.planner);
  // A logged-out visitor still gets a parsed empty account, which owns nothing
  const loggedIn = !state?.emptyAccount && Boolean(state?.characters || state?.account);
  const waiting = Boolean(state?.isLoading) || state?.storageHydrated === false;
  const [showAll, setShowAll] = useState(false);
  // Tools and gear nearly always sit in an equip slot, so leaving them out made gear plans start from scratch
  const [includeEquipped, setIncludeEquipped] = useState(true);
  const [confirm, setConfirm] = useState({ open: false, type: 'plan', index: null });
  const [importError, setImportError] = useState(null);
  const [newestPlan, setNewestPlan] = useState(null);
  const [namingPlan, setNamingPlan] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [undo, setUndo] = useState(null);
  const inputRef = useRef();

  const inventoryItems = loggedIn
    ? [...(getAllItems(state?.characters, state?.account) || []), ...addEquippedItems(state?.characters, includeEquipped)]
    : [];

  const save = (next) => dispatch({ type: 'planner', data: { sections: next } });

  const handleAddItem = (planIndex, itemName, count) => {
    save(addItemToPlan(sections, planIndex, itemName, count));
    trackEvent('planner_item_added', { item_name: itemName });
  };

  const handleSetCount = (planIndex, itemName, count) => {
    save(setItemCount(sections, planIndex, itemName, count));
    if (count <= 0) setUndo({ message: `Removed ${cleanUnderscore(itemName)}`, sections });
  };

  const handleNewPlan = () => {
    setNewestPlan(sections.length);
    setNamingPlan(sections.length);
    save(addPlan(sections, ''));
  };

  const handleStartPlan = (itemName) => {
    setNewestPlan(0);
    save(addItemToPlan(addPlan([], ''), 0, itemName, 1));
    trackEvent('planner_item_added', { item_name: itemName });
  };

  const handleExport = () => {
    if (!sections.length) return;
    downloadFile(JSON.stringify({ ...state?.planner, sections }),
      `it-item-planner-${new Date().toISOString().slice(0, 10)}.json`);
    trackEvent('planner_export', { plan_count: sections.length });
  };

  const handleFileChange = async (event) => {
    const fileObject = event.target.files[0];
    // Reset so re-picking the same file fires onChange again
    event.target.value = '';
    if (!fileObject) return;
    const content = tryToParse(await fileObject.text());
    const imported = getValidPlannerSections(content);
    if (!Array.isArray(content?.sections) || (content.sections.length > 0 && imported.length === 0)) {
      setImportError('That file doesn\'t contain item planner plans');
      return;
    }
    if (sections.length) {
      setPendingImport(imported);
      return;
    }
    applyImport(imported);
  };

  const applyImport = (next) => {
    save(next);
    setPendingImport(null);
    trackEvent('planner_import', { plan_count: next.length });
  };

  const confirmDelete = () => {
    save(confirm.type === 'plan' ? removePlan(sections, confirm.index) : []);
    setConfirm({ open: false, type: 'plan', index: null });
  };

  return <>
    <NextSeo
      title="Item Planner | Idleon Toolbox"
      description="Useful tool to keep track of your crafting projects by tracking existing and missing materials"
    />
    <StructuredData data={createHowToData(
      'How to plan item crafting in Legends of Idleon',
      'Use the Item Planner to track crafting projects and see which materials you still need.',
      [
        'Search and select the item you want to craft from the dropdown',
        'Set the desired quantity and the planner will show the full material breakdown',
        'Review which materials you already own and which are still missing',
        'Export or save your crafting plan for future reference'
      ]
    )}/>
    {/* Plans are measured against the save, so they wait for it rather than showing everything missing first */}
    {waiting ? <SimpleLoader message={'Loading your plans...'}/> : <Stack gap={3}>
      <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
        {sections.length ? <>
          <Button variant={'contained'} startIcon={<IconPlus size={18}/>} onClick={handleNewPlan}
                  sx={{ minHeight: BUTTON_HEIGHT }}>
            New plan
          </Button>
          <ToggleButtonGroup size={'small'} exclusive value={showAll ? 'all' : 'needed'}
                             onChange={(_, value) => value && setShowAll(value === 'all')}
                             aria-label={'Materials shown'}>
            <ToggleButton value={'needed'} sx={{ minHeight: BUTTON_HEIGHT, px: 1.75 }}>Still needed</ToggleButton>
            <ToggleButton value={'all'} sx={{ minHeight: BUTTON_HEIGHT, px: 1.75 }}>All materials</ToggleButton>
          </ToggleButtonGroup>
          {loggedIn ? <Stack direction={'row'} alignItems={'center'}>
            <FormControlLabel
              sx={{ mr: 0.5 }}
              control={<Checkbox checked={includeEquipped} onChange={() => setIncludeEquipped(!includeEquipped)}/>}
              label={'Count equipped items'}
            />
            <Tooltip title={'Counts gear your characters are wearing, tools and food in their slots as owned.'}>
              <Box component={'span'} sx={{ display: 'inline-flex', color: 'text.secondary' }}>
                <IconInfoCircle size={18}/>
              </Box>
            </Tooltip>
          </Stack> : null}
        </> : null}
        <Box sx={{ flexGrow: 1 }}/>
        {sections.length ? <Button startIcon={<IconDownload size={18}/>} onClick={handleExport}
                                   sx={{ minHeight: BUTTON_HEIGHT }}>Export</Button> : null}
        <Button startIcon={<IconUpload size={18}/>} onClick={() => inputRef.current.click()}
                sx={{ minHeight: BUTTON_HEIGHT }}>Import</Button>
        <input type="file" ref={inputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileChange}/>
        {sections.length ? <Button color={'inherit'} onClick={() => setConfirm({ open: true, type: 'all', index: null })}
                                   sx={{ minHeight: BUTTON_HEIGHT, color: 'text.secondary' }}>
          Delete all plans
        </Button> : null}
      </Stack>

      {sections.length ? sections.map((plan, index) => <PlanCard
        key={index}
        plan={plan}
        view={buildPlanView({ items: plan.items, inventoryItems, account: state?.account })}
        defaultExpanded={index === 0 || index === newestPlan}
        showAll={showAll}
        onAddItem={(itemName, count) => handleAddItem(index, itemName, count)}
        startRenaming={index === namingPlan}
        onSetCount={(itemName, count) => handleSetCount(index, itemName, count)}
        onRename={(name) => save(renamePlan(sections, index, name))}
        onRemove={() => setConfirm({ open: true, type: 'plan', index })}
      />) : <Card variant={'outlined'} sx={{ px: 3, py: 6 }}>
        <Stack alignItems={'center'} gap={2} sx={{ textAlign: 'center' }}>
          <Stack direction={'row'} gap={1} aria-hidden>
            {EMPTY_STATE_SPRITES.map((rawName) => <Box key={rawName} component={'img'} src={`${prefix}data/${rawName}.png`}
                                                       alt="" sx={{ width: 48, height: 48, objectFit: 'contain' }}/>)}
          </Stack>
          <Typography component={'h2'} variant={'h6'}>Plan your next craft</Typography>
          <Typography variant={'body2'} color={'text.secondary'} sx={{ maxWidth: 460 }}>
            Pick an item and the planner lists every material it needs, checks your storage and characters, and shows
            what you are still short.
          </Typography>
          <Box sx={{ width: '100%', maxWidth: 460, mt: 1 }}>
            <AddItemForm onAdd={handleStartPlan} submitLabel={'Start a plan'} withCount={false}/>
          </Box>
          {!loggedIn ? <Typography variant={'caption'} color={'text.disabled'}>
            Log in to compare against what you own. Plans are saved in this browser.
          </Typography> : null}
        </Stack>
      </Card>}
    </Stack>}

    <Dialog open={confirm.open} onClose={() => setConfirm({ ...confirm, open: false })}
            aria-labelledby="planner-delete-title">
      <DialogTitle id="planner-delete-title">{confirm.type === 'plan' ? 'Delete plan' : 'Delete all plans'}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {confirm.type === 'plan'
            ? `Delete "${sections[confirm.index]?.name}"? This can't be undone.`
            : `Delete all ${sections.length} plans? This can't be undone.`}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirm({ ...confirm, open: false })}>Cancel</Button>
        <Button color={'error'} onClick={confirmDelete} autoFocus>Delete</Button>
      </DialogActions>
    </Dialog>
    <Dialog open={Boolean(pendingImport)} onClose={() => setPendingImport(null)} aria-labelledby="planner-import-title">
      <DialogTitle id="planner-import-title">Import plans</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {`This file has ${pendingImport?.length} plan${pendingImport?.length === 1 ? '' : 's'}. Add them to your ${sections.length} plan${sections.length === 1 ? '' : 's'}, or replace yours with them?`}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setPendingImport(null)}>Cancel</Button>
        <Button color={'error'} onClick={() => applyImport(pendingImport)}>Replace</Button>
        <Button variant={'contained'} onClick={() => applyImport([...sections, ...pendingImport])} autoFocus>
          Add to my plans
        </Button>
      </DialogActions>
    </Dialog>
    <Snackbar
      open={Boolean(undo)}
      autoHideDuration={6000}
      onClose={(_, reason) => reason !== 'clickaway' && setUndo(null)}
      message={undo?.message}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      action={<Button onClick={() => {
        save(undo.sections);
        setUndo(null);
      }}>Undo</Button>}
    />
    <Snackbar
      open={Boolean(importError)}
      autoHideDuration={5000}
      onClose={() => setImportError(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity={'error'} variant="filled" onClose={() => setImportError(null)}>
        {importError}
      </Alert>
    </Snackbar>
  </>;
};

export default ItemPlanner;

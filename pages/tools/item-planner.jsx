import React, { useContext, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
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
import { notify } from '@components/common/Overlays/notify';
import AppDialog from '@components/common/Overlays/AppDialog';
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

const planCount = (count) => `${count} plan${count === 1 ? '' : 's'}`;

const ItemPlanner = () => {
  const { state, dispatch } = useContext(AppContext);
  const sections = getValidPlannerSections(state?.planner);
  // A logged-out visitor still gets a parsed empty account, which owns nothing
  const loggedIn = !state?.emptyAccount && Boolean(state?.characters || state?.account);
  const waiting = Boolean(state?.isLoading) || state?.storageHydrated === false;
  const [showAll, setShowAll] = useState(false);
  // Tools and gear nearly always sit in an equip slot, so leaving them out made gear plans start from scratch
  const [includeEquipped, setIncludeEquipped] = useState(true);
  // A confirm keeps its words while it fades out, so the name and count it shows are stored when it opens
  const [confirm, setConfirm] = useState({ open: false, type: 'plan', index: null, name: '', count: 0 });
  const [newestPlan, setNewestPlan] = useState(null);
  const [namingPlan, setNamingPlan] = useState(null);
  // { plans, current }: the file's plans and how many the player had when it opened
  const [pendingImport, setPendingImport] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState('add');
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
    if (count <= 0) notify(`Removed ${cleanUnderscore(itemName)}`, { undo: () => save(sections) });
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
      notify('That file doesn\'t contain item planner plans');
      return;
    }
    if (sections.length) {
      setPendingImport({ plans: imported, current: sections.length });
      setImportMode('add');
      setImportOpen(true);
      return;
    }
    applyImport(imported);
  };

  const applyImport = (next) => {
    save(next);
    setImportOpen(false);
    trackEvent('planner_import', { plan_count: next.length });
  };

  const askDelete = (type, index = null) => setConfirm({
    open: true, type, index, name: type === 'plan' ? sections[index]?.name ?? '' : '', count: sections.length
  });

  const confirmDelete = () => {
    save(confirm.type === 'plan' ? removePlan(sections, confirm.index) : []);
    setConfirm({ ...confirm, open: false });
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
          {/* Small, as the toggles beside it: one height for the row, 44 on a phone like theirs. */}
          <Button variant={'contained'} size={'small'} startIcon={<IconPlus size={18}/>} onClick={handleNewPlan}
                  sx={{ minHeight: { xs: 44, sm: 32 } }}>
            New plan
          </Button>
          <ToggleButtonGroup size={'small'} exclusive value={showAll ? 'all' : 'needed'}
                             onChange={(_, value) => value && setShowAll(value === 'all')}
                             aria-label={'Materials shown'}>
            <ToggleButton value={'needed'} sx={{ minHeight: { xs: 44, sm: 32 }, px: 1.75 }}>Still needed</ToggleButton>
            <ToggleButton value={'all'} sx={{ minHeight: { xs: 44, sm: 32 }, px: 1.75 }}>All materials</ToggleButton>
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
        {sections.length ? <Button startIcon={<IconDownload size={18}/>} onClick={handleExport}>Export</Button> : null}
        <Button startIcon={<IconUpload size={18}/>} onClick={() => inputRef.current.click()}>Import</Button>
        <input type="file" ref={inputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileChange}/>
        {sections.length ? <Button color={'inherit'} onClick={() => askDelete('all')}
                                   sx={{ color: 'text.secondary' }}>
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
        onRemove={() => askDelete('plan', index)}
      />) : <Card variant={'outlined'} sx={{ px: 3, py: 6 }}>
        <Stack alignItems={'center'} gap={2} sx={{ textAlign: 'center' }}>
          <Stack direction={'row'} gap={1} aria-hidden>
            {EMPTY_STATE_SPRITES.map((rawName) => <Box key={rawName} component={'img'} src={`${prefix}data/${rawName}.png`}
                                                       alt="" sx={{ width: 48, height: 48, objectFit: 'contain' }}/>)}
          </Stack>
          <Typography component={'h2'} variant={'sectionTitle'}>Plan your next craft</Typography>
          <Typography variant={'body2'} color={'text.secondary'} sx={{ maxWidth: 460 }}>
            Pick an item and the planner lists every material it needs, checks your storage and characters, and shows
            what you are still short.
          </Typography>
          <Box sx={{ width: '100%', maxWidth: 460, mt: 1 }}>
            <AddItemForm onAdd={handleStartPlan} submitLabel={'Start a plan'} withCount={false}/>
          </Box>
          {!loggedIn ? <Typography variant={'caption'} color={'text.muted'}>
            Log in to compare against what you own. Plans are saved in this browser.
          </Typography> : null}
        </Stack>
      </Card>}
    </Stack>}

    <AppDialog open={confirm.open} onClose={() => setConfirm({ ...confirm, open: false })} size="s"
               title={confirm.type === 'plan' ? 'Delete this plan?' : 'Delete all plans?'}
               actions={[
                 { label: 'Cancel' },
                 {
                   label: confirm.type === 'plan' ? 'Delete plan' : `Delete ${planCount(confirm.count)}`,
                   main: true, danger: true, onClick: confirmDelete
                 }
               ]}>
      <Typography color="text.secondary">
        {confirm.type === 'plan'
          ? `${confirm.name ? `"${confirm.name}"` : 'This plan'} goes for good.`
          : 'Every plan goes for good.'}
      </Typography>
    </AppDialog>
    <AppDialog open={importOpen} onClose={() => setImportOpen(false)} size="s" title="Import plans"
               actions={[
                 { label: 'Cancel' },
                 {
                   label: `Import ${planCount(pendingImport?.plans.length ?? 0)}`, main: true,
                   onClick: () => applyImport(importMode === 'replace'
                     ? pendingImport.plans
                     : [...sections, ...pendingImport.plans])
                 }
               ]}>
      <RadioGroup value={importMode} onChange={(event) => setImportMode(event.target.value)}>
        <FormControlLabel value="add" control={<Radio size="small"/>}
                          label={`Add to my ${planCount(pendingImport?.current ?? 0)}`}/>
        <FormControlLabel value="replace" control={<Radio size="small"/>}
                          label={`Replace my ${planCount(pendingImport?.current ?? 0)}`}/>
      </RadioGroup>
    </AppDialog>
  </>;
};

export default ItemPlanner;

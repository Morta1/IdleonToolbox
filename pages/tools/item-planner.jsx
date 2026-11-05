import React, { useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography
} from '@mui/material';
import { IconDownload, IconPlus, IconUpload } from '@tabler/icons-react';
import { NextSeo } from 'next-seo';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, downloadFile, formatNum, tryToParse } from 'utility/helpers';
import { addEquippedItems, getAllItems } from 'parsers/items';
import StructuredData, { createHowToData } from '@components/common/StructuredData';
import SimpleLoader from '@components/common/SimpleLoader';
import PlanCard from 'components/tools/item-planner/PlanCard';
import AddItemForm from 'components/tools/item-planner/AddItemForm';
import { trackEvent } from 'utility/analytics';
import { notify } from '@components/common/Overlays/notify';
import AppDialog from '@components/common/Overlays/AppDialog';
import Notice from '@components/common/Notice';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import GameIcon from '@components/common/GameIcon';
import Toolbar from '@components/common/Toolbar';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { cardSurface } from '@components/common/cards/tokens';
import { isSectionFailed, MissingData } from '@components/common/styles';
import { usePageHeaderSlot } from '@components/common/NavBar/PageHeader';
import { headerActionSx } from '@components/common/NavBar/headerAction';
import useToolbarState from '@hooks/useToolbarState';
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

// The page's settings (Page settings in the header row), remembered in this browser.
const PLANNER_SETTINGS = { countEquipped: true };
const PLANNER_TOOLBAR = { show: 'needed' };

const ItemPlanner = () => {
  const { state, dispatch } = useContext(AppContext);
  const sections = getValidPlannerSections(state?.planner);
  // A logged-out visitor still gets a parsed empty account, which owns nothing
  const loggedIn = !state?.emptyAccount && Boolean(state?.characters || state?.account);
  const waiting = Boolean(state?.isLoading) || state?.storageHydrated === false;
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('item-planner', PLANNER_TOOLBAR);
  const showAll = toolbar.show === 'all';
  const storageFailed = isSectionFailed(state?.account, 'storage');
  const headerSlot = usePageHeaderSlot('settings');
  // Tools and gear nearly always sit in an equip slot, so leaving them out made gear plans start from scratch
  const [settings, setSettings, resetSettings] = usePageSettings('item-planner', PLANNER_SETTINGS);
  const includeEquipped = settings.countEquipped;
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
    if (!Array.isArray(content?.sections) || !imported.length) {
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

  // As the goals import does: say what came in, and offer the plans that were there before. added: how many came from
  // the file, where they joined the plans already here.
  const applyImport = (next, added = next.length) => {
    const before = sections;
    save(next);
    setImportOpen(false);
    trackEvent('planner_import', { plan_count: next.length });
    notify(`Imported ${planCount(added)}`, { undo: () => save(before) });
  };

  // A plan's Delete comes from its menu, whose row is gone by the time the dialog closes: focus goes back
  // to the menu's button instead. With no plan left, the empty state's first control takes it.
  const returnFocus = useRef(null);
  const emptyState = useRef(null);
  const askDelete = (type, index = null, trigger = null) => {
    returnFocus.current = trigger;
    setConfirm({
      open: true, type, index, name: type === 'plan' ? sections[index]?.name ?? '' : '', count: sections.length
    });
  };

  const confirmDelete = () => {
    save(confirm.type === 'plan' ? removePlan(sections, confirm.index) : []);
    setConfirm({ ...confirm, open: false });
  };

  const planViews = sections.map((plan) => buildPlanView({ items: plan.items, inventoryItems, account: state?.account }));
  const materialTotal = planViews.reduce((sum, { craftNext, gather }) => sum + craftNext.length + gather.length, 0);
  const materialShort = planViews.reduce((sum, { craftNext, gather }) => sum + craftNext.filter(({ state: row }) => row !== 'ready').length
    + gather.filter(({ state: row }) => row === 'short').length, 0);

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
    {waiting ? <SimpleLoader message={'Loading your plans...'}/> : <>
      {storageFailed ? <MissingData name={state?.account?.failedSections?.includes('*') ? 'your save' : 'Storage'} failed/>
        : !loggedIn ? <Notice tone={'signin'} sx={{ mb: 2 }}>
          Plans compare against what you own once you sign in, and stay saved in this browser.
        </Notice> : null}
      {sections.length ? <PageSummary>
        <StatTile label={'Plans'} value={formatNum(sections.length, 'whole')}/>
        {loggedIn ? <StatTile label={'Equipped items'} value={includeEquipped ? 'Counted as owned' : 'Not counted'}/> : null}
      </PageSummary> : null}
      {/* Before Page settings, which is last on every page. Always mounted, hidden while there are plans: a portal joins
          its slot's end when it mounts, so Import arriving after a last delete would land past the gear. */}
      {headerSlot ? createPortal(<Button startIcon={<IconUpload size={18}/>} onClick={() => inputRef.current.click()}
                                         sx={[headerActionSx, { display: sections.length ? 'none' : undefined, '&:not(:last-child)': { mr: 1 } }]}>Import</Button>, headerSlot) : null}
      {/* In the header row's settings slot (Decision 6) */}
      {loggedIn ? <PageSettings state={settings} defaults={PLANNER_SETTINGS} onChange={setSettings} onReset={resetSettings}>
        <PageSettings.Toggle name={'countEquipped'} label={'Count equipped items'}
                             help={'Counts gear your characters are wearing, tools and food in their slots as owned.'}/>
      </PageSettings> : null}
      <input type="file" ref={inputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileChange}/>
      {sections.length ? <Box>
        <Toolbar state={toolbar} defaults={PLANNER_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                 total={materialTotal} shown={showAll ? materialTotal : materialShort} noun={'materials'}>
          <Toolbar.Show options={[['needed', 'Still needed'], ['all', 'All materials']]}/>
        </Toolbar>
        <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'} sx={{ mb: 2 }}>
          <Button variant={'contained'} startIcon={<IconPlus size={18}/>} onClick={handleNewPlan}>New plan</Button>
          <Box sx={{ flexGrow: 1 }}/>
          <Button startIcon={<IconDownload size={18}/>} onClick={handleExport}>Export</Button>
          <Button startIcon={<IconUpload size={18}/>} onClick={() => inputRef.current.click()}>Import</Button>
          <Button color={'inherit'} onClick={() => askDelete('all')} sx={{ color: 'text.secondary' }}>Delete all plans</Button>
        </Stack>
        <Stack gap={3}>
          {sections.map((plan, index) => <PlanCard
            key={index}
            plan={plan}
            view={planViews[index]}
            defaultExpanded={index === 0 || index === newestPlan}
            showAll={showAll}
            unknown={storageFailed || !loggedIn}
            onAddItem={(itemName, count) => handleAddItem(index, itemName, count)}
            startRenaming={index === namingPlan}
            onSetCount={(itemName, count) => handleSetCount(index, itemName, count)}
            onRename={(name) => save(renamePlan(sections, index, name))}
            onRemove={(trigger) => askDelete('plan', index, trigger)}
          />)}
        </Stack>
      </Box> : <Box ref={emptyState} sx={[(theme) => cardSurface(theme), { px: 3, py: 5 }]}>
        <Stack alignItems={'center'} gap={2} sx={{ textAlign: 'center' }}>
          <Stack direction={'row'} gap={1.5} aria-hidden>
            {EMPTY_STATE_SPRITES.map((rawName) => <GameIcon key={rawName} src={`data/${rawName}.png`} size={40} alt={''}/>)}
          </Stack>
          <Typography component={'h2'} variant={'sectionTitle'}>Plan your next craft</Typography>
          <Typography variant={'body2'} color={'text.secondary'} sx={{ maxWidth: 460 }}>
            Pick an item and the planner lists every material it needs, checks your storage and characters, and shows
            what you are still short.
          </Typography>
          <Box sx={{ width: '100%', maxWidth: 460 }}>
            <AddItemForm onAdd={handleStartPlan} submitLabel={'Start a plan'} withCount={false}/>
          </Box>
        </Stack>
      </Box>}
    </>}

    <AppDialog open={confirm.open} onClose={() => setConfirm({ ...confirm, open: false })} size="s"
               onExited={() => (emptyState.current?.querySelector('input, button') ?? returnFocus.current)?.focus()}
               title={confirm.type === 'plan' ? 'Delete this plan?' : 'Delete all plans?'}
               actions={[
                 { label: 'Cancel' },
                 {
                   label: confirm.type === 'plan' ? 'Delete plan' : `Delete ${planCount(confirm.count)}`,
                   main: true, danger: true, onClick: confirmDelete
                 }
               ]}>
      <Typography variant={'body2'} color="text.secondary">
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
                   onClick: () => (importMode === 'replace'
                     ? applyImport(pendingImport.plans)
                     : applyImport([...sections, ...pendingImport.plans], pendingImport.plans.length))
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

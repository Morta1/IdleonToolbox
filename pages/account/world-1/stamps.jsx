import { Box, IconButton, Stack, Typography, useMediaQuery } from '@mui/material';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, formatNum, getCoinsArray } from '@utility/helpers';
import { formatGame, gameBonusText } from '@utility/gameNotation';
import CoinDisplay from 'components/common/CoinDisplay';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import { NextSeo } from 'next-seo';
import { isRiftBonusUnlocked } from '@parsers/world-4/rift';
import { MissingData, isParseFailed, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import AppDrawer from '@components/common/Overlays/AppDrawer';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import StatusText from '@components/common/StatusText';
import Toolbar from '@components/common/Toolbar';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import useToolbarState from '@hooks/useToolbarState';
import { SCROLL_TARGET_MARGIN } from '@hooks/usePageTop';
import {
  calcStampLevels,
  evaluateStamp,
  getStampBonus,
  getStamps,
  getStampsPerDay,
  MAX_STAMP_REDUCTION,
  unobtainableStamps,
  updateStamps
} from '@parsers/world-1/stamps';
import Link from '@mui/material/Link';
import { useLocalStorage } from '@mantine/hooks';
import Button from '@mui/material/Button';
import { isValid } from 'date-fns';
import useFormatDate from '@hooks/useFormatDate';
import { getExaltedStampBonus } from '@parsers/world-1/stamps';
import { OPT } from '@parsers/accountOptions';
import { openWikiEntity } from '@utility/wiki/item-page';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getCharmBonus } from '@parsers/world-6/sneaking';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { createBreakdown, multiplier as multiplierLine } from '@parsers/breakdown';

// The game's reducer grows by the Hydrogen atom's daily bonus up to 90% (Atom Collider): the what-if steps it can take
const reducerSteps = (account) => {
  const hydrogen = account?.atoms?.atoms?.[0];
  const perDay = (hydrogen?.baseBonus ?? 0) * (hydrogen?.level ?? 0);
  if (!(perDay > 0)) return [0];
  const steps = Array.from({ length: 6 }, (_, index) => index * Math.max(20, perDay)).filter((step) => step <= 90);
  return steps.at(-1) === 90 || steps.length >= 6 ? steps : [...steps, 90];
};

// A stamp's state, the Show menu's options in its order: each stamp has exactly one. 'reduction' can level up now and
// could at the reducer step below too, so its label says it levels up
const STAMP_STATES = [['upgradable', 'Can level up'], ['reduction', 'Can level up at the previous reducer'], ['money', 'Short on coins'],
  ['materials', 'Short on materials'], ['player', 'Over carry capacity'], ['impossible', 'Out of reach'],
  ['equipments', 'Costs gear'], ['level', 'Not found yet']];
const STATE_LABELS = Object.fromEntries(STAMP_STATES);
// The state's word in a stamp's details: the two that level up are ready, a shortfall a problem, the rest a to-do
const STATE_TONES = { upgradable: 'ready', reduction: 'ready', equipments: 'needs', level: 'needs' };
const STAMPS_TOOLBAR = { show: 'all' };
// A stamp's details open beside the grid: at 420 px, the other drawers' width, a 1920 page's last tile column sits half under it.
const DRAWER_WIDTH = 380;
// Beside a side ad the drawer sits over the ad's rail and reaches at most this far into the page, the page at its narrowest
// between two ads: at least 45 px of a tile stays clear, so the grid stays put. Past this the page took the rail's room (a
// blocker, or no ad under 850 px) and the drawer would cover whole columns, so the grid makes room while it's open.
const RAIL_REACH = 65;
const TILE = '[data-stamp]';
const tileOf = (rawName) => document.querySelector(`[data-stamp="${rawName}"]`);
// A tile brought into view stops short of the bar, the band and the Toolbar, and of the anchor ad
const TILE_SCROLL_SX = { [`& ${TILE}`]: { scrollMarginTop: SCROLL_TARGET_MARGIN + 64, scrollMarginBottom: 'calc(16px + var(--nitro-ad-height, 0px))' } };
const STEP_SX = { width: 36, height: 36, border: 1, borderColor: 'outline', borderRadius: '6px', color: 'text.primary' };
// A caption's height, with a thumb's room around it on a coarse pointer
const WIKI_LINK_SX = { position: 'relative', '@media (pointer: coarse)': { '&::before': { content: '""', position: 'absolute', inset: '-12px -4px' } } };

const Stamps = () => {
  const { state } = useContext(AppContext);
  const formatDate = useFormatDate();
  const [levelsSnapshot, setLevelsSnapshot] = useLocalStorage({
    key: 'stamps:levels',
    defaultValue: { snapshotTime: null, levels: {} }
  });
  const stampsFailed = isSectionFailed(state?.account, 'stamps');
  const atomsFailed = isSectionFailed(state?.account, 'atoms');
  const compassFailed = isSectionFailed(state?.account, 'compass');
  const riftFailed = isSectionFailed(state?.account, 'rift');
  // The page also reads the reducer (atoms), the exalted stamps (compass) and the gilded stamps' unlock (rift): one
  // note, naming the first that failed
  const failedName = stampsFailed ? 'Stamps' : atomsFailed ? 'Atom Collider' : compassFailed ? 'Compass'
    : riftFailed ? 'the Rift' : null;
  // A failed section lists every stamp at zero (the parser's catalog with no save), with no state
  const account = stampsFailed && !Object.keys(state?.account?.stamps ?? {}).length
    ? { ...state?.account, stamps: getStamps({}, {}) }
    : state?.account;
  const gildedStamps = isRiftBonusUnlocked(account?.rift, 'Stamp_Mastery')
    ? account?.accountOptions?.[OPT.gildedStamps] ?? 0
    : 0;
  const stampReducer = account?.atoms?.stampReducer ?? 0;
  const steps = reducerSteps(account);
  // gilded follows the account until the player changes it: a default that moves with the save, stored only as an edit
  const stampDefaults = { gilded: gildedStamps > 0, reducer: null, keepGreenstacks: false, bestCarry: false, showGained: true };
  const [settings, setSettings, resetSettings] = usePageSettings('stamps', stampDefaults);
  // A failed section's page has no settings, so a saved reducer prices nothing there
  const reducerSet = !stampsFailed && settings?.reducer !== null && settings?.reducer !== undefined;
  const reducer = reducerSet ? settings.reducer : stampReducer;
  // A failed atoms section leaves the reducer unknown: a material cost at 0% isn't the player's
  const reducerUnknown = atomsFailed && !reducerSet;
  const [view, setView, resetView] = useToolbarState('stamps', STAMPS_TOOLBAR);
  const [picked, setPicked] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [drawerCover, setDrawerCover] = useState(0);
  const gridRef = useRef(null);
  const detailsRef = useRef(null);
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const stampsPerDay = getStampsPerDay(account);
  const localStamps = updateStamps(account, state?.characters, settings?.gilded, reducer, settings?.bestCarry, true);
  const exaltedMulti = getExaltedStampBonus(account);
  const exaltedFailed = atomsFailed || compassFailed;
  const remainingExalted = account?.compass?.remainingExaltedStamps ?? 0;
  const usedExalted = account?.compass?.usedExaltedStamps ?? 0;

  const stateOptions = {
    keepGreenstacks: settings?.keepGreenstacks, steps, reducer, account, characters: state?.characters,
    gilded: settings?.gilded, bestCarry: settings?.bestCarry
  };
  // Each stamp's state by category and index; the failed section's catalog has none, and shows whole
  const states = Object.fromEntries(Object.entries(localStamps ?? {}).map(([category, list]) => [category,
    list.map((stamp) => (stampsFailed || (reducerUnknown && stamp.level >= stamp.maxLevel) ? null
      : stampState(stamp, stamp.level < stamp.maxLevel ? 'money' : 'material', stateOptions)))]));
  const allStates = Object.values(states).flat();
  const counts = Object.fromEntries(STAMP_STATES.map(([key]) => [key, allStates.filter((type) => type === key).length]));
  const show = stampsFailed ? 'all' : view?.show ?? 'all';
  const isShownState = (type) => show === 'all' || type === show;
  const shownCount = allStates.filter(isShownState).length;

  const handleSnapshot = () => {
    const levels = Object.entries(state?.account?.stamps ?? {}).reduce((result, [key, values]) => {
      return {
        ...result,
        [key]: values.map(({ level }) => level)
      }
    }, {})
    setLevelsSnapshot({ levels, snapshotTime: new Date().getTime() });
  }

  const perDayText = `${formatNum(stampsPerDay?.value ?? 0)} per day`;
  const exaltedText = formatNum(1 + (exaltedMulti?.value ?? 0) / 100, 'mult');
  const pricedGilded = Boolean(settings?.gilded) !== stampDefaults.gilded;
  const gildedSub = stampsFailed ? undefined : pricedGilded
    ? settings?.gilded ? 'Priced with gilded stamps' : 'Priced without gilded stamps'
    : `${formatNum(calcStampLevels(account?.stamps) / 100, 'pct')} chance`;

  // The levels a stamp gained since the snapshot, when Show levels gained is on
  const gainedOf = (category, index, level) => {
    const before = levelsSnapshot?.levels?.[category]?.[index];
    return settings?.showGained && !stampsFailed && level > before ? level - before : 0;
  };
  const categories = Object.entries(localStamps ?? {}).map(([category, list]) => {
    const all = list.map((stamp, index) => ({
      ...stamp,
      category,
      state: states[category]?.[index],
      gained: gainedOf(category, index, stamp.level),
      bonus: getStampBonus(account, category, stamp.rawName, stamp.bestCharacter),
      exalted: Boolean(account?.compass?.exaltedStamps?.[category]?.[index])
    }));
    return {
      category,
      levels: list.reduce((sum, { level }) => sum + (level ?? 0), 0),
      all,
      shown: all.filter((stamp) => isShownState(stamp.state))
    };
  });
  // Decision 3 (b): a note per tile could not show the Next levels table's four columns (a tile's note is 260 px), so
  // one drawer shows the picked stamp. It holds that stamp while it slides out, even one a filter just took off the grid.
  // A failed section has no details
  const shownStamps = stampsFailed ? [] : categories.flatMap(({ shown }) => shown);
  const pickedStamp = categories.flatMap(({ all }) => all).find(({ rawName }) => rawName === picked);
  const pickedIndex = shownStamps.findIndex(({ rawName }) => rawName === picked);
  const drawerOpen = detailsOpen && pickedIndex >= 0;
  const clearance = drawerOpen && !isPhone ? drawerCover : 0;
  const detailsContext = {
    keepGreenstacks: settings?.keepGreenstacks, reducer, reducerUnknown, exaltedText: exaltedFailed ? null : exaltedText,
    exaltedMulti: 1 + (exaltedMulti?.value ?? 0) / 100,
    vaultBonus: getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 16),
    charmBonus: getCharmBonus(account, 'Liqorice_Rolle')
  };

  // The fixed drawer's left edge against the grid's right one, read while it's open. The grid's own padding moves neither.
  // A blocker's answer widens the page with no resize, and a resize moves a centred page with no change of width: both listen.
  useEffect(() => {
    const grid = gridRef.current;
    if (!drawerOpen || !grid || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      const reach = grid.getBoundingClientRect().right - (document.documentElement.clientWidth - DRAWER_WIDTH);
      setDrawerCover(reach > RAIL_REACH ? reach : 0);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [drawerOpen]);

  // Making room rewraps the grid, and a tile can leave the screen either way: the picked one stays in view
  useEffect(() => {
    if (picked && !isPhone) tileOf(picked)?.scrollIntoView({ block: 'nearest' });
  }, [clearance, picked, isPhone]);

  // A swapped stamp's details start at their top
  useEffect(() => {
    const body = detailsRef.current?.parentElement;
    if (body) body.scrollTop = 0;
  }, [picked]);

  return (
    (<div>
      <NextSeo
        title="Stamps | Idleon Toolbox"
        description="Track your stamp levels, upgrade costs, and bonus effects across all stamp categories in Legends of Idleon"
      />
      {failedName ? <MissingData name={failedName} failed atZero={stampsFailed}/> : null}
      {/* A failed section's settings would price nothing, and its snapshot would save every level as 0 */}
      {stampsFailed ? null : <PageSettings state={settings} defaults={stampDefaults} onChange={setSettings}
                                           onReset={resetSettings}>
        <PageSettings.Toggle name={'gilded'} label={'Price with gilded stamps'}
                             help={`Costs as if each upgrade uses a gilded stamp.${riftFailed ? '' : ` You have ${formatNum(gildedStamps)}.`}`}/>
        <PageSettings.Number name={'reducer'} label={'Stamp reducer'} defaultValue={stampReducer} min={0} max={MAX_STAMP_REDUCTION}
                             integer
                             help={`Material costs at this reducer.${atomsFailed ? '' : ` Yours is ${formatNum(stampReducer, 'pct')}.`}`}/>
        <PageSettings.Toggle name={'keepGreenstacks'} label={'Keep a greenstack'}
                             help={'A material counts only what you own past 10M, so a greenstack stays.'}/>
        <PageSettings.Toggle name={'bestCarry'} label={'Best carry capacity'}
                             help={'Carry capacity as at its best: Ruck Sack on, Zerg Rushogen off, the VMan talent, the three carry star signs and a Nanochip if you own one.'}/>
        <PageSettings.Toggle name={'showGained'} label={'Show levels gained'}
                             help={'Each stamp that levelled since your snapshot shows how many levels.'}/>
        <Stack gap={0.5}>
          <Button variant={'text'} onClick={handleSnapshot} sx={{ alignSelf: 'flex-start' }}>Save levels snapshot</Button>
          <Typography variant={'caption'} color={'text.secondary'}>
            {isValid(levelsSnapshot?.snapshotTime) ? `Saved ${formatDate(levelsSnapshot.snapshotTime)}` : 'No snapshot yet'}
          </Typography>
        </Stack>
      </PageSettings>}
      <PageSummary>
        <StatTile label={'Gilded stamps'} icon={'data/GildedStamp.png'} value={riftFailed ? '-' : formatNum(gildedStamps)}
                  sub={gildedSub}/>
        <StatTile label={'No Stamp Left Behind'} value={perDayText} failed={isParseFailed(state?.account)}
                  breakdown={stampsPerDay?.breakdown ? { ...stampsPerDay.breakdown, totalValue: perDayText } : undefined}
                  breakdownTitle={'No Stamp Left Behind'}/>
        <StatTile label={'Exalted multi'} value={exaltedFailed ? '-' : exaltedText}
                  breakdown={!exaltedFailed && exaltedMulti?.breakdown ? { ...exaltedMulti.breakdown, totalValue: exaltedText } : undefined}
                  breakdownTitle={'Exalted multi'}/>
        {/* No sprite: Hydrogen's Atom0 reads as a dot at a tile's size */}
        <StatTile label={'Stamp reducer'}
                  value={atomsFailed && !reducerSet ? '-' : formatNum(reducer, 'pct')}
                  sub={reducerSet && !atomsFailed ? `Yours is ${formatNum(stampReducer, 'pct')}` : undefined}/>
        <StatTile label={'Exalted stamps'} icon={'etc/Exalted_Stamp_Frame.png'}
                  value={compassFailed ? '-' : `${formatNum(remainingExalted)} / ${formatNum(remainingExalted + usedExalted)}`}/>
      </PageSummary>
      <Box>
        {stampsFailed ? null : <Toolbar state={view} defaults={STAMPS_TOOLBAR} onChange={setView} onReset={resetView}
                                        total={allStates.length} shown={shownCount} noun={'stamps'}>
          {/* A phone's row holds the Lead and the Filters button; from 600 px it stands beside the Show field */}
          {shownCount ? <Toolbar.Lead><PickLine sx={{ display: { xs: 'flex', sm: 'none' }, order: 1 }}/></Toolbar.Lead> : null}
          <Toolbar.Show options={[['all', 'All stamps', allStates.length], ...STAMP_STATES.map(([key, label]) => [key, label, counts[key],
            key === 'impossible' ? `An out of reach stamp costs more than your best carry capacity even at the ${MAX_STAMP_REDUCTION}% reducer cap, so no reducer unlocks it. Being short on the material itself is Short on materials.` : undefined])]}/>
          {shownCount ? <PickLine sx={{ display: 'flex' }}/> : null}
        </Toolbar>}
        <Stack ref={gridRef} gap={2} sx={[TILE_SCROLL_SX, clearance > 0 && { pr: `${clearance}px` }]}>
          {categories.map(({ category, levels, shown }) => {
            // A category with no stamp in the picked state draws no Panel over nothing
            if (!shown.length) return null;
            return <Panel key={category} title={category.capitalize()} meta={stampsFailed ? '-' : `${formatNum(levels)} levels`}>
              {/* 8 px on a phone, so four tiles fit its 336 px Panel */}
              <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
                <CardGrid size={'icon'}>
                  {shown.map((stamp) => stampTile(stamp, {
                    failed: stampsFailed,
                    selected: drawerOpen && stamp.rawName === picked,
                    onSelect: stampsFailed ? undefined : () => {
                      setPicked(stamp.rawName);
                      setDetailsOpen(true);
                    }
                  }))}
                </CardGrid>
              </Box>
            </Panel>;
          })}
        </Stack>
      </Box>
      {stampsFailed ? null : <AppDrawer open={drawerOpen} onClose={() => setDetailsOpen(false)} width={DRAWER_WIDTH} keepOpenOn={TILE}
                                        focusBack={() => tileOf(picked)}
                                        title={pickedStamp ? cleanUnderscore(pickedStamp.displayName) : ''}
                                        icon={pickedStamp ? <GameIcon src={`data/${pickedStamp.rawName}.png`} size={isPhone ? 24 : 32} alt={''}
                                                                      frame={pickedStamp.exalted ? 'etc/Exalted_Stamp_Frame.png' : undefined}/> : null}
                                        subtitle={pickedStamp ? <>
                                          {pickedStamp.maxLevel > 0 ? `${formatNum(pickedStamp.level, 'level', { max: pickedStamp.maxLevel })} · ` : null}
                                          <Link component={'button'} variant={'caption'} onClick={() => openWikiEntity(`item:${pickedStamp.rawName}`)} sx={WIKI_LINK_SX}>Wiki page ›</Link>
                                        </> : null}
                                        controls={<Stack direction={'row'} gap={0.5} sx={{ display: { xs: 'flex', sm: 'none' } }}>
                                          <IconButton aria-label={'Previous stamp'} disabled={pickedIndex <= 0} sx={STEP_SX}
                                                      onClick={() => setPicked(shownStamps[pickedIndex - 1].rawName)}>
                                            <IconChevronLeft size={18}/>
                                          </IconButton>
                                          <IconButton aria-label={'Next stamp'} disabled={pickedIndex < 0 || pickedIndex >= shownStamps.length - 1} sx={STEP_SX}
                                                      onClick={() => setPicked(shownStamps[pickedIndex + 1].rawName)}>
                                            <IconChevronRight size={18}/>
                                          </IconButton>
                                        </Stack>}>
        {pickedStamp ? <Box ref={detailsRef} sx={{ display: 'grid', gap: 1.5, px: 3, pb: 3 }}>{stampDetails(pickedStamp, detailsContext)}</Box> : null}
      </AppDrawer>}
    </div>)
  );
};

// Nothing shows until a tile is picked, so the Toolbar says how
const PickLine = ({ sx }) => <Typography variant={'body2'} color={'text.secondary'} component={'div'}
                                         sx={[{ alignItems: 'center', minHeight: { xs: 44, sm: 40 } }, sx]}>
  Pick a stamp to see its details
</Typography>;

// A stamp as a tile (Decision 3): its level, the exalted frame, grey until found, the triangle while it can level up (at
// the reducer in use or the step below), and the levels gained since the snapshot as a count, which wins over it.
// A tap picks it for the details drawer, which it keeps open and swaps
const stampTile = (stamp, { failed, selected, onSelect }) => <IconTile
  key={stamp.rawName}
  icon={`data/${stamp.rawName}.png`}
  alt={cleanUnderscore(stamp.displayName)}
  value={formatNum(stamp.level)}
  frame={stamp.exalted ? 'etc/Exalted_Stamp_Frame.png' : undefined}
  status={failed || stamp.level > 0 ? undefined : 'missing'}
  badge={stamp.gained > 0 ? `+${formatNum(stamp.gained)}` : STATE_TONES[stamp.state] === 'ready' ? 'up' : undefined}
  selected={selected}
  onSelect={onSelect}
  buttonProps={{ 'data-stamp': stamp.rawName }}/>;

// What a stamp costs to carry at the reducer in use: the smallest reducer that fits it, or none up to the cap
const reducerLine = (minReduction, reducer) => {
  if (!minReduction) return null;
  const { reduction } = minReduction;
  if (reduction == null) return `Over your carry capacity even at a ${MAX_STAMP_REDUCTION}% reducer`;
  if (reduction <= 0) return null;
  return reduction > reducer ? `Needs a ${formatNum(reduction, 'pct')} reducer to carry` : `Carries from a ${formatNum(reduction, 'pct')} reducer`;
};

// Every factor a stamp's bonus holds beside its base, as getStampBonus multiplies them (the game's StampBonusOfTypeX):
// the lab's doubler and the Liqorice Rolle charm on combat and skill stamps, Stamp Bonanza on the four base stats,
// the exalted multi. A factor fed by a failed section has no value
const BASE_STATS = ['BaseDmg', 'BaseHP', 'BaseAcc', 'BaseDef'];
const stampBoosts = ({ category, multiplier, stat, exalted }, { exaltedMulti, exaltedText, vaultBonus, charmBonus }) => [
  category !== 'misc' && multiplier > 1 ? { name: 'Certified Stamp Book', value: multiplier } : null,
  BASE_STATS.includes(stat) && vaultBonus > 0 ? { name: 'Stamp Bonanza', value: 1 + vaultBonus / 100 } : null,
  category !== 'misc' && charmBonus > 0 ? { name: 'Liqorice Rolle', value: 1 + charmBonus / 100 } : null,
  exalted ? { name: 'Exalted Stamps', value: exaltedText ? exaltedMulti : null } : null
].filter(Boolean);

// Up to two factors read as words; more open as a breakdown from their product, each factor named on the line
const boostLine = (boosts, stampName) => {
  const known = boosts.every(({ value }) => value != null);
  if (boosts.length <= 2 || !known) {
    return boosts.map(({ name, value }) => (value != null ? `${formatNum(value, 'mult')} from ${name}` : name)).join(', ');
  }
  const productText = formatNum(boosts.reduce((product, { value }) => product * value, 1), 'mult');
  const names = boosts.map(({ name }) => name);
  return <>
    <Breakdown asValue title={`${stampName} boosts`}
               data={createBreakdown(`${stampName} boosts`, productText, boosts.map(({ name, value }) => multiplierLine(name, value)))}>
      {productText}
    </Breakdown>
    {` from ${names.slice(0, -1).join(', ')} and ${names.at(-1)}`}
  </>;
};

// The picked stamp's details, under its name: its sentence filled as the game fills it, its state in words, what the
// next level costs against what you own, the next levels' costs and each top character's carry capacity
const stampDetails = (stamp, { keepGreenstacks, reducer, reducerUnknown, exaltedText, exaltedMulti, vaultBonus, charmBonus }) => {
  const {
    displayName, level, maxLevel, effect, bonus, gained, state: type, goldCost, materialCost,
    futureCosts, bestCharacter, ownedMats, greenStackOwnedMats, hasMoney, itemReq, minReduction
  } = stamp;
  // Below the max level a level costs coins; at it, raising the max costs the material
  const atMax = level >= maxLevel;
  const owned = (keepGreenstacks ? greenStackOwnedMats : ownedMats) ?? 0;
  const boosts = level > 0 ? stampBoosts(stamp, { exaltedMulti, exaltedText, vaultBonus, charmBonus }) : [];
  const costUnknown = atMax && reducerUnknown;
  const reducerText = level > 0 && atMax && !costUnknown ? reducerLine(minReduction, reducer) : null;
  return <>
    <Stack gap={1}>
      <Typography variant={'body2'} component={'div'}>
        {`+${cleanUnderscore((effect ?? '').replace('+{', gameBonusText(bonus)))}`}</Typography>
      {boosts.length ? <Typography variant={'body2'} color={'text.secondary'} component={'div'}>
        {boostLine(boosts, cleanUnderscore(displayName))}</Typography> : null}
      {unobtainableStamps[displayName] ? <StatusText status={'locked'}>Unobtainable</StatusText> : null}
      {type ? <StatusText status={STATE_TONES[type] ?? 'problem'} wrap>{STATE_LABELS[type]}</StatusText> : null}
    </Stack>
    {level > 0 ? <ItemCard.Section label={atMax ? 'Raise the max level' : 'Next level'}>
      {costUnknown ? '-' : atMax
        ? <ItemCard.Cost icon={`data/${itemReq?.rawName}.png`} iconAlt={cleanUnderscore(itemReq?.name ?? '')}
                         need={materialCost} have={owned}/>
        : <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
          <Typography variant={'body2'} component={'span'}>
            <CoinDisplay dense maxCoins={3} money={getCoinsArray(goldCost)}/>
          </Typography>
          {hasMoney ? null : <StatusText status={'problem'}>Short</StatusText>}
        </Stack>}
      {reducerText ? <Typography variant={'body2'} color={'text.secondary'} component={'div'}>{reducerText}</Typography> : null}
    </ItemCard.Section> : null}
    {level > 0 && futureCosts?.length && !costUnknown ? <ItemCard.Section label={'Next levels'}>
      <FutureCosts futureCosts={futureCosts}/>
    </ItemCard.Section> : null}
    {level > 0 ? <ItemCard.Section label={'Carry capacity'}>
      <ItemCard.Facts rows={[
        ...(bestCharacter?.topCharacters ?? []).map(({ character, maxCapacity }) => [character,
          costUnknown || maxCapacity >= materialCost ? formatNum(maxCapacity ?? 0, 'whole')
            : <>{formatNum(maxCapacity ?? 0, 'whole')} <StatusText status={'problem'}>Short</StatusText></>]),
        ['In storage', formatNum(owned, 'whole')],
        gained > 0 ? ['Levels gained since your snapshot', formatNum(gained)] : null
      ]}/>
    </ItemCard.Section> : null}
  </>;
};

// Absent entirely when a caller skipped the calculation, versus present with a null reduction,
// which is the real "no reducer value fits this in carry capacity" answer.
const isOutOfReach = (minReduction) => Boolean(minReduction) && minReduction.reduction == null;

// One of STAMP_STATES for a stamp; mode is 'money' below its max level, 'material' at it.
const stampState = (stamp, mode, { keepGreenstacks, steps, reducer, account, characters, gilded, bestCarry }) => {
  const { materials, level, hasMoney, hasMaterials, greenStackHasMaterials, enoughPlayerStorage, minReduction } = stamp;
  if (level <= 0) return 'level';
  if (!hasMoney && mode === 'money') return 'money';
  // Out of reach outranks everything below, gear cost included: no reducer value fits the cost in
  // carry capacity, so nothing about the cost's shape is actionable yet. Stored materials are
  // deliberately not part of it: a material shortage is 'materials'.
  if (mode === 'material' && isOutOfReach(minReduction)) return 'impossible';
  // Equipment cost before every remaining material state: the parser only fills `materials` when the
  // required item is gear (isEquipmentItem), and that gate outranks how many sub-materials happen to
  // be on hand.
  if (materials?.length > 0) return 'equipments';
  if (!enoughPlayerStorage && mode === 'material') return 'player';
  if (mode === 'material' && (!hasMaterials || (keepGreenstacks && !greenStackHasMaterials))) return 'materials';
  if (!hasMoney) return 'money';
  // The step below the reducer in use: a typed reducer between two steps still has one before it
  const previous = steps.filter((step) => step < reducer).at(-1);
  const atPrevious = reducer !== 0 && previous !== undefined
    ? evaluateStamp(stamp, account, characters, gilded, previous, bestCarry)
    : null;
  if (atPrevious?.materials?.length === 0 && ((atPrevious?.hasMaterials && atPrevious?.enoughPlayerStorage) || mode === 'money')
    && atPrevious?.hasMoney) {
    return 'reduction';
  }
  return 'upgradable';
};

// The next levels' costs: every row pays the same material, so its sprite heads the column, named by its alt (the
// four columns fit a 384 phone's details only without the word)
const FutureCosts = ({ futureCosts }) => <DataTable
  fits
  rows={futureCosts}
  rowKey={'level'}
  columns={[
    { key: 'level', label: 'Level', value: ({ level }) => level },
    {
      key: 'material',
      label: <GameIcon src={`data/${futureCosts[0]?.rawName}.png`} alt={cleanUnderscore(futureCosts[0]?.name ?? 'Material')}
                       size={16}/>,
      numeric: true,
      render: ({ materialCost }) => (materialCost ? formatGame(materialCost, 'Big', { whole: true }) : null)
    },
    {
      key: 'coins',
      label: 'Coins',
      numeric: true,
      render: ({ goldCost }) => <CoinDisplay dense maxCoins={3} money={getCoinsArray(goldCost)}/>
    },
    { key: 'reduction', label: 'Reducer', numeric: true, render: ({ reduction }) => (reduction >= 0 ? formatNum(reduction, 'pct') : null) }
  ]}
/>;

export default Stamps;

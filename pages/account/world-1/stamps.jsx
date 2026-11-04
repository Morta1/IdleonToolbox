import { Box, Stack, Typography } from '@mui/material';
import React, { useContext, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, formatNum, getCoinsArray } from '@utility/helpers';
import { formatGame, gameBonusText } from '@utility/gameNotation';
import CoinDisplay from 'components/common/CoinDisplay';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import { NextSeo } from 'next-seo';
import { isRiftBonusUnlocked } from '@parsers/world-4/rift';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import StatusText from '@components/common/StatusText';
import Toolbar from '@components/common/Toolbar';
import InfoButton from '@components/common/InfoButton';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import useToolbarState from '@hooks/useToolbarState';
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
  const [view, setView, resetView] = useToolbarState('stamps', STAMPS_TOOLBAR);
  const [picked, setPicked] = useState(null);
  // The details Panel pins under the Toolbar, so a stamp picked far down the grid shows its details in view
  const [stickyTop, setStickyTop] = useState(0);
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
    list.map((stamp) => (stampsFailed ? null : stampState(stamp, stamp.level < stamp.maxLevel ? 'money' : 'material', stateOptions)))]));
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
  const categories = Object.entries(localStamps ?? {}).map(([category, list]) => ({
    category,
    levels: list.reduce((sum, { level }) => sum + (level ?? 0), 0),
    shown: list.map((stamp, index) => ({
      ...stamp,
      category,
      state: states[category]?.[index],
      gained: gainedOf(category, index, stamp.level),
      bonus: getStampBonus(account, category, stamp.rawName, stamp.bestCharacter),
      exalted: Boolean(account?.compass?.exaltedStamps?.[category]?.[index])
    })).filter((stamp) => isShownState(stamp.state))
  }));
  // Decision 3 (b): a note per tile could not show the Next levels table's four columns (a tile's note is 260 px), so
  // one Panel shows the picked stamp (the first one shown until a tile is picked). A failed section has no details
  const shownStamps = stampsFailed ? [] : categories.flatMap(({ shown }) => shown);
  const pickedStamp = shownStamps.find(({ rawName }) => rawName === picked) ?? shownStamps[0];
  const detailsContext = {
    keepGreenstacks: settings?.keepGreenstacks, reducer, exaltedText: exaltedFailed ? null : exaltedText,
    exaltedMulti: 1 + (exaltedMulti?.value ?? 0) / 100,
    vaultBonus: getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 16),
    charmBonus: getCharmBonus(account, 'Liqorice_Rolle')
  };

  return (
    (<div>
      <NextSeo
        title="Stamps | Idleon Toolbox"
        description="Track your stamp levels, upgrade costs, and bonus effects across all stamp categories in Legends of Idleon"
      />
      {failedName ? <MissingData name={failedName} failed/> : null}
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
        <StatTile label={'No Stamp Left Behind'} value={perDayText}
                  breakdown={stampsPerDay?.breakdown ? { ...stampsPerDay.breakdown, totalValue: perDayText } : undefined}
                  breakdownTitle={'No Stamp Left Behind'}/>
        <StatTile label={'Exalted multi'} value={exaltedFailed ? '-' : exaltedText}
                  breakdown={!exaltedFailed && exaltedMulti?.breakdown ? { ...exaltedMulti.breakdown, totalValue: exaltedText } : undefined}
                  breakdownTitle={'Exalted multi'}/>
        <StatTile label={'Stamp reducer'} icon={'data/Atom0.png'}
                  value={atomsFailed && !reducerSet ? '-' : formatNum(reducer, 'pct')}
                  sub={reducerSet && !atomsFailed ? `Yours is ${formatNum(stampReducer, 'pct')}` : undefined}/>
        <StatTile label={'Exalted stamps'} icon={'etc/Exalted_Stamp_Frame.png'}
                  value={compassFailed ? '-' : `${formatNum(remainingExalted)} / ${formatNum(remainingExalted + usedExalted)}`}/>
      </PageSummary>
      <Box>
        {stampsFailed ? null : <Toolbar state={view} defaults={STAMPS_TOOLBAR} onChange={setView} onReset={resetView}
                                        total={allStates.length} shown={shownCount} noun={'stamps'}
                                        onStickyBottom={setStickyTop}>
          <Toolbar.Lead>
            <Box sx={{ display: 'flex', alignItems: 'center', height: 40 }}>
              <InfoButton label={'Out of reach'}>{`An out of reach stamp costs more than your best carry capacity even at the ${MAX_STAMP_REDUCTION}% reducer cap, so no reducer unlocks it. Being short on the material itself is Short on materials.`}</InfoButton>
            </Box>
          </Toolbar.Lead>
          <Toolbar.Show options={[['all', 'All stamps', allStates.length], ...STAMP_STATES.map(([key, label]) => [key, label, counts[key]])]}/>
        </Toolbar>}
        {pickedStamp ? <Panel icon={<GameIcon src={`data/${pickedStamp.rawName}.png`} size={24} alt={''}
                                              frame={pickedStamp.exalted ? 'etc/Exalted_Stamp_Frame.png' : undefined}/>}
                              title={cleanUnderscore(pickedStamp.displayName)}
                              meta={pickedStamp.maxLevel > 0 ? formatNum(pickedStamp.level, 'level', { max: pickedStamp.maxLevel }) : undefined}
                              aside={<Link component={'button'} onClick={() => openWikiEntity(`item:${pickedStamp.rawName}`)}
                                           sx={{ font: 'inherit' }}>Wiki page</Link>}
                              sx={{
                                // Below 600 px the band, the Toolbar and a pinned Panel left the grid half the screen:
                                // a picked tile shows its details as its note there instead
                                display: { xs: 'none', sm: 'block' },
                                mb: 2, position: 'sticky', top: stickyTop, zIndex: (theme) => theme.zIndex.appBar - 2
                              }}>
          {stampDetails(pickedStamp, detailsContext)}
        </Panel> : null}
        <Stack gap={2}>
          {categories.map(({ category, levels, shown }) => {
            // A category with no stamp in the picked state draws no Panel over nothing
            if (!shown.length) return null;
            return <Panel key={category} title={category.capitalize()} meta={`${formatNum(levels)} levels`}>
              {/* 8 px on a phone, so four tiles fit its 336 px Panel */}
              <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
                <CardGrid size={'icon'}>
                  {shown.map((stamp) => stampTile(stamp, {
                    failed: stampsFailed,
                    selected: stamp.rawName === pickedStamp?.rawName,
                    onSelect: stampsFailed ? undefined : () => setPicked(stamp.rawName),
                    phoneDetails: stampsFailed ? undefined : stampNote(stamp, detailsContext)
                  }))}
                </CardGrid>
              </Box>
            </Panel>;
          })}
        </Stack>
      </Box>
    </div>)
  );
};

// A stamp as a tile (Decision 3): its level, the exalted frame, grey until found, the ▲ while it can level up (at
// the reducer in use or the step below), and the levels gained since the snapshot as a count, which wins over the ▲.
// A tap picks it for the details Panel, or below 600 px pins its details as its note
const stampTile = (stamp, { failed, selected, onSelect, phoneDetails }) => <IconTile
  key={stamp.rawName}
  icon={`data/${stamp.rawName}.png`}
  alt={cleanUnderscore(stamp.displayName)}
  value={formatNum(stamp.level)}
  frame={stamp.exalted ? 'etc/Exalted_Stamp_Frame.png' : undefined}
  status={failed || stamp.level > 0 ? undefined : 'missing'}
  badge={stamp.gained > 0 ? `+${formatNum(stamp.gained)}` : STATE_TONES[stamp.state] === 'ready' ? 'up' : undefined}
  selected={selected}
  onSelect={onSelect}
  phoneDetails={phoneDetails}/>;

// The details as a phone's note: the Panel's name, level and wiki link over the same details
const stampNote = (stamp, context) => <Stack gap={1}>
  <Stack direction={'row'} alignItems={'baseline'} justifyContent={'space-between'} gap={1}>
    <Typography variant={'body2'} component={'div'} sx={{ color: 'text.primary', fontWeight: 500 }}>
      {`${cleanUnderscore(stamp.displayName)}${stamp.maxLevel > 0 ? `, ${formatNum(stamp.level, 'level', { max: stamp.maxLevel })}` : ''}`}
    </Typography>
    <Link component={'button'} onClick={() => openWikiEntity(`item:${stamp.rawName}`)} sx={{ font: 'inherit', flexShrink: 0 }}>
      Wiki page</Link>
  </Stack>
  {stampDetails(stamp, context, true)}
</Stack>;

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
const stampDetails = (stamp, { keepGreenstacks, reducer, exaltedText, exaltedMulti, vaultBonus, charmBonus }, inNote) => {
  const {
    displayName, level, maxLevel, effect, bonus, gained, state: type, goldCost, materialCost,
    futureCosts, bestCharacter, ownedMats, greenStackOwnedMats, hasMoney, itemReq, minReduction
  } = stamp;
  // Below the max level a level costs coins; at it, raising the max costs the material
  const atMax = level >= maxLevel;
  const owned = (keepGreenstacks ? greenStackOwnedMats : ownedMats) ?? 0;
  const boosts = level > 0 ? stampBoosts(stamp, { exaltedMulti, exaltedText, vaultBonus, charmBonus }) : [];
  const reducerText = level > 0 && atMax ? reducerLine(minReduction, reducer) : null;
  return <Box sx={inNote ? { display: 'grid', gap: 2, maxHeight: '30vh', overflowY: 'auto' } : {
    display: 'grid',
    gap: 2,
    p: { xs: 1.5, sm: 2 },
    alignItems: 'start',
    // The table takes its own width beside the two text columns
    gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) auto minmax(0, 1fr)' },
    // A narrow window keeps the grid in view under the pinned details: their body scrolls inside
    maxHeight: { xs: '30vh', md: 'none' },
    overflowY: { xs: 'auto', md: 'visible' }
  }}>
    <Stack gap={1}>
      <Typography variant={'body2'} component={'div'}>
        {`+${cleanUnderscore((effect ?? '').replace('+{', gameBonusText(bonus, stamp, 'stamp')))}`}</Typography>
      {boosts.length ? <Typography variant={'body2'} color={'text.secondary'} component={'div'}>
        {boostLine(boosts, cleanUnderscore(displayName))}</Typography> : null}
      {unobtainableStamps[displayName] ? <StatusText status={'locked'}>Unobtainable</StatusText> : null}
      {type ? <StatusText status={STATE_TONES[type] ?? 'problem'} wrap>{STATE_LABELS[type]}</StatusText> : null}
      {level > 0 ? <ItemCard.Section label={atMax ? 'Raise the max level' : 'Next level'}>
        {atMax
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
    </Stack>
    {level > 0 && futureCosts?.length ? <ItemCard.Section label={'Next levels'}>
      <FutureCosts futureCosts={futureCosts}/>
    </ItemCard.Section> : null}
    {level > 0 ? <ItemCard.Section label={'Carry capacity'}>
      <ItemCard.Facts rows={[
        ...(bestCharacter?.topCharacters ?? []).map(({ character, maxCapacity }) => [character,
          maxCapacity >= materialCost ? formatNum(maxCapacity ?? 0)
            : <>{formatNum(maxCapacity ?? 0)} <StatusText status={'problem'}>Short</StatusText></>]),
        ['In storage', formatNum(owned)],
        gained > 0 ? ['Levels gained since your snapshot', formatNum(gained)] : null
      ]}/>
    </ItemCard.Section> : null}
  </Box>;
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
      render: ({ materialCost }) => (materialCost ? formatGame(materialCost, 'Big') : null)
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

import React, { useState } from 'react';
import {
  calcMealTime,
  calcTimeToNextLevel,
  getHighestOverflowingLadle,
  formatMealBonus,
  getMealBonus,
  getMealLevelCost,
  getNoMealLeftBehindLevels,
  getNoMealLeftBehindQueue,
  getRibbonBonus,
  NO_MEAL_LEFT_BEHIND_MIN_LEVEL
} from '@parsers/world-4/cooking';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { Box, Button, FormControlLabel, Slider, Stack, Switch, Typography } from '@mui/material';
import { useLocalStorage } from '@mantine/hooks';
import NumberField from '@components/common/NumberField';
import { getJewelBonus, getLabBonus } from '@parsers/world-4/lab';
import MealIcon from 'components/common/MealIcon';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import StatTile from '@components/common/cards/StatTile';
import Panel from '@components/common/cards/Panel';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { usePageSettings } from '@components/common/PageSettings';
import InfoButton, { NoteTrigger } from '@components/common/InfoButton';
import Notice from '@components/common/Notice';
import StatusText from '@components/common/StatusText';
import GameIcon from '@components/common/GameIcon';
import Num, { Duration } from '@components/common/Num';

const BREAKPOINT_LEVELS = [11, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200];
const MEALS_TOOLBAR = { sort: null, hideCapped: false, view: 'cards' };
// The settings that change the meal numbers, for this tab only (remembered, never in the gear)
const MEALS_SETTINGS = { overflow: false, amethyst: false, foodLust: null, procs: 15, bookOrder: false };
const SORTS = [['time', 'Time to next level', 'asc'], ['nmlb', 'No Meal Left Behind', 'asc'], ['ribbon', 'Ribbon rank', 'asc'],
  ...BREAKPOINT_LEVELS.map((level) => [`lv${level}`, `Time to Lv ${level}`, 'asc'])];
const AMETHYST_RHINESTONE = 4.5;

// The level a sort measures against: a breakpoint, or 0 for the next level
const sortTarget = (key) => (key?.startsWith('lv') ? Number(key.slice(2)) : 0);
const entryFor = (meal, target) => (target > 0
  ? meal?.breakpointTimes?.find(({ bpLevel }) => bpLevel === target)
  : meal?.breakpointTimes?.[0]);
// A time is stored as the string '0' once the amount covers the cost: a number for every test
const hoursOf = (entry) => Number(entry?.timeToBp);
const timeText = (hours) => {
  const value = Number(hours);
  return Number.isFinite(value) ? <Duration seconds={value * 3600}/> : 'Never';
};
// A meal sentence's own fill, its sign and unit included: "+{%_Total_Damage" at 3814 reads "+3,814%"
const mealFill = (effect, value) => effect?.replace('{', formatMealBonus(value)).split('_')[0];
// A short number whose exact digits open on a tap, when they differ from it
const exactNote = (short, exact) => short === exact ? short : <NoteTrigger note={exact}>{short}</NoteTrigger>;
// A Facts label led by its sprite: inline, so the row's baseline stays the words'
const iconLabel = (key, src, text) => <Box key={key} component={'span'} sx={{ '& > :first-of-type': { mr: 1 } }}>
  <GameIcon src={src} size={24} alt={''}/>{text}
</Box>;

// No Meal Left Behind levels the lowest meal it can, the one furthest down the book on a tie
const nmlbOrder = (meals, mealMaxLevel) => (meals ?? [])
  .filter((meal) => meal?.level >= NO_MEAL_LEFT_BEHIND_MIN_LEVEL && meal?.level < mealMaxLevel)
  .toSorted((a, b) => (a.level === b.level ? b.index - a.index : a.level - b.level));

// Ladles and hours are the same number (1 ladle = 1 hour of cook time): the rows under a time
const ladleRows = (hours, singleKitchenMulti) => {
  const ladles = Number(hours);
  if (!Number.isFinite(ladles)) return [['Ladles', '-']];
  const fastest = Math.ceil(ladles * singleKitchenMulti?.fastest);
  const slowest = Math.ceil(ladles * singleKitchenMulti?.slowest);
  const single = ladles > 0 && Number.isFinite(fastest) && Number.isFinite(slowest);
  return [
    ['Ladles', exactNote(formatNum(Math.ceil(ladles)), formatNum(ladles, 'exact'))],
    single ? [<Box key={'single'} component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      1 kitchen
      <InfoButton label={'1 kitchen'}>Ladles needed if only one kitchen cooks this meal: your fastest kitchen first, your
        slowest second.</InfoButton>
    </Box>, formatNum(fastest) === formatNum(slowest) ? formatNum(fastest) : `${formatNum(fastest)} to ${formatNum(slowest)}`] : null
  ];
};

const Meals = ({
                 account,
                 characters,
                 meals,
                 kitchens,
                 totalMealSpeed,
                 mealMaxLevel,
                 achievements,
                 lab,
                 equinoxUpgrades
               }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('cooking-meals', MEALS_TOOLBAR);
  const [settings, setSettings] = usePageSettings('cooking-meals', MEALS_SETTINGS);
  // 0 means "no limit": the slider sitting at its maximum.
  const [mealLimit, setMealLimit] = useLocalStorage({
    key: 'meals-filter-limit',
    defaultValue: 0
  });
  const spelunkerObolMulti = getLabBonus(lab?.labBonuses, 8); // gem multi
  const realAmethystRhinestone = getJewelBonus(lab?.jewels, 0, spelunkerObolMulti);
  const mealSpeed = (totalMealSpeed ?? 0) * (settings?.amethyst && realAmethystRhinestone === 0 ? AMETHYST_RHINESTONE : 1);
  const accountFoodLust = equinoxUpgrades?.find(({ name }) => name === 'Food_Lust')?.bonus;
  const equinox = equinoxUpgrades?.map((upgrade) => upgrade?.name === 'Food_Lust' && settings?.foodLust != null
    ? { ...upgrade, bonus: settings.foodLust }
    : upgrade);
  const overflowingLadleBonus = getHighestOverflowingLadle(characters);
  const overflowDivisor = settings?.overflow && overflowingLadleBonus?.value ? 1 + overflowingLadleBonus.value / 100 : 1;
  const nmlbActive = getNoMealLeftBehindLevels(account) > 0;
  const noMealLeftBehind = nmlbActive ? nmlbOrder(meals, mealMaxLevel)[0] : null;
  const sortKey = toolbar?.sort?.key ?? null;
  const target = sortTarget(sortKey);

  // A ladle advances every kitchen by an hour, so the card figure assumes all of them cook the
  // meal. One kitchen alone gets only its share of the total speed per ladle.
  const kitchenSpeeds = kitchens?.filter((kitchen) => kitchen?.status !== 3 && kitchen?.mealSpeed > 0)
    ?.map(({ mealSpeed: speed }) => speed) ?? [];
  const singleKitchenMulti = kitchenSpeeds.length > 1 ? {
    fastest: totalMealSpeed / Math.max(...kitchenSpeeds),
    slowest: totalMealSpeed / Math.min(...kitchenSpeeds)
  } : null;

  // Every meal's time to its next level and to each breakpoint, at the tab's speed, food lust and ladle settings
  const calcMeals = (list) => (list ?? []).filter(Boolean).map((meal) => {
    const { amount, level, cookReq } = meal;
    const levelCost = getMealLevelCost(level, achievements, account, equinox);
    const timeTillNextLevel = (amount >= levelCost ? 0 : calcTimeToNextLevel(levelCost - amount, cookReq, mealSpeed)) / overflowDivisor;
    const breakpointTimes = [{ bpCost: levelCost, bpLevel: 0, timeToBp: timeTillNextLevel },
      ...BREAKPOINT_LEVELS.map((breakpoint) => ({
        bpCost: (breakpoint - level) * levelCost,
        bpLevel: breakpoint,
        timeToBp: calcMealTime(breakpoint, meal, mealSpeed, achievements, equinox, account) / overflowDivisor
      }))];
    return { ...meal, levelCost, timeTillNextLevel, breakpointTimes };
  });
  const calculated = calcMeals(meals);
  const ribbonOf = (meal) => account?.grimoire?.ribbons?.[28 + meal?.index] ?? 0;
  const sorted = sortKey === 'nmlb' ? (nmlbActive ? nmlbOrder(calculated, mealMaxLevel) : calculated)
    : sortKey === 'ribbon'
      // Unribboned meals last, the rest by rank
      ? calculated.toSorted((a, b) => (ribbonOf(a) === 0) - (ribbonOf(b) === 0) || ribbonOf(a) - ribbonOf(b))
      : sortKey
        // Meals already at the target level go last
        ? calculated.toSorted((a, b) => (target > 0 ? (a.level >= target) - (b.level >= target) : 0)
          || hoursOf(entryFor(a, target)) - hoursOf(entryFor(b, target)))
        : calculated;
  const listed = toolbar?.hideCapped ? sorted.filter((meal) => meal?.level < mealMaxLevel) : sorted;
  const ordered = toolbar?.sort?.order === 'desc' ? listed.toReversed() : listed;

  const bestSpeedMeals = listed
    .filter((meal) => (meal?.stat === 'Mcook' || meal?.stat === 'KitchenEff' || meal?.stat === 'zMealFarm') && meal?.level < mealMaxLevel)
    .map((meal) => {
      const current = getMealBonus(account, meal).value;
      const next = getMealBonus(account, meal, meal.level + 1).value;
      return { ...meal, current, next, diff: (next - current) / meal.timeTillNextLevel };
    })
    .toSorted((a, b) => b.diff - a.diff);

  // Cost is measured against the sort target when it's a real breakpoint, otherwise against the next level.
  const getMealCost = (meal) => hoursOf(entryFor(meal, target));
  const isMealUpgradable = (meal) => {
    if (!meal || meal.level === 0 || meal.level >= mealMaxLevel) return false;
    return !(target > 0 && meal.level >= target);
  };
  const isLimitCandidate = (meal) => isMealUpgradable(meal) && Number.isFinite(getMealCost(meal));
  const applyMealLimit = (list, limit, upgradable) => {
    if (!limit || limit >= upgradable) return list;
    // Pick by cost, then keep the incoming sort order for display.
    const chosen = new Set(list.filter(isLimitCandidate)
      .toSorted((a, b) => getMealCost(a) - getMealCost(b))
      .slice(0, limit)
      .map(({ index }) => index));
    // Only trims the upgradable pool; capped and unstarted meals stay governed by the other filters.
    return list.filter((meal) => !isLimitCandidate(meal) || chosen.has(meal.index));
  };
  const upgradableCount = ordered.filter(isLimitCandidate).length;
  const limited = mealLimit > 0 && mealLimit < upgradableCount;
  const limitedMeals = applyMealLimit(ordered, mealLimit, upgradableCount);
  const visibleMeals = settings?.bookOrder ? limitedMeals.toSorted((a, b) => a?.index - b?.index) : limitedMeals;
  const costs = visibleMeals.filter(isMealUpgradable).map(getMealCost).filter(Number.isFinite);
  const costTotal = costs.length ? costs.reduce((sum, cost) => sum + cost, 0) : null;
  // Only over meals the account has started: an empty list (a failed section) or a guest's says nothing
  const allPast = target > 0 && listed.some(({ level, amount }) => amount > 0 || level > 0)
    && !listed.some(({ level, amount }) => amount > 0 && level < target);

  const nmlbQueue = sortKey === 'nmlb'
    ? getNoMealLeftBehindQueue(meals ?? [], mealMaxLevel, settings?.procs ?? MEALS_SETTINGS.procs, {
      achievements,
      account,
      equinoxUpgrades: equinox,
      mealSpeed,
      overflowMulti: overflowDivisor
    })
    : [];
  const nmlbLadles = nmlbQueue.reduce((sum, { ladles }) => Number.isFinite(ladles) ? sum + ladles : sum, 0);

  const settingSwitch = (name, label, help) => <Stack sx={{ maxWidth: 320 }}>
    <FormControlLabel label={label} sx={{ mr: 0 }}
                      control={<Switch checked={Boolean(settings?.[name])}
                                       onChange={(event) => setSettings({ [name]: event.target.checked })}/>}/>
    <Typography variant={'caption'} color={'text.secondary'}>{help}</Typography>
  </Stack>;

  // The target the cards measure against, its progress and time, and the ladles it takes
  const breakpointSection = (meal) => {
    const { amount, level } = meal;
    const entry = entryFor(meal, target);
    if (!entry || level === 0) return null;
    const { bpLevel, bpCost, timeToBp } = entry;
    const maxed = level >= mealMaxLevel;
    const covered = bpLevel > 0 && amount >= bpCost;
    return <ItemCard.Section>
      {maxed ? <StatusText status={'maxed'}/> : covered ? <StatusText status={'maxed'}>Breakpoint maxed</StatusText>
        : <ItemCard.Progress label={bpLevel > 0 ? `Progress to Lv ${formatNum(bpLevel)}` : 'Progress'}
                             percent={bpCost > 0 ? Math.min(100, 100 * amount / bpCost) : 100}
                             value={exactNote(<Num value={Math.floor(amount ?? 0)} game={'CookingR.CookingMenuMealCosts'}/>, formatNum(amount ?? 0, 'exact'))}
                             max={exactNote(<Num value={Math.ceil(bpCost ?? 0)} game={'CookingR.CookingMenuMealCosts'}/>, formatNum(bpCost ?? 0, 'exact'))}/>}
      {maxed ? null : <ItemCard.Facts rows={[
        [bpLevel > 0 ? `To Lv ${formatNum(bpLevel)}` : 'Next level', timeText(timeToBp)],
        ...ladleRows(timeToBp, singleKitchenMulti)
      ]}/>}
    </ItemCard.Section>;
  };

  return (
    <>
      {noMealLeftBehind ? <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
        <StatTile label={'No Meal Left Behind next'} icon={`data/${noMealLeftBehind.rawName}.png`}
                  value={cleanUnderscore(noMealLeftBehind.name)}/>
      </Stack> : null}
      {/* The meal numbers' settings, for this tab only: bottoms aligned (5b's land rank row) */}
      <Stack direction={'row'} gap={3} alignItems={'flex-end'} flexWrap={'wrap'} mb={2}>
        {settingSwitch('overflow', 'Overflowing Ladle', `Blood Berserker talent: ladles give ${formatNum(overflowingLadleBonus?.value ?? 0, 'pct')} more AFK time${overflowingLadleBonus?.character ? ` (${overflowingLadleBonus.character})` : ''}.`)}
        {realAmethystRhinestone === 0 ? settingSwitch('amethyst', 'Amethyst Rhinestone', 'Counts the 4.5x meal speed the jewel gives.') : null}
        <NumberField label={'Food Lust bosses'} value={settings?.foodLust ?? null} defaultValue={accountFoodLust}
                     min={0} max={14} integer help={false} sx={{ width: 160 }}
                     onChange={(next) => setSettings({ foodLust: next })}/>
      </Stack>
      <Box>
        <Toolbar state={toolbar} defaults={MEALS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                 total={meals?.length ?? 0} shown={visibleMeals.length} noun={'meals'}>
          <Toolbar.Sort options={SORTS}/>
          <Toolbar.Filter name={'hideCapped'} label={'Hide capped'}/>
          <Toolbar.View options={[['cards', 'Cards'], ['compact', 'Compact']]}/>
        </Toolbar>
        {allPast ? <Notice tone={'info'} sx={{ mb: 2 }}>{`Every meal has reached Lv ${formatNum(target)}.`}</Notice> : null}
        {bestSpeedMeals.length ? <Stack gap={1} my={2}>
          <Typography variant={'sectionTitle'} component={'h2'}>Best meal speed contribution</Typography>
          <CardGrid size={'m'}>
            {bestSpeedMeals.map(({ name, rawName, level, current, next, timeTillNextLevel }) => <ItemCard
              key={name} icon={<MealIcon rawName={rawName} plateLevel={level} small/>} title={cleanUnderscore(name)}
              meta={`Lv ${formatNum(level)} → ${formatNum(level + 1)}`}>
              <ItemCard.Facts rows={[
                ['Bonus', `+${formatMealBonus(current)}% → +${formatMealBonus(next)}% (+${formatMealBonus(next - current)}%)`],
                ['Next level', timeText(timeTillNextLevel)],
                ...ladleRows(timeTillNextLevel, singleKitchenMulti)
              ]}/>
            </ItemCard>)}
          </CardGrid>
        </Stack> : null}
        {nmlbQueue.length > 0 ? <Panel sx={{ my: 2 }}
                                       title={<>No Meal Left Behind queue <InfoButton label={'No Meal Left Behind'}>
                                         No Meal Left Behind always levels your lowest meal and picks again after every
                                         proc, so one low meal can soak up a run of procs before anything else is touched.
                                         The Sacred Methods bundle adds 2 more levels per proc, all landing on that same
                                         meal. Each entry shows the ladles that proc saves you.</InfoButton></>}
                                       aside={<Stack direction={'row'} alignItems={'flex-end'} gap={2} flexWrap={'wrap'}
                                                     justifyContent={'flex-end'}>
                                         <Stack direction={'row'} alignItems={'center'} gap={1}>
                                           <GameIcon src={'data/Ladle.png'} size={24} alt={''}/>
                                           <Typography variant={'body2'} component={'span'} sx={{ whiteSpace: 'nowrap' }}>
                                             {exactNote(`${formatNum(Math.ceil(nmlbLadles))} saved`,
                                               `${formatNum(nmlbLadles, 'exact')} ladles saved by these ${formatNum(nmlbQueue.length)} procs`)}
                                           </Typography>
                                         </Stack>
                                         <NumberField label={'Procs'} value={settings?.procs ?? MEALS_SETTINGS.procs}
                                                      sx={{ width: 90 }} min={1} max={50} integer help={false}
                                                      onChange={(next) => setSettings({ procs: next ?? MEALS_SETTINGS.procs })}/>
                                       </Stack>}>
          {nmlbQueue.map(({ index, name, rawName, fromLevel, toLevel, ladles }, procIndex) => <Panel.Row
            key={`nmlb-${index}-${procIndex}`} icon={`data/${rawName}.png`} iconAlt={''}
            name={`#${procIndex + 1} ${cleanUnderscore(name)}`}
            sub={`Lv ${formatNum(fromLevel)} → ${formatNum(toLevel)}`}
            value={Number.isFinite(ladles) ? exactNote(formatNum(Math.ceil(ladles)), formatNum(ladles, 'exact')) : '-'}/>)}
        </Panel> : null}
        {visibleMeals.length ? <Typography my={1} variant={'sectionTitle'} component={'h2'}>Meals</Typography> : null}
        <MealsFilterBar upgradableCount={upgradableCount} total={costTotal}
                        limited={limited} value={limited ? mealLimit : upgradableCount}
                        onCommit={(val) => setMealLimit(val >= upgradableCount ? 0 : val)}
                        bookOrder={Boolean(settings?.bookOrder)}
                        onBookOrder={(on) => setSettings({ bookOrder: on })}/>
        <CardGrid size={'m'}>
          {visibleMeals.map((meal) => {
            const { name, rawName, effect, level, cookingMasteryNode, index: mealIndex } = meal;
            const ribbonIndex = ribbonOf(meal);
            const ribbonBonus = getRibbonBonus(account, ribbonIndex);
            const { value: realEffect, breakdown: effectBreakdown } = getMealBonus(account, meal);
            // The game prints a meal's bonus with its own fill (formatMealBonus); the sentence opens what it adds up to,
            // headed and totalled as the sentence reads it ("+3,814%", "+290Px")
            const sentence = cleanUnderscore(effect?.replace('{', formatMealBonus(realEffect)));
            const effectFill = mealFill(effect, realEffect);
            const nextLevelNotation = level < mealMaxLevel ? mealFill(effect, getMealBonus(account, meal, level + 1).value) : null;
            return <ItemCard key={mealIndex} icon={<MealIcon rawName={rawName} plateLevel={level}/>}
                             title={cleanUnderscore(name)} level={{ value: level ?? 0 }} dimmed={level === 0}
                             status={level >= mealMaxLevel ? 'maxed' : undefined}>
              <ItemCard.Desc>{level > 0 && effectBreakdown
                ? <Breakdown asValue title={`${cleanUnderscore(name)} bonus`}
                             data={{ ...effectBreakdown, totalValue: effectFill }}>{sentence}</Breakdown>
                : sentence}</ItemCard.Desc>
              <ItemCard.Facts rows={[
                nextLevelNotation ? [`At Lv ${formatNum(level + 1)}`, nextLevelNotation] : null,
                ribbonIndex > 1 ? [iconLabel('ribbon', `data/Ribbon${ribbonIndex - 1}.png`, 'Ribbon'),
                  `Rank ${formatNum(ribbonIndex)} (${formatGame(ribbonBonus, 'Summoning.RibbonBonus')}x)`] : null,
                cookingMasteryNode?.level > 0 ? [iconLabel('node', 'etc/CookingMastery.png', 'Mastery node'),
                  `Lv ${formatNum(cookingMasteryNode.level)} (${formatGame(cookingMasteryNode.multi, 'Summoning2.BonusMultiCook')}x)`] : null
              ]}/>
              {toolbar?.view === 'compact' ? null : breakpointSection(meal)}
            </ItemCard>;
          })}
        </CardGrid>
      </Box>
    </>
  );
};


// Slider narrows the list to the N cheapest meals to upgrade, and the total next to it is the
// ladles that batch costs. Only the total is shown: a ladle stack is spent in full when used, so
// a per-meal maximum would just tell people to over-pull on everything but the priciest meal.
const MealsFilterBar = ({ upgradableCount, total, limited, value, onCommit, bookOrder, onBookOrder }) => {
  // Drag position is kept here on purpose: the meal list only changes on release, so letting it
  // live in the parent re-rendered every card on every mousemove.
  const [dragValue, setDragValue] = useState(null);
  if (upgradableCount === 0) return null;
  const shownValue = dragValue ?? value;
  return (
    <Stack direction={'row'} alignItems={'center'} columnGap={3} rowGap={1} flexWrap={'wrap'} mb={2}>
      <Stack direction={'row'} alignItems={'center'} columnGap={2} rowGap={1} flexWrap={'wrap'}>
        <Slider size={'small'} sx={{ width: 130 }} min={1} max={upgradableCount} value={shownValue}
                aria-label={'Meals to show'}
                onChange={(e, val) => setDragValue(val)}
                onChangeCommitted={(e, val) => {
                  setDragValue(null);
                  onCommit(val);
                }}/>
        <NumberField ariaLabel={'Meals to show'} value={shownValue}
                     min={1} max={upgradableCount} integer help={false}
                     sx={{ width: 80 }}
                     onChange={(next) => onCommit(next ?? upgradableCount)}/>
        <Typography variant={'body2'} sx={{ whiteSpace: 'nowrap' }}>of {formatNum(upgradableCount)}</Typography>
        <InfoButton label={'Cheapest meals'}>Narrows the list to the cheapest meals to upgrade, so you can pull one page
          of ladles and work straight down it. Cost is measured against the sort target above, and ladles and hours are
          the same number.</InfoButton>
      </Stack>
      {total != null ? <Stack direction={'row'} alignItems={'center'} gap={1}>
        <GameIcon src={'data/Ladle.png'} size={24} alt={''}/>
        <Typography variant={'body2'} sx={{ whiteSpace: 'nowrap' }}>{formatNum(Math.ceil(total))} total</Typography>
        <InfoButton label={'Ladles total'}>{`${formatNum(total, 'exact')} ladles to upgrade every meal shown: the sum of the per-meal figures on the cards below.`}</InfoButton>
      </Stack> : null}
      {limited ? <Button size={'small'} onClick={() => onCommit(upgradableCount)}>Reset</Button> : null}
      <Stack>
        <FormControlLabel label={'Book order'} sx={{ mr: 0 }}
                          control={<Switch checked={bookOrder} onChange={(event) => onBookOrder(event.target.checked)}/>}/>
        <Typography variant={'caption'} color={'text.secondary'}>Lists these meals in cooking book order.</Typography>
      </Stack>
    </Stack>
  );
};

export default Meals;

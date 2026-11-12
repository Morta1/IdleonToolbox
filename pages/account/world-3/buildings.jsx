import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Box } from '@mui/material';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { getBuildCost, getExtraMaxLevels, getGildedBoostioBonus, getTotalGildedSlots, getTrimmedBuildSpeed } from '@parsers/world-3/construction';
import { towers as towersTable } from '@website-data';
import { NextSeo } from 'next-seo';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import InfoButton, { NoteTrigger } from '@components/common/InfoButton';
import { calculateItemTotalAmount } from '@parsers/items';
import Num, { Duration } from '@components/common/Num';
import GameIcon from '@components/common/GameIcon';

const BUILDINGS_TOOLBAR = { sort: null, hideMaxed: false };

const getMaterialCosts = (itemReq, level, maxLevel, bonusInc, costCruncher) => {
  const cruncherLevel = costCruncher?.level ?? 0;
  return (itemReq ?? []).map(({ rawName, name, amount }) => {
    const math1 = Math.min(0.1, 0.1 * Math.floor((cruncherLevel + 999) / 1000));
    const math2 = Math.max(0, cruncherLevel - 1);
    const costReduction = Math.max(0.2, 1 - (math1 + (math2 * (costCruncher?.costInc?.[0] ?? 0)) / 100))
    if (rawName.includes('Refinery')) {
      return { rawName, name, amount: Math.floor(costReduction * amount * (level + 1)) };
    }
    return {
      rawName, name,
      amount: Math.floor(costReduction * amount * Math.pow(bonusInc + 0.03 - ((bonusInc + 0.03 - 1.05) * level) / (maxLevel / 2 + level), level))
    };
  });
}

const getMaterialCostsToMax = (itemReq, iterations, level, maxLevel, bonusInc, costCruncher) => Array.from({ length: Math.max(0, iterations) },
  (_, step) => getMaterialCosts(itemReq, level + step, maxLevel, bonusInc, costCruncher))
  .reduce((costs, levelCosts) => levelCosts.map((cost, index) => ({ ...cost, amount: (costs?.[index]?.amount ?? 0) + cost.amount })), []);

// Every tower with its costs and times. The trimmed slot's progress since the save reads the clock, as the
// page's timers do (a data page)
const buildingsOf = (account, lastUpdated) => {
  const buildSpeed = account?.construction?.totalBuildRate ?? 0;
  const costCruncher = account?.towers?.data?.find((tower) => tower?.index === 5);
  const atom = account?.atoms?.atoms?.find(({ name }) => name === 'Carbon_-_Wizard_Maximizer');
  const trimmedSlots = getTotalGildedSlots(account);
  const speedBoost = getGildedBoostioBonus(account);
  const timePassed = (new Date().getTime() - (lastUpdated ?? 0)) / 1000;
  return (account?.towers?.data ?? []).map((tower) => {
    const { level, maxLevel: baseMaxLevel, bonusInc, itemReq, slot } = tower;
    const maxLevel = baseMaxLevel + getExtraMaxLevels(account, baseMaxLevel, atom?.level, tower?.index);
    const buildCost = getBuildCost(account?.towers, level, bonusInc, tower?.index);
    const isSlotTrimmed = slot !== -1 && slot < trimmedSlots;
    const progress = tower?.progress + (isSlotTrimmed ? speedBoost * (timePassed / 3600) * buildSpeed : 0);
    return {
      ...tower,
      maxLevel,
      isMaxed: level === maxLevel,
      isSlotTrimmed,
      progress,
      buildCost,
      // seconds; a build speed of 0 makes them Infinity
      timeLeft: (buildCost - progress) / buildSpeed * 3600,
      trimmedTimeLeft: (buildCost - progress) / (speedBoost * buildSpeed) * 3600,
      items: getMaterialCosts(itemReq, level, baseMaxLevel, bonusInc, costCruncher),
      itemsMax: getMaterialCostsToMax(itemReq, maxLevel - level, level, baseMaxLevel, bonusInc, costCruncher)
    };
  });
};

// A failed towers section has no levels or build costs: the catalog at zero, by name
const catalogAtZero = () => Object.entries(towersTable ?? {}).map(([name, tower]) => ({ ...tower, name, level: 0, catalogOnly: true }));

const timeLeftOf = ({ isSlotTrimmed, timeLeft, trimmedTimeLeft }) => (isSlotTrimmed ? trimmedTimeLeft : timeLeft);
const SORTS = {
  time: (a, b) => timeLeftOf(a) - timeLeftOf(b),
  cost: (a, b) => (a?.buildCost - b?.buildCost) || ((a?.buildCost - a?.progress) - (b?.buildCost - b?.progress))
};

// What a building does: the game's description up to its "Current Bonuses", whose numbers each building fills its own
// way. In a note beside the name: on the card, 28 descriptions made the page about 400 px taller
const whatItDoes = (name) => (towersTable?.[name]?.desc ?? '').split('_@_Current_Bonuses')[0].split('_@_')
  .map((line) => cleanUnderscore(line).trim()).filter(Boolean);
const titleWithNote = (name) => {
  const lines = whatItDoes(name);
  return lines.length ? <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
    {cleanUnderscore(name)}
    <InfoButton label={`What ${cleanUnderscore(name)} does`}>{lines.join(' ')}</InfoButton>
  </Box> : cleanUnderscore(name);
};

// What you own of a material: the storage, and the refinery's own storage for its salts (as the Refinery page counts)
const ownedOf = (account, rawName) => calculateItemTotalAmount(
  [...(account?.storage?.list ?? []), ...(account?.refinery?.refineryStorage ?? [])], rawName, true, true);

const durationOrDash = (seconds) => (Number.isFinite(seconds) ? <Duration seconds={seconds}/> : '-');
// A tower's progress pair in the game's rule, its exact digits on a tap only while a double holds both numbers whole
// (under 2^53): past it 'exact' prints Big, which repeated the card's pair or mixed the two kinds ("1.3e23 / 37.7Q")
const exactFits = (value) => Number.isFinite(value) && Math.floor(value) < Number.MAX_SAFE_INTEGER;
const exactOf = (value) => formatNum(Math.floor(value), 'exact');
const progressValue = (progress, buildCost) => {
  const short = formatGame(progress, 'WorkbenchStuff.TowerBuildReq', { whole: true });
  // The note would repeat the card's pair (a guest's "0 / 2"): no trigger
  const pairShown = short === exactOf(progress) && formatGame(buildCost, 'WorkbenchStuff.TowerBuildReq', { whole: true }) === exactOf(buildCost);
  return exactFits(progress) && exactFits(buildCost) && !pairShown
    ? <NoteTrigger label={'Exact progress'} note={`${exactOf(progress)} / ${exactOf(buildCost)}`}>{short}</NoteTrigger>
    : short;
};

// A level's cost as a fact's value: every building's next level and its road to max take one material each, so a
// headed section per cost (a heading, a divider and one line, twice) gave way to a row like Time left's (#81)
// Held to the text's 20 px line, so the sprite's box doesn't make the row taller than Time left's and lift the amount
const costValue = (items) => <Box component={'span'}
                                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, height: 20, verticalAlign: 'top' }}>
  {items.map(({ rawName, name, amount }) => <Box key={rawName} component={'span'}
                                                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, height: 20 }}>
    <GameIcon src={`data/${rawName}.png`} size={16} alt={cleanUnderscore(name)}/>
    <Num value={amount} game={'Big'} whole/>
  </Box>)}
</Box>;

// The next level's materials against what you own, as ItemCard.Cost colours them (the need green when covered, amber
// when short) but in a Facts row, so "Next level" keeps its label and lines up with "To max"
const ownedCostValue = (items, account) => <Box component={'span'}
                                                sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, height: 20, verticalAlign: 'top' }}>
  {items.map(({ rawName, name, amount }) => {
    const have = ownedOf(account, rawName);
    return <Box key={rawName} component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, height: 20 }}>
      <GameIcon src={`data/${rawName}.png`} size={16} alt={cleanUnderscore(name)}/>
      <Box component={'span'} sx={{ color: 'text.secondary', fontWeight: 400 }}><Num value={have} game={'Big'} whole/></Box>
      <Box component={'span'} sx={{ color: 'text.muted', fontWeight: 400 }}>/</Box>
      <Box component={'span'} sx={{ color: have < amount ? 'text.warning' : 'text.success' }}><Num value={amount} game={'Big'} whole/></Box>
    </Box>;
  })}
</Box>;

const Buildings = () => {
  const { state } = useContext(AppContext);
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('buildings', BUILDINGS_TOOLBAR);
  const towersFailed = isSectionFailed(state?.account, 'towers');
  const constructionFailed = isSectionFailed(state?.account, 'construction');
  const buildSpeed = state?.account?.construction?.totalBuildRate ?? 0;
  const trimmedBuildSpeed = getTrimmedBuildSpeed(state?.account);
  const parsed = buildingsOf(state?.account, state?.lastUpdated);
  const buildings = towersFailed && !parsed.length ? catalogAtZero() : parsed;

  const sort = toolbar?.sort;
  const compare = SORTS[sort?.key];
  // Maxed towers stay last whichever way the sort runs
  const sorted = compare
    ? buildings.toSorted((a, b) => (a?.isMaxed - b?.isMaxed) || (sort?.order === 'desc' ? compare(b, a) : compare(a, b)))
    : buildings;
  const shown = toolbar?.hideMaxed ? sorted.filter(({ isMaxed }) => !isMaxed) : sorted;
  const trimmedText = `${formatGame(trimmedBuildSpeed?.value ?? 0, 'Big')}/hr`;

  return <>
    <NextSeo
      title="Buildings | Idleon Toolbox"
      description="Keep track of your towers levels, bonuses and required materials for upgrades"
    />
    {towersFailed || constructionFailed ? <MissingData name={'Buildings'} failed atZero={towersFailed}/> : null}
    <PageSummary>
      <StatTile label={'Total building levels'} value={towersFailed ? '-' : state?.account?.towers?.totalLevels ?? 0}
                kind={'amount'}/>
      <StatTile label={'Build speed'} value={constructionFailed ? '-' : `${formatNum(buildSpeed)}/hr`}/>
      <StatTile label={'Trimmed build speed'} value={constructionFailed ? '-' : trimmedText} breakdownTitle={'Trimmed build speed'}
                breakdown={!constructionFailed && trimmedBuildSpeed?.breakdown
                  ? { ...trimmedBuildSpeed.breakdown, totalValue: trimmedText }
                  : undefined}/>
    </PageSummary>
    <Box>
      <Toolbar state={toolbar} defaults={BUILDINGS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
               total={buildings.length} shown={shown.length} noun={'buildings'}>
        <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
        <Toolbar.Sort options={[['time', 'Time left', 'asc'], ['cost', 'Build cost', 'asc']]}/>
      </Toolbar>
      <CardGrid size={'m'}>
        {shown.map((tower, index) => {
          const { name, progress, level, maxLevel, inProgress, isSlotTrimmed, isMaxed, items, itemsMax, buildCost } = tower;
          if (tower?.catalogOnly) {
            return <ItemCard key={`${name}-${index}`} icon={`data/ConTower${tower?.index}.png`} title={titleWithNote(name)}
                             level={{ value: 0 }}/>;
          }
          return <ItemCard key={`${name}-${index}`} icon={`data/ConTower${tower?.index}.png`} title={titleWithNote(name)}
                           level={{ value: level, max: maxLevel }}
                           status={isMaxed ? 'maxed' : isSlotTrimmed || inProgress ? 'active' : undefined}
                           statusLabel={isMaxed ? undefined : isSlotTrimmed ? 'Trimmed slot' : inProgress ? 'Building' : undefined}>
            {isMaxed ? null : <>
              <ItemCard.Progress label={'Progress'} percent={buildCost > 0 ? Math.min(100, (progress / buildCost) * 100) : 0}
                                 value={progressValue(progress, buildCost)}
                                 max={formatGame(buildCost, 'WorkbenchStuff.TowerBuildReq', { whole: true })}/>
              <ItemCard.Facts rows={[
                ['Time left', durationOrDash(tower?.timeLeft)],
                ['In a trimmed slot', durationOrDash(tower?.trimmedTimeLeft)]
              ]}/>
              {items?.length || itemsMax?.length ? <ItemCard.Section>
                <ItemCard.Facts rows={[
                  items?.length ? ['Next level', ownedCostValue(items, state?.account)] : null,
                  itemsMax?.length ? ['To max', costValue(itemsMax)] : null
                ]}/>
              </ItemCard.Section> : null}
            </>}
          </ItemCard>;
        })}
      </CardGrid>
    </Box>
  </>;
};

export default Buildings;

import React, { useContext } from 'react';
import { FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import StatusText from '@components/common/StatusText';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import useCheckbox from '@components/common/useCheckbox';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import NumberField from '@components/common/NumberField';
import { getOptimizedLandRankUpgrades, isCropValueCapped, LAND_RANK_GOALS } from '@parsers/world-6/farming';
import { clampCustomMax, MAX_CUSTOM_UPGRADES } from '@parsers/genericUpgradeOptimizer';
import InfoButton from '@components/common/InfoButton';
import ViewSwitch from '@components/common/ViewSwitch';
import Notice from '@components/common/Notice';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const pointsOptions = [10, 25, 50, 100, 250, 500, 1000];
const groupModes = ['None', 'Upgrade', 'Summary'];
const METHOD_NOTE = 'Every land rank upgrade costs exactly 1 rank point, so the plan spends points one at a time on whichever upgrade gains the most. Goals group the upgrades by what they boost: a percent of total damage and a percent of rank EXP aren\'t the same kind of percent.';

const goalDescriptions = {
  evolution: 'Chance for a plot to evolve into the next crop.',
  cropValue: 'Crop value and quantity per harvest.',
  rankExp: 'Rank EXP, which is what earns you more rank points.',
  overgrowth: 'Chance for a plot to roll an overgrowth.',
  farmingExp: 'Farming skill EXP.',
  character: 'Ninja stealth, drop rate, total damage and all stat.',
  all: 'Every goal at once. Bonuses from different goals are not really comparable, so treat this as a tiebreaker rather than an answer.'
};

// A land rank bonus is a percent the game's sentence carries the % of: decimals under 100, Big from 1,000
const formatBonus = (bonus) => formatNum(bonus, 'pct', { bare: true });
const formatPercentChange = (percentChange) => formatNum(percentChange, 'pct', { signed: true, precise: true });
const points = (count) => `${count} ${count === 1 ? 'pt' : 'pts'}`;

const UpgradeOptimizer = () => {
  const { state } = useContext(AppContext);
  const account = state?.account;
  const farming = account?.farming;
  const { availablePoints = 0, hasLandRank } = farming || {};

  const [goal, setGoal] = useLocalStorage({
    key: 'landRankOptimizer:goal',
    defaultValue: 'evolution'
  });
  const [maxUpgrades, setMaxUpgrades] = useLocalStorage({
    key: 'landRankOptimizer:maxUpgrades',
    defaultValue: 100
  });
  const [maxUpgradesMode, setMaxUpgradesMode] = useLocalStorage({
    key: 'landRankOptimizer:maxUpgradesMode',
    defaultValue: 'preset'
  });
  const [customMaxUpgrades, setCustomMaxUpgrades] = useLocalStorage({
    key: 'landRankOptimizer:customMaxUpgrades',
    defaultValue: 100
  });
  // Land rank steps repeat far more than the other optimizers' do: a flat list is 1000 copies of
  // the same row, so the grouped view is the one worth landing on.
  const [groupMode, setGroupMode] = useLocalStorage({
    key: 'landRankOptimizer:groupMode',
    defaultValue: 'Summary'
  });
  const [viewMode, setViewMode] = useLocalStorage({
    key: 'landRankOptimizer:viewMode',
    defaultValue: 'grid'
  });
  const [AffordableCheckboxEl, onlyAffordable] = useCheckbox('Only affordable');

  const maxToUse = maxUpgradesMode === 'custom'
    ? clampCustomMax(customMaxUpgrades)
    : maxUpgrades;
  const optimizedUpgrades = getOptimizedLandRankUpgrades(account, maxToUse, { goal, onlyAffordable });

  // The percent changes are gains of the whole goal per step, so a group's total compounds.
  const combinePercentChange = (sequence) => 100 * (sequence.reduce((multi, { percentChange }) =>
    multi * (1 + percentChange / 100), 1) - 1);

  let displayUpgrades;
  if (groupMode === 'Upgrade') {
    const consolidated = [];
    let currentGroup = null;
    optimizedUpgrades.forEach((upgrade, index) => {
      if (!currentGroup || currentGroup.name !== upgrade.name) {
        if (currentGroup) consolidated.push(currentGroup);
        currentGroup = { ...upgrade, upgradeIndex: index, sequence: [upgrade], startLevel: upgrade.level, contiguous: true };
        return;
      }
      currentGroup.sequence.push(upgrade);
    });
    if (currentGroup) consolidated.push(currentGroup);
    displayUpgrades = consolidated.map((upgrade) => ({
      ...upgrade,
      finalLevel: upgrade.sequence[upgrade.sequence.length - 1].newLevel,
      bonusAfter: upgrade.sequence[upgrade.sequence.length - 1].bonusAfter,
      totalCost: upgrade.sequence.length,
      combinedPercentChange: combinePercentChange(upgrade.sequence)
    }));
  }
  else if (groupMode === 'Summary') {
    const grouped = {};
    optimizedUpgrades.forEach((upgrade, index) => {
      if (!grouped[upgrade.name]) {
        grouped[upgrade.name] = { ...upgrade, upgradeIndex: index, startLevel: upgrade.level, sequence: [] };
      }
      const group = grouped[upgrade.name];
      group.sequence.push(upgrade);
      group.finalLevel = upgrade.newLevel;
      group.bonusAfter = upgrade.bonusAfter;
      group.totalCost = group.sequence.length;
      group.combinedPercentChange = combinePercentChange(group.sequence);
    });
    displayUpgrades = Object.values(grouped);
  }
  else {
    displayUpgrades = optimizedUpgrades.map((upgrade, index) => ({ ...upgrade, upgradeIndex: index }));
  }
  // upgradeIndex is the plan step of the group's first point, so in Summary mode it is not a
  // running row number; the table's # column needs its own position.
  displayUpgrades = displayUpgrades.map((upgrade, index) => ({ ...upgrade, displayPosition: index + 1 }));

  const renderStatChange = (upgrade) => {
    const hasSequence = upgrade.sequence?.length > 1;
    const bonusBefore = formatBonus(upgrade.bonusBefore);
    const bonusAfter = formatBonus(upgrade.bonusAfter);
    const percentChange = hasSequence ? upgrade.combinedPercentChange : upgrade.percentChange;
    return <>
      <Typography variant={'body2'} component={'div'}>
        {LAND_RANK_GOALS[upgrade.goal]?.name}: {formatPercentChange(percentChange)}
      </Typography>
      <Typography variant={'body2'} component={'div'} color={'text.secondary'}>
        {cleanUnderscore(upgrade.description).replace('{', `${bonusBefore} → ${bonusAfter}`)}
      </Typography>
    </>;
  };

  // A capped 5th column upgrade can't take the point the plan would otherwise hand it, and a card
  // sitting at its cap with no marker reads as "keep pouring points in here".
  const renderCapStatus = (upgrade) => {
    const level = upgrade.finalLevel ?? upgrade.newLevel;
    if (!upgrade.maxLevel || level < upgrade.maxLevel) return null;
    return <StatusText status={'maxed'}/>;
  };

  // Summary lumps together points that aren't next to each other in the plan, so a "#1 to #63"
  // range would claim an order the steps never had.
  const groupLabel = (upgrade) => {
    if (!(upgrade.sequence?.length > 1)) return `Upgrade #${upgrade.upgradeIndex + 1}`;
    if (!upgrade.contiguous) return `${upgrade.sequence.length} points across the plan`;
    return `Upgrade Group (#${upgrade.upgradeIndex + 1} to #${upgrade.upgradeIndex + upgrade.sequence.length})`;
  };

  const renderUpgradeCard = (upgrade) => {
    const hasSequence = upgrade.sequence?.length > 1;
    return <ItemCard key={upgrade.upgradeIndex} icon={`data/RankUpg${upgrade.index}.png`} title={cleanUnderscore(upgrade.name)}
                     level={{ value: upgrade.level, max: upgrade.maxLevel || null }} meta={groupLabel(upgrade)}
                     aside={renderCapStatus(upgrade)}
                     footer={<ItemCard.Facts rows={[[hasSequence ? 'Total cost' : 'Cost',
                       points(hasSequence ? upgrade.totalCost : upgrade.cost)]]}/>}>
      {hasSequence
        ? <ItemCard.Section label={`Total benefits (Lv ${upgrade.startLevel} → ${upgrade.finalLevel})`}>
          {renderStatChange(upgrade)}
        </ItemCard.Section>
        : renderStatChange(upgrade)}
    </ItemCard>;
  };

  // The table view: the plan's order (#), nothing sorts. A point costs 1, a group its level count.
  const upgradeColumns = [
    {
      key: 'name',
      label: 'Name',
      icon: (upgrade) => <GameIcon src={`data/RankUpg${upgrade.index}.png`} alt={''} size={32}/>,
      render: (upgrade) => {
        const capStatus = renderCapStatus(upgrade);
        return <span>{cleanUnderscore(upgrade.name)}{capStatus ? <> {capStatus}</> : null}</span>;
      }
    },
    {
      key: 'level',
      label: 'Level',
      cellSx: { whiteSpace: 'nowrap' },
      render: (upgrade) => `${upgrade.sequence?.length > 1
        ? `${upgrade.startLevel} → ${upgrade.finalLevel}`
        : `${upgrade.level} → ${upgrade.newLevel}`}${upgrade.maxLevel ? ` / ${upgrade.maxLevel}` : ''}`
    },
    { key: 'stats', label: 'Stat changes', render: (upgrade) => renderStatChange(upgrade) },
    {
      key: 'cost',
      label: 'Cost (pts)',
      numeric: true,
      phone: true,
      value: (upgrade) => (upgrade.sequence?.length > 1 ? upgrade.totalCost : upgrade.cost)
    }
  ];

  return <Stack gap={3}>
    {/* The plan's settings, for this tab only: bottoms aligned, so the checkbox and the switch sit on the fields'
        line, not their labels' */}
    <Stack gap={1}>
      <Stack direction={'row'} gap={2} alignItems={'flex-end'} flexWrap={'wrap'}>
        <FormControl size={'small'} sx={{ width: 200 }}>
          <InputLabel id={'land-rank-goal'}>Optimization Category</InputLabel>
          <Select labelId={'land-rank-goal'}
                  label={'Optimization Category'}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}>
            {Object.entries(LAND_RANK_GOALS).map(([key, { name }]) => <MenuItem key={key} value={key}>{name}</MenuItem>)}
            <MenuItem value={'all'}>All</MenuItem>
          </Select>
        </FormControl>
        <FormControl size={'small'} sx={{ width: 160 }}>
          <InputLabel id={'land-rank-points'}>Points to spend</InputLabel>
          <Select labelId={'land-rank-points'}
                  label={'Points to spend'}
                  value={maxUpgradesMode === 'custom' ? 'custom' : maxUpgrades}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'custom') {
                      setMaxUpgradesMode('custom');
                      return;
                    }
                    setMaxUpgradesMode('preset');
                    setMaxUpgrades(value);
                  }}>
            {pointsOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            <MenuItem value={'custom'}>Custom</MenuItem>
          </Select>
        </FormControl>
        {maxUpgradesMode === 'custom' ? <NumberField label={'Custom max'}
                                                     value={customMaxUpgrades === '' || customMaxUpgrades == null ? null : clampCustomMax(customMaxUpgrades)}
                                                     min={1}
                                                     max={MAX_CUSTOM_UPGRADES}
                                                     integer
                                                     help={false}
                                                     sx={{ width: 120 }}
                                                     onChange={(next) => setCustomMaxUpgrades(next ?? '')}/> : null}
        <FormControl size={'small'} sx={{ width: 120 }}>
          <InputLabel id={'land-rank-group'}>Group mode</InputLabel>
          <Select labelId={'land-rank-group'}
                  label={'Group mode'}
                  value={groupMode}
                  onChange={(e) => setGroupMode(e.target.value)}>
            {groupModes.map((mode) => <MenuItem key={mode} value={mode}>{mode}</MenuItem>)}
          </Select>
        </FormControl>
        <Stack direction={'row'} alignItems={'center'} sx={{ minHeight: 40 }}>
          <AffordableCheckboxEl/>
          <InfoButton label={'the plan'}>{METHOD_NOTE}</InfoButton>
        </Stack>
        <ViewSwitch size={'medium'} label={'View'} options={[['grid', 'Cards'], ['list', 'Table']]} value={viewMode}
                    onChange={setViewMode} sx={{ ml: 'auto' }}/>
      </Stack>
      <Typography variant={'body2'} color={'text.secondary'}>{goalDescriptions[goal]}</Typography>
    </Stack>

    <Stack direction={'row'} alignItems={'center'} gap={2} flexWrap={'wrap'}>
      <Typography variant={'sectionTitle'} component={'h2'}>Recommended upgrade sequence</Typography>
      <StatTile label={'Points spent / unspent'}
                value={`${formatNum(optimizedUpgrades.length)} / ${formatNum(availablePoints)}`}/>
    </Stack>
    {/* One note per place: the lock note is that place's note, so the empty plan says nothing more */}
    {hasLandRank ? null : <Notice tone={'locked'}>
      Land Rank isn&apos;t unlocked on this account yet. Buy it from the farming market first.
    </Notice>}
    {displayUpgrades.length > 0
      ? viewMode === 'grid'
        ? <CardGrid size={'m'}>{displayUpgrades.map(renderUpgradeCard)}</CardGrid>
        : <DataTable columns={upgradeColumns} rows={displayUpgrades} rowKey={'upgradeIndex'}
                     rowLabel={(upgrade) => cleanUnderscore(upgrade.name)}
                     rankOf={(upgrade) => upgrade.displayPosition} surface={'card'}/>
      : hasLandRank ? <Notice>
        {goal === 'cropValue' && isCropValueCapped(account)
          ? "Every plot is already at the game's crop multiplier cap, so more crop value bonus buys nothing. Spend the points on another category."
          : 'No viable upgrades found for this category: each is maxed or locked behind a higher total rank.'}
      </Notice> : null}
  </Stack>
};

export default UpgradeOptimizer;

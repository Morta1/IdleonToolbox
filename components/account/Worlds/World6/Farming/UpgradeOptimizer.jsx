import React, { useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { IconInfoCircleFilled, IconList, IconTable } from '@tabler/icons-react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import useCheckbox from '@components/common/useCheckbox';
import Tooltip from '@components/Tooltip';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import { getOptimizedLandRankUpgrades, isCropValueCapped, LAND_RANK_GOALS } from '@parsers/world-6/farming';

const pointsOptions = [10, 25, 50, 100, 250, 500, 1000];
const groupModes = ['None', 'Upgrade', 'Summary'];
const tooltipText = `Every land rank upgrade costs exactly 1 rank point, so the plan spends points one at a
 time on whichever upgrade gains the most. Goals group the upgrades by what they boost - a percent of
 total damage and a percent of rank EXP aren't the same kind of percent.`;

const goalDescriptions = {
  evolution: 'Chance for a plot to evolve into the next crop.',
  cropValue: 'Crop value and quantity per harvest.',
  rankExp: 'Rank EXP, which is what earns you more rank points.',
  overgrowth: 'Chance for a plot to roll an overgrowth.',
  farmingExp: 'Farming skill EXP.',
  character: 'Ninja stealth, drop rate, total damage and all stat.',
  all: 'Every goal at once. Bonuses from different goals are not really comparable, so treat this as a tiebreaker rather than an answer.'
};

const formatLevel = (upgrade) => (upgrade?.maxLevel
  ? `${upgrade.level} / ${upgrade.maxLevel}`
  : `${upgrade.level}`);
const formatBonus = (bonus) => notateNumber(Math.round(100 * bonus) / 100, 'Big');
const formatPercentChange = (percentChange) => `+${percentChange.toFixed(percentChange < 1 ? 4 : 2)}%`;

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
  // Land rank steps repeat far more than the other optimizers' do - a flat list is 1000 copies of
  // the same row - so the grouped view is the one worth landing on.
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
    ? Math.max(0, parseInt(customMaxUpgrades || 0, 10) || 0)
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

  const renderCost = (upgrade) => <Typography variant={'body2'}>
    {upgrade.sequence?.length > 1 ? `Total Cost: ${upgrade.totalCost} pts` : `Cost: ${upgrade.cost} pts`}
  </Typography>;

  // A capped 5th column upgrade can't take the point the plan would otherwise hand it, and a card
  // sitting at its cap with no marker reads as "keep pouring points in here".
  const renderCapChip = (upgrade) => {
    const level = upgrade.finalLevel ?? upgrade.newLevel;
    if (!upgrade.maxLevel || level < upgrade.maxLevel) return null;
    return <Chip size={'small'}
                 variant={'outlined'}
                 color={'warning'}
                 label={'Maxed'}
                 sx={{ ml: 1, height: 20, '& .MuiChip-label': { px: .75, fontSize: 11 } }}/>;
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
    const originalIndex = upgrade.upgradeIndex;
    return <Card key={originalIndex} sx={{ width: 350 }}>
      <CardContent>
        <Stack direction={'row'} gap={2} sx={{ position: 'relative' }}>
          <img style={{ width: 32, height: 32, objectFit: 'contain' }}
               src={`${prefix}data/RankUpg${upgrade.index}.png`}
               alt={''}/>
          <Box>
            <Typography variant={'subtitle1'}>
              {cleanUnderscore(upgrade.name)} ({formatLevel(upgrade)})
              {renderCapChip(upgrade)}
            </Typography>
            <Typography variant={'caption'} color={'text.secondary'}>{groupLabel(upgrade)}</Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 1 }}/>
        {hasSequence ? <Typography variant={'subtitle2'} gutterBottom>
          Total Benefits (Levels {upgrade.startLevel} → {upgrade.finalLevel})
        </Typography> : null}
        {renderStatChange(upgrade)}
        <Divider sx={{ my: 1 }}/>
        {renderCost(upgrade)}
      </CardContent>
    </Card>;
  };

  const renderUpgradeRow = (upgrade) => {
    const hasSequence = upgrade.sequence?.length > 1;
    return <TableRow key={upgrade.upgradeIndex}>
      <TableCell>{upgrade.displayPosition}</TableCell>
      <TableCell>
        <img style={{ width: 24, height: 24, objectFit: 'contain' }}
             src={`${prefix}data/RankUpg${upgrade.index}.png`}
             alt={''}/>
      </TableCell>
      <TableCell>{cleanUnderscore(upgrade.name)}{renderCapChip(upgrade)}</TableCell>
      <TableCell>{hasSequence
        ? `${upgrade.startLevel} → ${upgrade.finalLevel}`
        : `${upgrade.level} → ${upgrade.newLevel}`}{upgrade.maxLevel ? ` / ${upgrade.maxLevel}` : ''}</TableCell>
      <TableCell>{renderStatChange(upgrade)}</TableCell>
      <TableCell>{renderCost(upgrade)}</TableCell>
    </TableRow>;
  };

  return <Stack gap={3}>
    <Stack direction={'row'} gap={2} alignItems={'center'} flexWrap={'wrap'}>
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
          {pointsOptions.map((points) => <MenuItem key={points} value={points}>{points}</MenuItem>)}
          <MenuItem value={'custom'}>Custom</MenuItem>
        </Select>
      </FormControl>
      {maxUpgradesMode === 'custom' ? <TextField size={'small'}
                                                 type={'number'}
                                                 inputProps={{ min: 1 }}
                                                 sx={{ width: 120 }}
                                                 label={'Custom Max'}
                                                 value={customMaxUpgrades}
                                                 onChange={(e) => {
                                                   const value = parseInt(e.target.value, 10);
                                                   setCustomMaxUpgrades(isNaN(value) ? '' : Math.max(1, value));
                                                 }}/> : null}
      <FormControl size={'small'} sx={{ width: 120 }}>
        <InputLabel id={'land-rank-group'}>Group mode</InputLabel>
        <Select labelId={'land-rank-group'}
                label={'Group mode'}
                value={groupMode}
                onChange={(e) => setGroupMode(e.target.value)}>
          {groupModes.map((mode) => <MenuItem key={mode} value={mode}>{mode}</MenuItem>)}
        </Select>
      </FormControl>
      <Tooltip title={`${goalDescriptions[goal]} ${tooltipText}`}><IconInfoCircleFilled size={16}/></Tooltip>
      <Stack><AffordableCheckboxEl/></Stack>
      <Divider sx={{ my: 1 }} flexItem orientation={'vertical'}/>
      <Stack direction={'row'} gap={1} alignItems={'center'}>
        <Typography>{optimizedUpgrades.length} / {availablePoints}</Typography>
        <Typography variant={'caption'} color={'text.secondary'}>points spent / unspent</Typography>
      </Stack>
      <ToggleButtonGroup value={viewMode}
                         exclusive
                         sx={{ ml: 'auto' }}
                         onChange={(_, value) => value && setViewMode(value)}>
        <Tooltip title={'Grid view'}>
          <ToggleButton sx={{ height: 40 }} value={'grid'}><IconTable/></ToggleButton>
        </Tooltip>
        <Tooltip title={'List view'}>
          <ToggleButton sx={{ height: 40 }} value={'list'}><IconList/></ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
    </Stack>

    <Typography variant={'h6'}>Recommended Upgrade Sequence</Typography>
    {hasLandRank ? null : <Typography variant={'body2'} color={'text.secondary'}>
      Land Rank isn&apos;t unlocked on this account yet. Buy it from the farming market first.
    </Typography>}
    {displayUpgrades.length > 0
      ? viewMode === 'grid'
        ? <Stack direction={'row'} gap={2} flexWrap={'wrap'}>{displayUpgrades.map(renderUpgradeCard)}</Stack>
        : <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
          <Table size={'small'}>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Icon</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Stat Changes</TableCell>
                <TableCell>Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{displayUpgrades.map(renderUpgradeRow)}</TableBody>
          </Table>
        </TableContainer>
      : <Typography variant={'body1'} color={'text.secondary'}>
        {goal === 'cropValue' && isCropValueCapped(account)
          ? "Every plot is already at the game's crop multiplier cap, so more crop value bonus buys nothing. Spend the points on another category."
          : "No viable upgrades found for this category - they're either all maxed, or still locked behind a higher total rank."}
      </Typography>}
  </Stack>
};

export default UpgradeOptimizer;

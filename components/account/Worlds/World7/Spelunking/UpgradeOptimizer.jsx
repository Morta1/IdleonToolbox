import React, { useContext, useId } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import NumberField from '@components/common/NumberField';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import ViewSwitch from '@components/common/ViewSwitch';
import Notice from '@components/common/Notice';
import { cleanUpgradeName } from '@utility/goals/registry/names';
import { useLocalStorage } from '@mantine/hooks';
import { getOptimizedSpelunkingPowerUpgrades, getOptimizedSpelunkingAmberGainUpgrades, getAmberIndex, getAmberDenominator } from '@parsers/world-7/spelunking';
import { clampCustomMax, MAX_CUSTOM_UPGRADES } from '@parsers/genericUpgradeOptimizer';

const maxUpgradesOptions = [5, 10, 25, 50, 100, 200, 300];
const groupModes = ['None', 'Upgrade', 'Summary'];
const optimizationCategorys = ['Power', 'Amber Gain', 'All'];
// The level as every upgrade page writes it: Lv 2,626 / 99,999.
const formatLevel = (upgrade) => formatNum(upgrade?.level, 'level', { max: Number.isFinite(upgrade?.x3) ? upgrade.x3 : null });
// A grouped step's levels, a → b in commas like every level
const levelRange = (upgrade) => `${formatNum(upgrade?.startLevel ?? 0)} → ${formatNum(upgrade?.finalLevel ?? 0)}`;

const UpgradeOptimizer = ({ character, account }) => {
  const { state } = useContext(AppContext);
  // Each Select is named by its label, not its value, for a screen reader
  const fieldId = useId();
  const [maxUpgrades, setMaxUpgrades] = useLocalStorage({
    key: 'spelunkingUpgradeOptimizer:maxUpgrades',
    defaultValue: 10
  });
  const [maxUpgradesMode, setMaxUpgradesMode] = useLocalStorage({
    key: 'spelunkingUpgradeOptimizer:maxUpgradesMode',
    defaultValue: 'preset'
  });
  const [customMaxUpgrades, setCustomMaxUpgrades] = useLocalStorage({
    key: 'spelunkingUpgradeOptimizer:customMaxUpgrades',
    defaultValue: 10
  });
  const [onlyAffordable, setOnlyAffordable] = useLocalStorage({
    key: 'spelunkingUpgradeOptimizer:onlyAffordable',
    defaultValue: false
  });
  const [viewMode, setViewMode] = useLocalStorage({
    key: 'spelunkingUpgradeOptimizer:viewMode',
    defaultValue: 'grid'
  });
  const [groupMode, setGroupMode] = useLocalStorage({
    key: 'spelunkingUpgradeOptimizer:groupMode',
    defaultValue: 'None'
  });
  const [optimizationCategory, setOptimizationCategory] = useLocalStorage({
    key: 'spelunkingUpgradeOptimizer:optimizationCategory',
    defaultValue: 'Power'
  });

  const denominator = getAmberDenominator(account);
  const amberIndex = getAmberIndex(account);

  let optimizedUpgrades = [];
  if (character && account) {
    const maxToUse = maxUpgradesMode === 'custom'
      ? clampCustomMax(customMaxUpgrades)
      : maxUpgrades;

    const characters = state?.characters || [];

    const getUpgradesForCategory = (category, limit, useOnlyAffordable) => {
      const options = { onlyAffordable: useOnlyAffordable, characters };
      const upgrades = category === 'Amber Gain'
        ? getOptimizedSpelunkingAmberGainUpgrades(character, account, limit, options)
        : getOptimizedSpelunkingPowerUpgrades(character, account, limit, options);
      return upgrades.map(upgrade => ({ ...upgrade, category }));
    };

    if (optimizationCategory === 'All') {
      if (onlyAffordable) {
        const powerUpgrades = getUpgradesForCategory('Power', maxToUse * 2, false);
        const amberGainUpgrades = getUpgradesForCategory('Amber Gain', maxToUse * 2, false);

        const allUpgrades = [...powerUpgrades, ...amberGainUpgrades]
          .sort((a, b) => (b.efficiency || 0) - (a.efficiency || 0));

        const availableAmber = account?.spelunking?.currentAmber || 0;
        let cumulativeCost = 0;
        const affordableUpgrades = [];

        for (const upgrade of allUpgrades) {
          const upgradeCost = upgrade.cost || 0;
          if (cumulativeCost + upgradeCost <= availableAmber) {
            cumulativeCost += upgradeCost;
            affordableUpgrades.push(upgrade);
            if (affordableUpgrades.length >= maxToUse) {
              break;
            }
          }
        }

        optimizedUpgrades = affordableUpgrades;
      } else {
        const powerUpgrades = getUpgradesForCategory('Power', maxToUse * 2, false);
        const amberGainUpgrades = getUpgradesForCategory('Amber Gain', maxToUse * 2, false);
        optimizedUpgrades = [...powerUpgrades, ...amberGainUpgrades]
          .sort((a, b) => (b.efficiency || 0) - (a.efficiency || 0))
          .slice(0, maxToUse);
      }
    } else {
      optimizedUpgrades = getUpgradesForCategory(optimizationCategory, maxToUse, onlyAffordable);
    }
  }

  const formatChange = (change) => formatNum(change, 'amount', { signed: true, precise: true });

  const formatPercentChange = (percentChange) => formatNum(percentChange, 'pct', { signed: true, precise: true });

  const amberIcon = `data/CaveAmber${amberIndex}.png`;
  // The game's amber line, over the denominator (Spelunk.AmberDenominator), with its icon
  const amberCost = (cost) => <Stack component={'span'} direction={'row'} alignItems={'center'} gap={0.5}>
    <GameIcon src={amberIcon} size={16} alt={'Amber'}/>{formatGame((cost ?? 0) / denominator, 'Spelunk.AmberDenominator')}
  </Stack>;

  // Helper function to get the change value and label based on upgrade category
  const getChangeInfo = (upgrade, isCombined = false) => {
    const category = upgrade.category || optimizationCategory;
    if (category === 'All') {
      // In "All" mode, prefer the category marked on the upgrade, otherwise detect from available data
      const detectedCategory = upgrade.category || 
        (upgrade.powerChange !== undefined || upgrade.combinedPowerChange !== undefined ? 'Power' : 'Amber Gain');
      if (detectedCategory === 'Amber Gain') {
        return {
          label: 'Amber Gain',
          value: isCombined ? upgrade.combinedAmberGainChange : upgrade.amberGainChange,
          category: 'Amber Gain'
        };
      }
      return {
        label: 'Power',
        value: isCombined ? upgrade.combinedPowerChange : upgrade.powerChange,
        category: 'Power'
      };
    }
    
    if (category === 'Amber Gain') {
      return {
        label: 'Amber Gain',
        value: isCombined ? upgrade.combinedAmberGainChange : upgrade.amberGainChange,
        category: 'Amber Gain'
      };
    }
    
    return {
      label: 'Power',
      value: isCombined ? upgrade.combinedPowerChange : upgrade.powerChange,
      category: 'Power'
    };
  };

  // Group upgrades by name if consolidation is enabled
  let displayUpgrades;
  if (groupMode === 'Upgrade') {
    const consolidatedUpgrades = [];
    let currentGroup = null;
    optimizedUpgrades.forEach((upgrade, index) => {
      const upgradeName = upgrade.name;
      const startLevel = currentGroup && currentGroup.name === upgradeName
        ? currentGroup.startLevel
        : upgrade.level;
      if (!currentGroup || currentGroup.name !== upgradeName) {
        if (currentGroup) {
          currentGroup.finalLevel = currentGroup.startLevel + currentGroup.sequence.length - 1;
          consolidatedUpgrades.push(currentGroup);
        }
        currentGroup = {
          ...upgrade,
          upgradeIndex: index,
          sequence: [{ ...upgrade, originalIndex: index }],
          startLevel
        };
      }
      else {
        currentGroup.sequence.push({ ...upgrade, originalIndex: index });
      }
    });
    if (currentGroup) {
      currentGroup.finalLevel = currentGroup.startLevel + currentGroup.sequence.length - 1;
      consolidatedUpgrades.push(currentGroup);
    }
    displayUpgrades = consolidatedUpgrades.map(upgrade => {
      if (!upgrade.sequence || upgrade.sequence.length <= 1) {
        return upgrade;
      }
      let totalPowerChange = 0;
      let totalAmberGainChange = 0;
      let totalPercentChange = 0;
      let totalCost = 0;
      upgrade.sequence.forEach(seq => {
        totalCost += seq.cost;
        totalPowerChange += seq.powerChange || 0;
        totalAmberGainChange += seq.amberGainChange || 0;
        totalPercentChange += seq.percentChange || 0;
      });
      return {
        ...upgrade,
        combinedPowerChange: totalPowerChange,
        combinedAmberGainChange: totalAmberGainChange,
        combinedPercentChange: totalPercentChange,
        totalCost,
        startLevel: upgrade.startLevel,
        finalLevel: upgrade.finalLevel,
        numberOfUpgrades: upgrade.sequence.length
      };
    });
  }
  else if (groupMode === 'Summary') {
    const grouped = {};
    optimizedUpgrades.forEach((upgrade, index) => {
      if (!grouped[upgrade.name]) {
        grouped[upgrade.name] = {
          ...upgrade,
          upgradeIndex: index,
          startLevel: upgrade.level,
          finalLevel: upgrade.level,
          sequence: [],
          totalCost: 0,
          combinedPowerChange: 0,
          combinedAmberGainChange: 0,
          combinedPercentChange: 0
        };
      }

      const g = grouped[upgrade.name];
      g.sequence.push(upgrade);
      g.finalLevel = Math.max(g.finalLevel, upgrade.level);
      g.totalCost += upgrade.cost;
      g.combinedPowerChange += upgrade.powerChange || 0;
      g.combinedAmberGainChange += upgrade.amberGainChange || 0;
      g.combinedPercentChange += upgrade.percentChange || 0;
    });

    displayUpgrades = Object.values(grouped);
  }
  else {
    displayUpgrades = optimizedUpgrades.map((upgrade, index) => ({ ...upgrade, upgradeIndex: index }));
  }

  // A change: its label, then the amount and its percent (a group's combined one, or the step's own)
  const changeRow = (upgrade, combined) => {
    const changeInfo = getChangeInfo(upgrade, combined);
    return [changeInfo.label, `${formatChange(changeInfo.value)} (${formatPercentChange(combined ? upgrade.combinedPercentChange : upgrade.percentChange)})`];
  };
  const isCombined = (upgrade) => upgrade.sequence?.length > 1
    && (upgrade.combinedPowerChange !== undefined || upgrade.combinedAmberGainChange !== undefined);

  // A row's change: a group's combined one, else the step's own. The Level column already names a group's levels.
  const changeCell = (upgrade) => {
    const [label, amount] = changeRow(upgrade, isCombined(upgrade));
    return `${label}: ${amount}`;
  };
  const upgradeColumns = [
    {
      key: 'name',
      label: 'Name',
      icon: (upgrade) => <GameIcon src={`data/CaveShopUpg${upgrade.originalIndex}.png`} alt={''} size={32}/>,
      render: (upgrade) => cleanUpgradeName(upgrade.name)
    },
    ...(optimizationCategory === 'All' ? [{ key: 'category', label: 'Category', render: (upgrade) => upgrade.category || 'Unknown' }] : []),
    {
      key: 'level',
      label: 'Level',
      cellSx: { whiteSpace: 'nowrap' },
      render: (upgrade) => (upgrade.sequence?.length > 1 ? `Lv ${levelRange(upgrade)}` : formatLevel(upgrade))
    },
    {
      key: 'change',
      label: optimizationCategory === 'All' ? 'Change' : optimizationCategory === 'Amber Gain' ? 'Amber gain change' : 'Power change',
      render: changeCell
    },
    {
      key: 'cost',
      label: 'Cost',
      numeric: true,
      sortable: true,
      phone: true,
      value: (upgrade) => (upgrade.sequence?.length > 1 && upgrade.totalCost ? upgrade.totalCost : upgrade.cost),
      render: (upgrade) => <Stack direction="row" justifyContent="flex-end">
        {amberCost(upgrade.sequence?.length > 1 && upgrade.totalCost ? upgrade.totalCost : upgrade.cost)}
      </Stack>
    }
  ];

  const renderUpgradeCard = (upgrade, index) => {
    const position = upgrade.upgradeIndex ?? index;
    const combined = isCombined(upgrade);
    const step = upgrade.sequence?.length > 1
      ? `Upgrades #${position + 1} to #${position + upgrade.sequence.length}`
      : `Upgrade #${position + 1}`;
    return <ItemCard key={position} icon={`data/CaveShopUpg${upgrade.originalIndex}.png`} title={cleanUpgradeName(upgrade.name)}
                     level={{ value: upgrade.level, max: Number.isFinite(upgrade?.x3) ? upgrade.x3 : null }}
                     meta={[step, optimizationCategory === 'All' ? upgrade.category : null].filter(Boolean).join(' · ')}
                     footer={<ItemCard.Facts rows={[[combined ? 'Total cost' : 'Cost', amberCost(combined ? upgrade.totalCost : upgrade.cost)]]}/>}>
      {combined
        ? <ItemCard.Section label={`Total benefits (Lv ${levelRange(upgrade)})`}>
          <ItemCard.Facts rows={[changeRow(upgrade, true)]}/>
        </ItemCard.Section>
        : <ItemCard.Facts rows={[changeRow(upgrade, false)]}/>}
    </ItemCard>;
  };
  const categoryNoun = optimizationCategory === 'All' ? '' : `${optimizationCategory.toLowerCase()} `;

  return (
    <Stack gap={3}>
      {/* Decision 10: the plan's settings stay in this tab, bottoms aligned so the checkbox sits on the fields' line */}
      <Stack direction="row" gap={2} alignItems="flex-end" flexWrap="wrap">
        <FormControl size="small" sx={{ width: 180 }}>
          <InputLabel id={`${fieldId}-category`}>Optimization category</InputLabel>
          <Select
            labelId={`${fieldId}-category`}
            value={optimizationCategory}
            label="Optimization category"
            onChange={(e) => setOptimizationCategory(e.target.value)}
          >
            {optimizationCategorys.map(mode => (
              <MenuItem key={mode} value={mode}>{mode}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 160 }}>
          <InputLabel id={`${fieldId}-max`}>Max upgrades</InputLabel>
          <Select
            labelId={`${fieldId}-max`}
            value={maxUpgradesMode === 'custom' ? 'custom' : maxUpgrades}
            label="Max upgrades"
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'custom') {
                setMaxUpgradesMode('custom');
              }
              else {
                setMaxUpgradesMode('preset');
                setMaxUpgrades(val);
              }
            }}
          >
            {maxUpgradesOptions.map(max => (
              <MenuItem key={max} value={max}>{max}</MenuItem>
            ))}
            <MenuItem value={'custom'}>Custom</MenuItem>
          </Select>
        </FormControl>
        {maxUpgradesMode === 'custom' && (
          <NumberField
            label="Custom max"
            value={customMaxUpgrades === '' || customMaxUpgrades == null ? null : clampCustomMax(customMaxUpgrades)}
            min={1}
            max={MAX_CUSTOM_UPGRADES}
            integer
            help={false}
            sx={{ width: 120 }}
            onChange={(next) => setCustomMaxUpgrades(next ?? '')}
          />
        )}
        <FormControl size="small" sx={{ width: 120 }}>
          <InputLabel id={`${fieldId}-group`}>Group mode</InputLabel>
          <Select
            labelId={`${fieldId}-group`}
            value={groupMode}
            label="Group mode"
            onChange={(e) => setGroupMode(e.target.value)}
          >
            {groupModes.map(group => (
              <MenuItem key={group} value={group}>{group}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Checkbox
              checked={onlyAffordable}
              onChange={(e) => setOnlyAffordable(e.target.checked)}
              size="small"
            />
          }
          label="Only show affordable upgrades"
        />
        {/* The key and its values stay: the screens harness seeds spelunkingUpgradeOptimizer:viewMode */}
        <ViewSwitch size={'medium'} label={'View'} options={[['grid', 'Cards'], ['list', 'Table']]} value={viewMode}
                    onChange={setViewMode} sx={{ ml: 'auto' }}/>
      </Stack>

      <Typography variant={'sectionTitle'} component={'h2'}>
        {optimizationCategory === 'All'
          ? 'Recommended upgrade sequence'
          : `Recommended ${optimizationCategory === 'Amber Gain' ? 'Amber Gain' : 'Power'} upgrade sequence`}
      </Typography>
      {displayUpgrades.length > 0 ? (
        viewMode === 'grid' ? (
          <CardGrid size={'m'}>{displayUpgrades.map(renderUpgradeCard)}</CardGrid>
        ) : (
          <DataTable
            columns={upgradeColumns}
            // # keeps the plan's order after a Cost sort, as the optimizer's split view numbers its rows.
            rows={displayUpgrades.map((upgrade, idx) => ({ ...upgrade, displayPosition: idx + 1 }))}
            rowKey={(upgrade) => upgrade.upgradeIndex ?? upgrade.displayPosition}
            rowLabel={(upgrade) => cleanUpgradeName(upgrade.name)}
            rankOf={(upgrade) => upgrade.displayPosition}
            surface={'card'}
          />
        )
      ) : (
        <Notice>{`No viable ${categoryNoun}upgrades found with your current resources.`}</Notice>
      )}
    </Stack>
  );
};

export default UpgradeOptimizer;


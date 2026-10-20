import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { prefix } from '@utility/helpers';
import useCheckbox from '@components/common/useCheckbox';
import { getCompassTotalUpgradeCost } from '@parsers/class-specific/compass';
import useMasterclassCostControls from '../useMasterclassCostControls';
import MasterclassUpgradeCard, { formatNextLevelBonus } from '../MasterclassUpgradeCard';
import { matchesUpgradeSearch } from '../matchesUpgradeSearch';

const Upgrades = ({ account, upgrades, dusts }) => {
  const [sortBy, setSortBy] = useState('default');
  const [searchText, setSearchText] = useState('');
  const [CheckboxEl, hideMaxedUpgrades] = useCheckbox('Hide maxed upgrades');
  const [LockedCheckboxEl, hideLockedUpgrades] = useCheckbox('Hide locked upgrades');
  const { controls, levelsAhead, forceLegendTalent, isOverridden } = useMasterclassCostControls(account);

  const sortUpgrades = (list) => {
    const sorted = [...list];
    if (sortBy === 'cost') {
      return sorted.sort((a, b) => (a.cost || 0) - (b.cost || 0));
    }
    if (sortBy === 'type') {
      return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return list;
  };

  const filterUpgrades = (list) => {
    if (!searchText) return list;
    return list.filter(upgrade => matchesUpgradeSearch(upgrade, searchText));
  };

  const renderUpgradeCard = (upgrade, i, dustType) => {
    const {
      name, cost, description, level, x4, extraData,
      x3, baseIconIndex, index, shapeIcon, unlocksAt, nextLevelBonus, isMulti, bonusDiff, unlocked,
      path
    } = upgrade;
    if (hideMaxedUpgrades && level >= x4) return null;
    if (hideLockedUpgrades && !unlocked) return null;
    if (description === 'Titan_doesnt_exist') return null;
    const owned = dusts?.[dustType || x3]?.value || 0;
    const nextCost = isOverridden ? getCompassTotalUpgradeCost(account, upgrade, level + 1, forceLegendTalent) : cost;
    const targetLevel = Math.min(level + levelsAhead, x4);
    const targetCost = targetLevel > level + 1 ? getCompassTotalUpgradeCost(account, upgrade, targetLevel, forceLegendTalent) : 0;

    let iconIndex = index ?? i;
    if (baseIconIndex != null && baseIconIndex >= 0) iconIndex = baseIconIndex + 106;

    return <MasterclassUpgradeCard key={name + iconIndex}
                                   name={name}
                                   icon={`CompassUpg${iconIndex}`}
                                   frame={shapeIcon}
                                   level={level}
                                   maxLevel={x4}
                                   description={description.replace('$', ``).replace('.00', '')}
                                   nextLevelBonus={formatNextLevelBonus(upgrade)}
                                   extraData={extraData}
                                   currencyIcon={`Dust${dustType ?? x3}_x1`}
                                   owned={owned}
                                   nextCost={nextCost}
                                   targetLevel={targetLevel}
                                   targetCost={targetCost}
                                   unlockText={unlocksAt > 0 ? `Unlocks at ${path}: ${unlocksAt}` : null}
                                   unlocked={unlocked}
                                   goal={{ system: 'compass', entryKey: String(index) }}/>;
  };

  return (
    <Stack direction="column" gap={4}>
      <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
        <FormControl size="small" sx={{ width: 200 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
            <MenuItem value="default">Default</MenuItem>
            <MenuItem value="type">Type</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Search by description or name"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: 250 }}
        />
        {controls}
        <CheckboxEl/>
        <LockedCheckboxEl/>
      </Stack>

      {sortBy === 'type' ? (
        Object.entries(
          upgrades
          .flatMap(({ path, list }) => list.map(upg => ({ ...upg, path })))
          .filter(u => u.description !== 'Titan_doesnt_exist')
            .reduce((acc, upgrade) => {
              if (!acc[upgrade.x3]) acc[upgrade.x3] = [];
              acc[upgrade.x3].push(upgrade);
              return acc;
            }, {})
        ).map(([x3, groupedUpgrades]) => {
          const sortedGroup = filterUpgrades(groupedUpgrades.toSorted((a, b) => (a.cost || 0) - (b.cost || 0)));
          if (sortedGroup.length === 0) return null;

          // If hiding maxed upgrades, check if this category has any visible upgrades
          if (hideMaxedUpgrades) {
            const hasVisibleUpgrades = sortedGroup.some(upgrade => upgrade.level < upgrade.x4);
            if (!hasVisibleUpgrades) return null;
          }
          if (hideLockedUpgrades) {
            const hasVisibleUpgrades = sortedGroup.some(upgrade => upgrade.unlocked);
            if (!hasVisibleUpgrades) return null;
          }


          return (
            <Stack key={x3} direction="column" gap={2}>
              <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
                <Typography variant="h6">Dust Type</Typography>
                <img style={{ objectPosition: '0 -6px' }} src={`${prefix}data/Dust${x3}_x1.png`} alt=""/>
              </Stack>
              <Stack direction="row" gap={2} flexWrap="wrap">
                {sortedGroup.map((upgrade, i) => renderUpgradeCard(upgrade, i, x3))}
              </Stack>
            </Stack>
          );
        })
      ) : (
        upgrades?.map(({ path, list }) => {
          const filtered = filterUpgrades(sortUpgrades(list));
          if (filtered.length === 0) return null;

          // If hiding maxed upgrades, check if this category has any visible upgrades
          if (hideMaxedUpgrades) {
            const hasVisibleUpgrades = filtered.some(upgrade => upgrade.level < upgrade.x4);
            if (!hasVisibleUpgrades) return null;
          }
          if (hideLockedUpgrades) {
            const hasVisibleUpgrades = filtered.some(upgrade => upgrade.unlocked);
            if (!hasVisibleUpgrades) return null;
          }

          return (
            <Stack key={path} direction="column" gap={2}>
              <Typography variant="h6">{path}</Typography>
              <Stack direction="row" gap={2} flexWrap="wrap">
                {filtered.map((upgrade, i) => renderUpgradeCard(({ ...upgrade, path }), i, null))}
              </Stack>
            </Stack>
          );
        })
      )}
    </Stack>
  );
};

export default Upgrades;

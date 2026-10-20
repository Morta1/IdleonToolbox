import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { cleanUnderscore, commaNotation } from '@utility/helpers';
import useCheckbox from '@components/common/useCheckbox';
import MenuItem from '@mui/material/MenuItem';
import { getGrimoireTotalUpgradeCost } from '@parsers/class-specific/grimoire';
import useMasterclassCostControls from '../useMasterclassCostControls';
import MasterclassUpgradeCard from '../MasterclassUpgradeCard';
import { matchesUpgradeSearch } from '../matchesUpgradeSearch';
import UpgradeHelpIcon from '@components/common/UpgradeHelpIcon';

const Upgrades = ({ account, upgrades, bones }) => {
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
    return list;
  };

  const filterUpgrades = (list) => {
    if (!searchText) return list;
    return list.filter(upgrade => matchesUpgradeSearch(upgrade, searchText));
  };

  const filteredUpgrades = filterUpgrades(upgrades);
  const sortedUpgrades = sortUpgrades(filteredUpgrades);

  return (
    <Stack direction="column" gap={4}>
      <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
        <FormControl size="small" sx={{ width: 200 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
            <MenuItem value="default">Default</MenuItem>
            <MenuItem value="cost">Cost</MenuItem>
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

      <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
        {sortedUpgrades?.map((upgrade) => {
          const {
                                  name,
                                  cost,
                                  description,
                                  monsterProgress,
                                  boneType,
                                  unlockLevel,
                                  level,
                                  unlocked,
                                  x4,
                                  index
                                } = upgrade;
          if (hideMaxedUpgrades && level >= x4) return null;
          if (hideLockedUpgrades && !unlocked) return null;
          const owned = bones?.[boneType] || 0;
          const nextCost = isOverridden ? getGrimoireTotalUpgradeCost(account, upgrade, level + 1, forceLegendTalent) : cost;
          const targetLevel = Math.min(level + levelsAhead, x4);
          const targetCost = targetLevel > level + 1 ? getGrimoireTotalUpgradeCost(account, upgrade, targetLevel, forceLegendTalent) : 0;

          return <MasterclassUpgradeCard key={name + index}
                                         name={name}
                                         icon={`GrimoireUpg${index}`}
                                         helpIcon={<UpgradeHelpIcon panel="grimoire" index={index}/>}
                                         level={level}
                                         maxLevel={x4}
                                         description={description.replace('$', ` ${cleanUnderscore(monsterProgress)}`).replace('.00', '')}
                                         currencyIcon={`Bone${boneType}_x1`}
                                         owned={owned}
                                         nextCost={nextCost}
                                         targetLevel={targetLevel}
                                         targetCost={targetCost}
                                         unlockText={unlockLevel > 0 ? `Unlocks at ${commaNotation(unlockLevel)} levels` : null}
                                         unlocked={unlocked}
                                         goal={{ system: 'grimoire', entryKey: String(index) }}/>;
        })}
      </Stack>
    </Stack>
  );
};

export default Upgrades;

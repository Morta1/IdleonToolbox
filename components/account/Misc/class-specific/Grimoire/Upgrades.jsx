import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import useCheckbox from '@components/common/useCheckbox';
import MenuItem from '@mui/material/MenuItem';

const Upgrades = ({ upgrades, bones }) => {
  const [sortBy, setSortBy] = useState('default');
  const [searchText, setSearchText] = useState('');
  const [CheckboxEl, hideMaxedUpgrades] = useCheckbox('Hide maxed upgrades');
  const [LockedCheckboxEl, hideLockedUpgrades] = useCheckbox('Hide locked upgrades');

  const sortUpgrades = (list) => {
    const sorted = [...list];
    if (sortBy === 'cost') {
      return sorted.sort((a, b) => (a.cost || 0) - (b.cost || 0));
    }
    return list;
  };

  const filterUpgrades = (list) => {
    if (!searchText) return list;
    return list.filter(upgrade =>
      upgrade.description &&
      upgrade.description.toLowerCase().includes(searchText.toLowerCase())
    );
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
        <CheckboxEl/>
        <LockedCheckboxEl/>
      </Stack>

      <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
        {sortedUpgrades?.map(({
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
                                }) => {
          if (hideMaxedUpgrades && level >= x4) return null;
          if (hideLockedUpgrades && !unlocked) return null;

          return (
            <Card key={name + index}>
              <CardContent sx={{
                display: 'flex',
                flexDirection: 'column',
                width: 370,
                minHeight: 250,
                height: '100%',
                opacity: unlocked ? 1 : .5
              }}>
                <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
                  <img style={{ width: 32, height: 32 }} src={`${prefix}data/GrimoireUpg${index}.png`}/>
                  <Typography>{cleanUnderscore(name.replace(/[船般航舞製]/, '').replace('(Tap_for_more_info)', '').replace('(#)', ''))} ({numberWithCommas(level)} / {numberWithCommas(x4)})</Typography>
                </Stack>
                <Divider sx={{ my: 1 }}/>
                <Typography>{cleanUnderscore(description.replace('$', ` ${cleanUnderscore(monsterProgress)}`).replace('.00', ''))}</Typography>
                <Divider sx={{ my: 1 }}/>
                <Stack direction={'row'} gap={1} flexWrap={'wrap'} alignItems={'center'}>
                  <img style={{ objectPosition: '0 -6px' }} src={`${prefix}data/Bone${boneType}_x1.png`}/>
                  <Typography>Cost: {notateNumber(bones?.[boneType] || 0)} / {notateNumber(cost, 'Big')}</Typography>
                </Stack>
                <Divider sx={{ my: 1 }}/>
                <Typography>Unlocks at: {commaNotation(unlockLevel)} levels</Typography>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Stack>
  );
};

export default Upgrades;

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import useCheckbox from '@components/common/useCheckbox';

const Upgrades = ({ upgrades, dusts }) => {
  const [sortBy, setSortBy] = useState('default');
  const [searchText, setSearchText] = useState('');
  const [CheckboxEl, hideMaxedUpgrades] = useCheckbox('Hide maxed upgrades');
  const [LockedCheckboxEl, hideLockedUpgrades] = useCheckbox('Hide locked upgrades');

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
    return list.filter(upgrade =>
      upgrade.description &&
      cleanUnderscore(upgrade.description).toLowerCase().includes(searchText.toLowerCase()) || (upgrade.name &&
        cleanUnderscore(upgrade.name).toLowerCase().includes(searchText.toLowerCase())
      ));
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

    let iconIndex = index ?? i;
    if (baseIconIndex >= 0) iconIndex = baseIconIndex + 106;

    return (
      <Card key={name + iconIndex}>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: 370,
            minHeight: 270,
            height: '100%',
            opacity: unlocked ? 1 : 0.5
          }}
        >
          <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center" sx={{ position: 'relative' }}>
            <img style={{ width: 32, height: 32, position: 'absolute', left: 0, top: 0 }}
                 src={`${prefix}data/${shapeIcon}.png`}/>
            <img style={{ width: 32, height: 32, zIndex: 1 }}
                 src={`${prefix}data/CompassUpg${iconIndex}.png`}/>
            <Typography>
              {cleanUnderscore(
                name
                  .replace(/[船般航舞製]/, '')
                  .replace('(Tap_for_more_info)', '')
                  .replace('(#)', '')
              )} ({level} / {x4})
            </Typography>
          </Stack>
          <Divider sx={{ my: 1 }}/>
          <Typography>
            {cleanUnderscore(description.replace('$', ``).replace('.00', ''))}
          </Typography>
          <Divider sx={{ my: 1 }}/>
          {level < x4 ? <>
            <Typography>Next level bonus: {isMulti
              ? notateNumber(1 + nextLevelBonus / 100, 'MultiplierInfo')
              : commaNotation(nextLevelBonus)} (+{bonusDiff.toFixed(2).replace('.00', '')})</Typography>
            <Divider sx={{ my: 1 }}/>
          </> : null}
          {extraData ? <>
            <Typography>{extraData}</Typography>
            <Divider sx={{ my: 1 }}/>
          </> : null}
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
            <img style={{ objectPosition: '0 -6px' }} src={`${prefix}data/Dust${dustType ?? x3}_x1.png`}/>
            {level < x4 ? <Typography>
              Cost: {notateNumber(dusts?.[dustType || x3]?.value || 0)} / {notateNumber(cost, 'Big')}
            </Typography> : <Typography>Maxed</Typography>}
          </Stack>
          {unlocksAt > 0 ? <>
            <Divider sx={{ my: 1 }}/>
            <Typography>Unlocks at {path}: {unlocksAt}</Typography>
          </> : null}
        </CardContent>
      </Card>
    );
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
                <img style={{ objectPosition: '0 -6px' }} src={`${prefix}data/Dust${x3}_x1.png`}/>
              </Stack>
              <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
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
              <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
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

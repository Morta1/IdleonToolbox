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
  Typography
} from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import useCheckbox from '@components/common/useCheckbox';

const Upgrades = ({ upgrades, dusts }) => {
  const [sortBy, setSortBy] = useState('default');
  const [CheckboxEl, hideMaxedUpgrades] = useCheckbox('Hide maxed upgrades');

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

  const renderUpgradeCard = (upgrade, i, dustType) => {
    const {
      name, cost, description, monsterProgress, level, x4,
      x3, baseIconIndex, index, shapeIcon
    } = upgrade;

    if (hideMaxedUpgrades && level >= x4) return null;
    if (description === 'Titan_doesnt_exist') return null;

    let iconIndex = index ?? i;
    if (baseIconIndex) iconIndex = baseIconIndex + 106;

    return (
      <Card key={name + iconIndex}>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: 370,
            minHeight: 250,
            height: '100%',
            opacity: level > 0 ? 1 : 0.5
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
            {cleanUnderscore(description.replace('$', ` ${cleanUnderscore(monsterProgress)}`).replace('.00', ''))}
          </Typography>
          <Divider sx={{ my: 1 }}/>
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
            <img style={{ objectPosition: '0 -6px' }} src={`${prefix}data/Dust${dustType || x3}_x1.png`}/>
            <Typography>
              Cost: {notateNumber(dusts?.[dustType || x3]?.value || 0)} / {notateNumber(cost, 'Big')}
            </Typography>
          </Stack>
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
        <CheckboxEl/>
      </Stack>

      {sortBy === 'type' ? (
        Object.entries(
          upgrades
            .flatMap(({ list }) => list)
            .filter(u => u.description !== 'Titan_doesnt_exist')
            .reduce((acc, upgrade) => {
              if (!acc[upgrade.x3]) acc[upgrade.x3] = [];
              acc[upgrade.x3].push(upgrade);
              return acc;
            }, {})
        ).map(([x3, groupedUpgrades]) => {
          const sortedGroup = groupedUpgrades.toSorted((a, b) => (a.cost || 0) - (b.cost || 0));

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
        upgrades.map(({ path, list }) => {
          const filtered = sortUpgrades(list);
          return (
            <Stack key={path} direction="column" gap={2}>
              <Typography variant="h6">{path}</Typography>
              <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
                {filtered.map((upgrade, i) => renderUpgradeCard(upgrade, i))}
              </Stack>
            </Stack>
          );
        })
      )}
    </Stack>
  );
};

export default Upgrades;

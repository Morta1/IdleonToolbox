import React, { useState } from 'react';
import { Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber, numberWithCommas, prefix } from '@utility/helpers';

const Upgrades = ({ upgrades, bones }) => {
  const [searchText, setSearchText] = useState('');

  const filterUpgrades = (list) => {
    if (!searchText) return list;
    return list.filter(upgrade =>
      upgrade.description &&
      upgrade.description.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const filteredUpgrades = filterUpgrades(upgrades);

  return (
    <Stack direction="column" gap={4}>
      <TextField
        size="small"
        label="Search by description"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        sx={{ width: 250 }}
      />

      <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
        {filteredUpgrades?.map(({
                                  name,
                                  cost,
                                  description,
                                  monsterProgress,
                                  boneType,
                                  unlockLevel,
                                  level,
                                  unlocked,
                                  x4
                                }, index) => {
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

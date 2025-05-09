import { CardTitleAndValue } from '@components/common/styles';
import React, { useState } from 'react';
import { Card, CardContent, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import { cleanUnderscore, msToDate, notateNumber, prefix } from '@utility/helpers';
import { ExpRateCard } from '@components/account/Worlds/World5/Hole/commons';

const getUnlockLevelByIndex = (schematicIndex) => {
  let level = 1;
  let totalSchematics = 0;

  // Level 1 unlocks 4 schematics (indices 0, 1, 2, 3)
  if (schematicIndex <= 3) {
    return 1;  // If the index is 0–3, it's level 1.
  }

  totalSchematics = 4;  // Level 1 unlocks 4 schematics (index 0 to 3)

  // Start from level 2
  level = 2;

  // Loop through each level
  while (totalSchematics <= schematicIndex) {
    if (level % 5 === 0) {
      totalSchematics += 4; // Every 5th level unlocks 4 schematics
    } else {
      totalSchematics += 3; // Other levels unlock 3 schematics
    }
    level++;
  }

  return level - 1;
}

const Engineer = ({ hole }) => {
  const [, engineer] = hole?.villagers || [];
  const [showAll, setShowAll] = useState(false);

  return <>
    <Stack mb={1} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Level'} value={engineer?.level}/>
      <CardTitleAndValue title={'Exp'} value={`${engineer?.exp} / ${engineer?.expReq}`}/>
      <ExpRateCard title={'Exp rate'} expRate={engineer?.expRate}/>
      <CardTitleAndValue title={'Time to level'}
                         value={engineer?.timeLeft >= 0 && engineer?.expRate?.value > 0
                           ? msToDate(engineer?.timeLeft)
                           : '0'}/>
      <CardTitleAndValue title={'Unlocked schematics'} value={`${hole?.unlockedSchematics} / 94`}/>
      <CardTitleAndValue title={'Opals invested'} value={engineer?.opalInvested || '0'} icon={'data/Opal.png'}
                         imgStyle={{ width: 22, height: 22 }}/>
    </Stack>
    <FormControlLabel
      control={<Checkbox checked={showAll} onChange={() => setShowAll(!showAll)}/>}
      name={'Show all schematics'}
      label="Show all schematics"/>
    <Stack direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      {hole?.engineerBonuses?.map(({ index, name, description, unlocked, owned, cost, x2 }, order) => {
        if (!showAll && unlocked) return null;
        const unlocksAt = getUnlockLevelByIndex(order);
        const img = x2 >= 20 ? `HoleJarR${x2 - 20}` : x2 >= 10 ? `HoleHarpNote${x2 - 10}` : `HoleWellFill${x2 + 1}`;
        return <Card key={`upgrade-${index}`}>
          <CardContent sx={{ width: 400, opacity: hole?.unlockedSchematics > order ? 1 : 0.5 }}>
            <Stack direction={'row'} alignItems={'center'}>
              <img src={`${prefix}data/HoleUIbuildUpg${index}.png`}
                   style={{ width: 80, height: 80, objectPosition: '0 10px' }} alt={'upgrade-img'}/>
              <Typography>{cleanUnderscore(name)}</Typography>
            </Stack>
            <Typography>{cleanUnderscore(description)}</Typography>
            {unlocked ? <Typography mt={2} color={'success.light'}>Created ✔</Typography> : <>
              <Stack mt={2}
                     direction={'row'}
                     alignItems={'center'}>
                <Typography>{`${notateNumber(Math.max(0, owned), 'Big')} / ${notateNumber(cost, 'TinyE')}`}</Typography>
                <img src={`${prefix}data/${img}.png`}
                     style={x2 >= 10 ? {} : { width: 50, height: 50 }} alt={'cost-type'}/>
              </Stack>
              {hole?.unlockedSchematics <= order ? <Typography>Unlocks at: {unlocksAt}</Typography> : null}
            </>}
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Engineer;

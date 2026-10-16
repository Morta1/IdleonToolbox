import { CardTitleAndValue } from '@components/common/styles';
import React, { useState } from 'react';
import { Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material';
import { cleanUnderscore, msToDate, notateNumber } from '@utility/helpers';
import { ExpRateCard, HoleCostRow } from '@components/account/Worlds/World5/Hole/commons';
import UpgradeCard, { CardIcon } from '@components/common/UpgradeCard';
import { getHoleResourceIcon } from '@parsers/world-5/hole';

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
  const [showScaling, setShowScaling] = useState(false);

  return <>
    <Stack mb={2} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Level'} value={engineer?.level}/>
      <CardTitleAndValue title={'Exp'} value={`${engineer?.exp} / ${engineer?.expReq}`}/>
      <ExpRateCard title={'Exp rate'} expRate={engineer?.expRate}/>
      <CardTitleAndValue title={'Time to level'}
                         value={engineer?.timeLeft >= 0 && engineer?.expRate?.value > 0
                           ? msToDate(engineer?.timeLeft)
                           : '0'}/>
      <CardTitleAndValue title={'Unlocked schematics'} value={`${hole?.unlockedSchematics} / ${hole?.totalSchematics}`}/>
      <CardTitleAndValue title={'Opals invested'} value={engineer?.opalInvested || '0'} icon={'data/Opal.png'}
                         imgStyle={{ width: 22, height: 22 }}/>
    </Stack>
    <Divider/>
    <Stack direction={'row'} flexWrap={'wrap'}>
      <FormControlLabel
        control={<Checkbox checked={showAll} onChange={() => setShowAll(!showAll)}/>}
        name={'Show all schematics'}
        label="Show all schematics"/>
      <FormControlLabel
        control={<Checkbox checked={showScaling} onChange={() => setShowScaling(!showScaling)}/>}
        name={'Show only scaling schematics'}
        label="Show only scaling schematics"/>
    </Stack>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {hole?.engineerBonuses?.map(({ index, name, description, unlocked, owned, cost, x2, scaling }, order) => {
        if (showScaling && !scaling) return null;
        if (!showScaling && !showAll && unlocked) return null;
        const isLocked = hole?.unlockedSchematics <= order;
        return <UpgradeCard key={`upgrade-${index}`}
                            width={340}
                            dimmed={isLocked}
                            icon={<CardIcon src={`data/HoleUIbuildUpg${index}.png`} alt={''} imgSize={80}/>}
                            title={cleanUnderscore(name)}
                            subtitle={isLocked ? `Unlocks at Lv. ${getUnlockLevelByIndex(order)}` : null}
                            footer={unlocked
                              ? <Typography variant={'body2'} color={'success.light'}>Created ✔</Typography>
                              : <HoleCostRow icon={getHoleResourceIcon(x2)}>
                                {notateNumber(Math.max(0, owned), 'Big')} / {notateNumber(cost, 'TinyE')}
                              </HoleCostRow>}>
          <Typography variant={'body2'}>{cleanUnderscore(description)}</Typography>
        </UpgradeCard>
      })}
    </Stack>
  </>
};

export default Engineer;

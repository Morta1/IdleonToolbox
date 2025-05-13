import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '../../../../../utility/helpers';
import { getShinyBonus } from '../../../../../parsers/breeding';
import { MAX_VIAL_LEVEL } from '@parsers/alchemy';

const Bonuses = ({ list, currentRift, account }) => {
  const getTotalBonus = (riftBonus) => {
    let totalBonus, totalBonusText;
    if (riftBonus === 'Vial_Mastery') {
      const maxedVials = account?.alchemy?.vials?.filter(({ level }) => level === MAX_VIAL_LEVEL);
      totalBonus = `${notateNumber(1 + (2 * maxedVials?.length) / 100, 'MultiplierInfo')}x`;
      totalBonusText = 'Total Vial Boost: ';
    } else if (riftBonus === 'Eclipse_Skulls') {
      const eclipseSkulls = Object.entries(account?.deathNote)?.reduce((sum, [, { mobs }]) => sum + (mobs?.filter(({ kills }) => kills >= 1e9)?.length ?? 0), 0);
      totalBonus = `${eclipseSkulls * 5}%`;
      totalBonusText = 'Total Damage Bonus: ';
    } else if (riftBonus === 'Infinite_Stars') {
      const infiniteStarBonus = 5 + getShinyBonus(account?.breeding?.pets, 'Infinite_Star_Signs');
      totalBonus = `You have ${infiniteStarBonus} infinite star signs`;
      totalBonusText = '';
    }
    return {
      totalBonus,
      totalBonusText
    }
  }
  return <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
    {list?.map(({ monsterName, task, icon, riftBonus, riftBonusIcon, riftDescription }, index) => {
      if (index > 60 || !riftBonus) return;
      const { totalBonusText, totalBonus } = getTotalBonus(riftBonus);
      return <Card key={`${monsterName}-${index}`} sx={{
        width: 300,
        minHeight: 200,
        display: 'flex',
        opacity: index > currentRift && index !== currentRift ? .7 : 1
      }}>
        <CardContent sx={{ width: 300 }}>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <img src={`${prefix}etc/${riftBonusIcon}.png`}
                 alt=""/>
            <Typography>{cleanUnderscore(riftBonus)}</Typography>
          </Stack>
          <Typography variant={'caption'} component={'span'}>{index <= currentRift ?
            <Typography variant={'caption'} color={'success.light'}>Unlocked</Typography> : null} (Unlocks at
            rift {index + 1})</Typography>
          <Divider sx={{ mt: 1 }}/>
          <Typography sx={{ mt: 2 }}>{cleanUnderscore(riftDescription.replace('@', ''))}</Typography>
          {totalBonus || totalBonusText ? <>
            <Divider sx={{ mt: 1 }}/>
            <Typography sx={{ mt: 2 }}>{totalBonusText}{cleanUnderscore(totalBonus)}</Typography>
          </> : null}
        </CardContent>
      </Card>
    })}
  </Stack>
};


export default Bonuses;

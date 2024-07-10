import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import React from 'react';

const RankDatabase = ({ ranks }) => {
  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      {ranks?.map(({ rank, name, upgradeLevel, description, bonus, progress, requirement, unlockAt }, index) => {
        const filter = 99 < upgradeLevel || 0 === (index + 1) % 5 || (24 < upgradeLevel
          ? 'grayscale(1)'
          : .5 < upgradeLevel && 'hue-rotate(330deg)')
        return <Card key={'rank-' + index} sx={{ width: 300, opacity: upgradeLevel === 0 ? .5 : 1 }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'center'} gap={2}>
              <img src={`${prefix}data/RankUpg${index}.png`} style={{ filter }} alt={''}/>
              <Stack>
                <Typography variant={'body1'}>{cleanUnderscore(name)}</Typography>
                <Typography variant={'body1'}>Rank {rank}</Typography>
                {upgradeLevel > 0 ? <Typography
                  variant={'body1'}>{notateNumber(progress)} / {notateNumber(requirement)}</Typography> : <Typography>
                  Unlocks at {unlockAt}
                </Typography>}
              </Stack>
            </Stack>
            <Typography mt={1}
                        variant={'body1'}>{cleanUnderscore(description).replace('{', Math.round(100 * bonus) / 100)}</Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default RankDatabase;

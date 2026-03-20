import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';
import React from 'react';

const RankDatabase = ({ ranks, hasLandRank }) => {
  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      {ranks?.map(({ name, upgradeLevel, description, bonus, progress, requirement, unlockAt }, index) => {
        const filter = 99 < upgradeLevel || 0 === (index + 1) % 5 || (24 < upgradeLevel
          ? 'grayscale(1)'
          : .5 < upgradeLevel && 'hue-rotate(330deg)')
        return <Card key={'rank-' + index} sx={{ width: 300, opacity: upgradeLevel === 0 || !hasLandRank ? .5 : 1 }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'center'} gap={2}>
              <img src={`${prefix}data/RankUpg${index}.png`} style={{ filter }} alt={''}/>
              <Stack>
                <Typography variant={'body1'}>{cleanUnderscore(name)}</Typography>
                <Typography variant={'body1'}>Lv. {hasLandRank ? upgradeLevel : 0}</Typography>
                {upgradeLevel <= 0 ? <Typography>
                  Unlocks at {unlockAt}
                </Typography> : null}
              </Stack>
            </Stack>
            <Typography mt={1}
                        variant={'body1'}>{cleanUnderscore(description).replace('{', hasLandRank ? Math.round(100 * bonus) / 100 : 0)}</Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default RankDatabase;

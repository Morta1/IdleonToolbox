import { Grid, Stack, Typography } from '@mui/material';
import React from 'react';
import { cleanUnderscore } from '@utility/helpers';

const Chips = ({ starSigns, account, character }) => {
  return <Stack>
    <Typography mb={2} variant={'h5'}>Star Signs</Typography>
    <Stack>
      <Grid container>
        {starSigns?.map((starSign, index) => {
          const { starSign: { starName }, bonusIndex, starSignIndex } = starSign || {};
          const realStarSign = account?.starSigns?.[starSignIndex]?.bonuses?.[bonusIndex];
          const isEquipped = character?.starSigns?.filter(({ starName: sName }) => sName === starName)?.length > 0;
          return <Grid display={'flex'} sx={{ position: 'relative' }} justifyContent={'center'} key={`${starName}-${index}`} xs={4} item>
            <Stack sx={{ opacity: isEquipped ? 1 : .5 }}>
              <Typography>{cleanUnderscore(starName)}</Typography>
              <Typography
                variant={'body2'}>{cleanUnderscore(realStarSign?.rawName?.replace('{', realStarSign?.bonus))}</Typography>
            </Stack>
          </Grid>
        })}
      </Grid>
    </Stack>
  </Stack>
};

export default Chips;

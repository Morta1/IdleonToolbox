import { Grid, Stack, Typography } from '@mui/material';
import React from 'react';
import { cleanUnderscore, prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';

const Prayers = ({ prayers, account, character }) => {
  return <Stack>
    <Typography mb={2} variant={'h5'}>Prayers</Typography>
    <Stack>
      <Grid container rowGap={3}>
        {prayers?.map((prayer, index) => {
          const { name, prayerIndex } = prayer || {};
          const realPrayer = account?.prayers?.[prayerIndex];
          const calculatedBonus = realPrayer?.x1 + (realPrayer?.x1 * (realPrayer?.level - 1)) / 10;
          const calculatedCurse = realPrayer?.x2 + (realPrayer?.x2 * (realPrayer?.level - 1)) / 10;
          const isEquipped = character?.prayers?.filter(({ name: pName }) => pName === name)?.length > 0;
          return <Grid display={'flex'} sx={{ position: 'relative' }} justifyContent={'center'} key={`${name}-${index}`} xs={3} item>
            <Tooltip title={<PrayerTooltip {...realPrayer} calculatedBonus={calculatedBonus}
                                           calculatedCurse={calculatedCurse}/>}>
              <img style={{ width: 48, opacity: isEquipped ? 1 : .5 }}
                   src={`${prefix}data/Prayer${prayerIndex}.png`} alt="prayer-icon"/>
            </Tooltip>
          </Grid>
        })}
      </Grid>
    </Stack>
  </Stack>
};

const PrayerTooltip = ({ effect, curse, calculatedBonus, calculatedCurse }) => {
  return <Stack>
    <div><Typography
      sx={{ color: 'success.light' }}>Bonus:</Typography> {cleanUnderscore(effect).replace('{', calculatedBonus)}
    </div>
    <div><Typography
      sx={{ color: 'error.light' }}>Curse:</Typography> {cleanUnderscore(curse).replace('{', calculatedCurse)}
    </div>
  </Stack>
}

export default Prayers;

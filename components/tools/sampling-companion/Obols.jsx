import { Grid, Stack, Typography } from '@mui/material';
import React from 'react';
import { prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';
import ItemDisplay from '@components/common/ItemDisplay';

const Obols = ({ obols, character }) => {
  return <Stack>
    <Typography mb={2} variant={'h5'}>Obols</Typography>
    <Stack>
      <Grid container rowGap={3}>
        {obols?.map((obol, index) => {
          const { displayName } = obol || {};
          const isEquipped = character?.obols?.list?.filter(({ displayName: dName }) => dName === displayName)?.length > 0;
          return <Grid display={'flex'} sx={{ position: 'relative' }} justifyContent={'center'} key={`${displayName}-${index}`} xs={3} item>
            <Tooltip title={<ItemDisplay {...obol}/>}>
              <img width={48} style={{ opacity: isEquipped ? 1 : .5 }} src={`${prefix}data/${obol?.rawName}.png`}
                   alt=""/>
            </Tooltip>
          </Grid>
        })}
      </Grid>
    </Stack>
  </Stack>
};


export default Obols;

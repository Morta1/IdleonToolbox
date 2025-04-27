import { Grid, Stack, Typography } from '@mui/material';
import React from 'react';
import { cleanUnderscore, prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';

const Chips = ({ chips }) => {
  return <Stack>
    <Typography mb={2} variant={'h5'}>Chips</Typography>
    <Stack>
      <Grid container rowGap={3}>
        {chips?.map((chip, index) => {
          const { name } = chip || {};
          return <Grid display={'flex'} sx={{ position: 'relative' }} justifyContent={'center'} key={`${name}-${index}`} xs={3} item>
            <Tooltip title={<ChipTooltip {...chip}/>}>
              <img width={48} src={`${prefix}data/ConsoleChip${chip?.index}.png`} alt=""/>
            </Tooltip>
          </Grid>
        })}
      </Grid>
    </Stack>
  </Stack>
};

const ChipTooltip = ({ name, bonus, baseVal }) => {
  return <>
    <Typography mb={1} fontWeight={'bold'}
                variant={'h6'}>{cleanUnderscore(name.toLowerCase().capitalize())}</Typography>
    <Typography>{cleanUnderscore(bonus?.replace(/{/g, baseVal))}</Typography>
  </>;
}

export default Chips;

import { Badge, Grid, Stack, Typography } from '@mui/material';
import React from 'react';
import { cleanUnderscore, prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';

const Chips = ({ chips, account, character }) => {
  return <Stack>
    <Typography mb={2} variant={'h5'}>Chips</Typography>
    <Stack>
      <Grid container rowGap={3}>
        {chips?.map(({ chip, count }, index) => {
          const { name, index: chipIndex } = chip || {};
          const chipList = account?.lab?.playersChips?.[character?.playerId] || [];
          const chipCount = chipList.filter(({ index: cIndex }) => cIndex === chipIndex).length;
          const hasChip = chipCount >= count;

          return <Grid display={'flex'} sx={{ position: 'relative', opacity: hasChip ? 1 : 0.1 }}
                       justifyContent={'center'} key={`${name}-${index}`}
                       xs={3} item>
            <Tooltip title={<ChipTooltip {...chip} equippedChips={chipCount} count={count}/>}>
              <Badge badgeContent={`${chipCount} / ${count}`}>
                <img width={48} src={`${prefix}data/ConsoleChip${chip?.index}.png`} alt=""/>
              </Badge>
            </Tooltip>
          </Grid>
        })}
      </Grid>
    </Stack>
  </Stack>
};

const ChipTooltip = ({ name, bonus, baseVal, count, equippedChips }) => {
  return <>
    <Typography mb={1} fontWeight={'bold'}
                variant={'h6'}>{cleanUnderscore(name.toLowerCase().capitalize())} ({equippedChips} / {count})</Typography>
    <Typography>{cleanUnderscore(bonus?.replace(/{/g, baseVal))}</Typography>
  </>;
}

export default Chips;

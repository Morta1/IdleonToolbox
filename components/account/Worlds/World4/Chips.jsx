import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '../../../../utility/helpers';
import Tooltip from '../../../Tooltip';
import Box from '@mui/material/Box';
import React from 'react';
import styled from '@emotion/styled';

const chipSlotReq = [5, 10, 15, 25, 35, 50, 75];
const Chips = ({ playerChips, playerLabLevel, charactersPage }) => {
  return (
    <Stack sx={{ height: 'fit-content', ...(charactersPage ? { maxWidth: 250 } : {}) }} direction={'row'}
           alignItems={'center'} flexWrap={'wrap'}
           justifyContent={'center'} gap={3}>
      {playerChips?.map((chip, chipIndex) => {
        const isSlotAvailable = playerLabLevel >= chipSlotReq[chipIndex];
        return <Card key={`${chip?.name}-${chipIndex}`} variant={'outlined'}>
          <CardContent>
            <Stack justifyContent={'center'}>
              {chip !== -1 ? <Tooltip title={<ChipTooltip {...chip}/>}>
                <ChipIcon src={`${prefix}data/ConsoleChip${chip?.index}.png`} alt=""/>
              </Tooltip> : <Box sx={{
                width: 42,
                height: 42, display: 'flex', alignItems: 'center'
              }}>{isSlotAvailable ? '' : `Lv. ${chipSlotReq?.[chipIndex]}`}</Box>}
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  );
};

const ChipIcon = styled.img`
`;
const ChipTooltip = ({ name, bonus, baseVal }) => {
  return <>
    <Typography mb={1} fontWeight={'bold'}
                variant={'h6'}>{cleanUnderscore(name.toLowerCase().capitalize())}</Typography>
    <Typography>{cleanUnderscore(bonus?.replace(/{/g, baseVal))}</Typography>
  </>;
}

export default Chips;

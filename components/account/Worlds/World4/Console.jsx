import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from 'utility/helpers';
import React from 'react';
import Tooltip from 'components/Tooltip';
import Chips from './Chips';

const Console = ({ chips, playersChips, characters }) => {
  return (
    <>
      <Stack gap={1} alignItems={'center'}>
        {playersChips?.map((playerChips, index) => {
          const playerName = characters?.[index]?.name;
          const classIndex = characters?.[index]?.classIndex;
          const playerLabLevel = characters?.[index]?.skillsInfo?.laboratory?.level ?? 0;
          return <Card key={`player-${index}`}>
            <CardContent>
              <Stack direction="row" alignItems={'center'} gap={2}>
                <Stack sx={{ width: 150 }} direction="row" alignItems={'center'} gap={2}>
                  <Stack alignItems={'flex-start'} justifyContent={'center'}>
                    <img width={32} src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
                    <Typography variant={'body1'}>{playerName}</Typography>
                    <Typography variant={'body2'}>Lv. {playerLabLevel}</Typography>
                  </Stack>
                </Stack>
                <Chips playerLabLevel={playerLabLevel} playerChips={playerChips}/>
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
      <Stack direction={'row'} gap={3} justifyContent={'center'} my={5} alignItems={'center'}>
        <Card>
          <CardContent>
            <Stack direction={'row'} gap={2} justifyContent={'center'} flexWrap={'wrap'}>
              {chips?.map((chip, index) => {
                return <Card key={`${chip?.name}-${index}`} variant={'outlined'}>
                  <CardContent>
                    <Stack justifyContent={'center'} alignItems={'center'}>
                      <Tooltip title={<ChipTooltip {...chip}/>}>
                        <img width={32} src={`${prefix}data/ConsoleChip${index}.png`}
                             alt=""/>
                      </Tooltip>
                      {chip?.repoAmount >= 0 ? <div>{chip?.repoAmount}</div> : null}
                    </Stack>
                  </CardContent>
                </Card>
              })}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </>
  );
};

const ChipTooltip = ({ name, bonus, baseVal }) => {
  return <>
    <Typography mb={1} fontWeight={'bold'}
                variant={'h6'}>{cleanUnderscore(name.toLowerCase().capitalize())}</Typography>
    <Typography>{cleanUnderscore(bonus?.replace(/{/g, baseVal))}</Typography>
  </>;
}

export default Console;

import React, { useState } from 'react';
import { Card, CardContent, Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material';
import { cleanUnderscore, findNameCombination, prefix } from '@utility/helpers';
import styled from '@emotion/styled';
import Tooltip from '../../../../Tooltip';

const Tasks = ({ list, currentRift, currentProgress, characters, chars }) => {
  const finishedCharacters = findNameCombination(characters, chars);
  const [minimized, setMinimized] = useState(false);

  return <>
    <FormControlLabel
      control={<Checkbox name={'mini'} checked={minimized}
                         size={'small'}
                         onChange={() => setMinimized(!minimized)}/>}
      label={'Show all tasks'}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {list?.map(({ monsterName, task, icon, riftBonus, riftBonusIcon }, riftIndex) => {
        if ((!minimized && riftIndex < currentRift)) return;
        const isCurrent = currentRift === riftIndex;
        const realTask = isCurrent ? task?.replace('{', currentProgress) : task.split('.')?.[0];
        return <Card key={`${monsterName}-${riftIndex}`} sx={{
          width: 250,
          minHeight: 200,
          display: 'flex',
          border: currentRift === riftIndex ? '2px solid lightblue' : '',
          opacity: riftIndex > currentRift ? .7 : 1
        }}>
          <CardContent sx={{ width: 300 }}>
            <Stack direction={'row'} alignItems={'center'} gap={1}>
              <MonsterIcon src={`${prefix}data/${icon}.png`}
                           alt=""/>
              <Stack>
                <Typography>{cleanUnderscore(monsterName)}</Typography>
                <Typography variant={'caption'} component={'span'}>Rift {riftIndex + 1}</Typography>
              </Stack>
            </Stack>
            <Divider sx={{ mt: 1 }}/>
            <Typography sx={{ mt: 2 }}>{cleanUnderscore(realTask.toLowerCase().capitalize())}</Typography>
            {isCurrent && finishedCharacters?.length > 0 ? <>
              <Divider sx={{ my: 1 }}/>
              {finishedCharacters?.map(({ name, classIndex }, index) => <Tooltip title={name}
                                                                                 key={`${name}-${index}-${riftIndex}`}>
                <img src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
              </Tooltip>)}
            </> : null}
          </CardContent>
        </Card>
      })}
    </Stack></>
};

const MonsterIcon = styled.img`
  width: 34px;
  height: 30px;
  object-fit: none;
  object-position: 0 100%;
`

export default Tasks;

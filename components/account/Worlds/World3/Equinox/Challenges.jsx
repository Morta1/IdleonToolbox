import { Card, CardContent, Checkbox, Chip, FormControlLabel, Stack, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import React, { useState } from 'react';

const Challenges = ({ challenges, completedClouds }) => {
  const [hideCompleted, setHideCompleted] = useState(true);

  return <>
    <FormControlLabel
      control={<Checkbox checked={hideCompleted} onChange={() => setHideCompleted(!hideCompleted)}/>}
      name={'Hide completed challenges'}
      label="Hide completed challenges"/>
    <Stack mb={1} gap={3} direction={'row'} flexWrap={'wrap'}>
      {completedClouds >= challenges?.length && hideCompleted
        ? <Typography variant={'h4'}>No more challenges!</Typography>
        : challenges?.map(({ label, reward, goal, current, active, locked }, index) => {
          if (current === -1 && hideCompleted) return null;
          const readyToClaim = current !== -1 && current >= goal && !active && !locked;
          return <Card key={label + `${index}`} sx={{
            width: 350,
            border: active || readyToClaim ? '1px solid' : '',
            borderColor: active ? 'success.light' : readyToClaim ? 'info.light' : '',
            opacity: locked ? .3 : current === -1 || active || readyToClaim ? 1 : .5
          }}>
            <CardContent>
              <Stack>
                {locked ? <Typography color="warning.main" sx={{ mb: 1 }}>Requires Research G8</Typography> : null}
                {readyToClaim ? <Chip label="Requirements met" color="info" size="small" variant="outlined"
                                      sx={{ mb: 1, alignSelf: 'flex-start', fontSize: 12 }}/> : null}
                <Typography>Challenge: </Typography>
                <Typography>{cleanUnderscore(label.capitalize())}</Typography>
                <Typography sx={{ mt: 3 }}>Reward: </Typography>
                <Typography>{cleanUnderscore(reward)}</Typography>
                {current !== -1 ? <Typography sx={{ mt: 3 }}>Progress: </Typography> : null}
                {current !== -1 ? <Typography>{current}</Typography> : null}
              </Stack>
            </CardContent>
          </Card>
        })}
    </Stack>
  </>;
};

export default Challenges;

import { Card, CardContent, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import StatusText from '@components/common/StatusText';
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
            borderColor: active ? 'success.main' : readyToClaim ? 'info.main' : '',
            opacity: locked ? .3 : current === -1 || active || readyToClaim ? 1 : .5
          }}>
            <CardContent>
              <Stack>
                {locked ? <StatusText status={'locked'} sx={{ mb: 1 }}>Requires Research G8</StatusText> : null}
                {readyToClaim
                  ? <StatusText status={'ready'} sx={{ mb: 1, alignSelf: 'flex-start' }}>Requirements met</StatusText>
                  : null}
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

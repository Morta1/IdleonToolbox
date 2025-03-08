import { Divider, Stack, Typography } from '@mui/material';
import { notateNumber } from '@utility/helpers';
import { Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { getExpDiff } from '@parsers/misc/activeCalculator';
import { AppContext } from '@components/common/context/AppProvider';

const ExpSection = ({ selectedChar, lastUpdated }) => {
  const { state } = useContext(AppContext);
  const [snapshottedChar] = useLocalStorage({ key: 'activeDropPlayer', defaultValue: null });
  const expDiff = getExpDiff(snapshottedChar, state?.characters?.[selectedChar], lastUpdated);

  return <Section title={'Exp'}>
    <Stack>
      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Snapshot</Typography>
      <Typography
        variant="body2">{notateNumber(snapshottedChar?.skillsInfo?.character?.exp)} / {notateNumber(snapshottedChar?.skillsInfo?.character?.expReq)} ({(snapshottedChar?.skillsInfo?.character?.exp / snapshottedChar?.skillsInfo?.character?.expReq * 100).toFixed(2)}%)</Typography>
    </Stack>
    <Stack>
      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Current</Typography>
      <Typography
        variant="body2">{notateNumber(state?.characters?.[selectedChar]?.skillsInfo?.character?.exp)} / {notateNumber(state?.characters?.[selectedChar]?.skillsInfo?.character?.expReq)} ({(state?.characters?.[selectedChar]?.skillsInfo?.character?.exp / state?.characters?.[selectedChar]?.skillsInfo?.character?.expReq * 100).toFixed(2)}%) </Typography>
    </Stack>
    <Stack>
      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Result</Typography>
      <Typography
        variant="body2">Earned: {notateNumber(expDiff?.expEarned)} ({(expDiff?.expEarned / expDiff?.expReq * 100).toFixed(2)}%)</Typography>
      <Divider sx={{ my: .5 }}/>
      <Typography variant="body2">Per min: {notateNumber(expDiff?.expPerMinute)} / min</Typography>
      <Divider sx={{ my: .5 }}/>
      <Typography variant="body2">Per hour: {notateNumber(expDiff?.expPerHour)} / hr</Typography>
      <Divider sx={{ my: .5 }}/>
      <Typography variant="body2">Exp to next level: {notateNumber(expDiff?.expToLevel)}</Typography>
      <Divider sx={{ my: .5 }}/>
      <Typography variant="body2">Time to next level: {expDiff?.timeToLevel}</Typography>
    </Stack>
  </Section>
};

export default ExpSection;

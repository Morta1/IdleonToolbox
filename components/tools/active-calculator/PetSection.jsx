import { Stack, Typography } from '@mui/material';
import { Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { notateNumber, numberWithCommas } from '@utility/helpers';

const PetSection = ({ selectedChar, lastUpdated }) => {
  const { state } = useContext(AppContext);
  const [snapshottedChar] = useLocalStorage({ key: 'activeDropPlayer', defaultValue: null });
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });
  const snapshotProgress = snapshottedAcc?.breeding?.pets?.[0]?.[0]?.progress
  const currentProgress = state?.account?.breeding?.pets?.[0]?.[0]?.progress
  const diff = state?.account?.breeding?.pets?.[0]?.[0]?.progress - snapshottedAcc?.breeding?.pets?.[0]?.[0]?.progress;
  const perMinute = diff / ((lastUpdated - snapshottedAcc?.snapshotTime) / 1000 / 60);

  return <Section title={'Shiny progress'}>
    <Stack>
      <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Snapshot</Typography>
      <Typography variant={'body2'}>Progress: {numberWithCommas(Math.floor(snapshotProgress))}</Typography>
    </Stack>
    <Stack>
      <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Current</Typography>
      <Typography variant={'body2'}>Progress: {numberWithCommas(Math.floor(currentProgress))}</Typography>
    </Stack>
    <Stack>
      <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Result</Typography>
      <Typography variant={'body2'}>Progress: {notateNumber(diff)}</Typography>
      <Typography variant={'body2'}>{notateNumber(perMinute, 'MultiplierInfo')} / min</Typography>
      <Typography variant={'body2'}>{notateNumber(perMinute * 60, 'MultiplierInfo')} / hr</Typography>
    </Stack>
  </Section>
};

export default PetSection;

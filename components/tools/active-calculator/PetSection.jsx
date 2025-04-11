import { Divider, Stack, Typography } from '@mui/material';
import { Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { notateNumber, numberWithCommas } from '@utility/helpers';

const PetSection = ({ lastUpdated, resultsOnly }) => {
  const { state } = useContext(AppContext);
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });

  const snapshotProgress = snapshottedAcc?.breeding?.fencePets?.[0]?.shinyProgress || snapshottedAcc?.breeding?.fencePets?.[0]?.progress;
  const currentProgress = state?.account?.breeding?.fencePets?.[0]?.shinyProgress;
  const diff = currentProgress - snapshotProgress;
  const perMinute = diff / ((lastUpdated - snapshottedAcc?.snapshotTime) / 1000 / 60);

  return <Section title={'Shiny progress'}>
    {!resultsOnly ? <>
      <Stack>
        <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Snapshot</Typography>
        <Typography variant={'body2'}>Progress: {numberWithCommas(Math.floor(snapshotProgress))}</Typography>
      </Stack>
      <Divider flexItem orientation={'vertical'} sx={{ mx: 2 }}/>
      <Stack>
        <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Current</Typography>
        <Typography variant={'body2'}>Progress: {numberWithCommas(Math.floor(currentProgress))}</Typography>
      </Stack>
    </> : null}
    <Stack>
      <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Result</Typography>
      <Typography variant={'body2'}>Progress: {notateNumber(diff)}</Typography>
      <Typography variant={'body2'}>{notateNumber(perMinute, 'MultiplierInfo')} / min</Typography>
      <Typography variant={'body2'}>{notateNumber(perMinute * 60, 'MultiplierInfo')} / hr</Typography>
    </Stack>
  </Section>
};

export default PetSection;

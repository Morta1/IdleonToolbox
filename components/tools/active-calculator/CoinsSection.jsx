import { Stack, Typography } from '@mui/material';
import { Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { getCoinsArray, notateNumber, numberWithCommas } from '@utility/helpers';
import CoinDisplay from '@components/common/CoinDisplay';

const PetSection = ({ selectedChar, lastUpdated }) => {
  const { state } = useContext(AppContext);
  const [snapshottedChar] = useLocalStorage({ key: 'activeDropPlayer', defaultValue: null });
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });
  const snapshotMoney = snapshottedChar?.money;
  const currentMoney = state?.characters?.[selectedChar]?.money;
  const diff = currentMoney - snapshotMoney
  const perMinute = diff / ((lastUpdated - snapshottedAcc?.snapshotTime) / 1000 / 60);

  return <Section title={'Coins'}>
    <Stack>
      <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Snapshot</Typography>
      <CoinDisplay title={''}
                   noShadow
                   money={getCoinsArray(snapshotMoney)}/>
    </Stack>
    <Stack>
      <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Current</Typography>
      <CoinDisplay title={''}
                   noShadow
                   money={getCoinsArray(currentMoney)}/>
    </Stack>
    <Stack>
      <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Result</Typography>
      <CoinDisplay title={''}
                   centered={false}
                   noShadow
                   money={getCoinsArray(diff)}/>
      <CoinDisplay title={'Per minute'}
                   centered={false}
                   noShadow
                   money={getCoinsArray(perMinute)}/>
      <CoinDisplay title={'Per hour'}
                   centered={false}
                   noShadow
                   money={getCoinsArray(perMinute * 60)}/>
    </Stack>
  </Section>
};

export default PetSection;

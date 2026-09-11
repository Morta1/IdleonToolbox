import { Divider, Stack, Typography } from '@mui/material';
import { Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { numberWithCommas, prefix } from '@utility/helpers';

// The Orb drops Orblets into the farming character's inventory, and they only reach the Storage
// Chest once deposited, so the balance is the parser's chest + inventories total. It has to come
// off the account object: the snapshot stores the account alone, not the characters.
const OrbletsSection = ({ lastUpdated, resultsOnly }) => {
  const { state } = useContext(AppContext);
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });
  const snapshotOrblets = snapshottedAcc?.royalGuardian?.orblets;
  const currentOrblets = state?.account?.royalGuardian?.orblets ?? 0;
  const difference = currentOrblets - snapshotOrblets;
  const perHour = (difference / ((lastUpdated - snapshottedAcc?.snapshotTime) / 1000 / 60)) * 60;

  if (!Number.isFinite(snapshotOrblets)) {
    return <Section title={'Orblets'}>
      <Typography variant={'body1'}>Current snapshot is missing orblets, please re-save a snapshot</Typography>
    </Section>
  }

  return <Section title={'Orblets'}
                  tooltip={'Buying Orblet Market upgrades spends orblets, so the result is your net change since the snapshot, not everything the Orb dropped.'}>
    {!resultsOnly ? <>
      <Stack>
        <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Snapshot</Typography>
        <Orblets amount={snapshotOrblets}/>
      </Stack>
      <Divider flexItem orientation={'vertical'} sx={{ mx: 2 }}/>
      <Stack>
        <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Current</Typography>
        <Orblets amount={currentOrblets}/>
      </Stack>
    </> : null}
    <Stack>
      <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Result</Typography>
      <Orblets amount={difference}/>
      {perHour > 0 ? <>
        <Typography variant={'body2'}>{numberWithCommas(Math.floor(perHour))} / hr</Typography>
        <Typography variant={'body2'}>{numberWithCommas(Math.floor(perHour * 24))} / day</Typography>
      </> : null}
    </Stack>
  </Section>
};

const Orblets = ({ amount }) => {
  return <Stack direction={'row'} alignItems={'center'} gap={1}>
    <img style={{ width: 32, height: 32 }} src={`${prefix}data/Orblet.png`} alt=""/>
    <Typography variant={'body2'}>{numberWithCommas(amount)}</Typography>
  </Stack>
}

export default OrbletsSection;

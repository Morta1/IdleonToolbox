import { Divider, Stack, Typography } from '@mui/material';
import { Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { numberWithCommas, prefix } from '@utility/helpers';
import { calcTotalItemInStorage } from '@parsers/storage';

// Orblet is a plain CURRENCY item that the Orb drops straight into the Storage Chest, so the
// balance is read from storage rather than from the snapshotted character's inventory - which is
// why the Total Items section never picks these up.
const OrbletsSection = ({ lastUpdated, resultsOnly }) => {
  const { state } = useContext(AppContext);
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });
  const snapshotOrblets = calcTotalItemInStorage(snapshottedAcc?.storage?.list, 'Orblet');
  const currentOrblets = calcTotalItemInStorage(state?.account?.storage?.list, 'Orblet');
  const difference = currentOrblets - snapshotOrblets;
  const perHour = (difference / ((lastUpdated - snapshottedAcc?.snapshotTime) / 1000 / 60)) * 60;

  if (!snapshottedAcc?.storage?.list) {
    return <Section title={'Orblets'}>
      <Typography variant={'body1'}>Current snapshot is missing storage, please re-save a snapshot</Typography>
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

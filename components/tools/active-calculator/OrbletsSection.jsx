import { Box } from '@mui/material';
import { counter, CounterTable, elapsedHours, Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import Notice from '@components/common/Notice';

// The Orb drops Orblets into the farming character's inventory, and they only reach the Storage
// Chest once deposited, so the balance is the parser's chest + inventories total. It has to come
// off the account object: the snapshot stores the account alone, not the characters.
const OrbletsSection = ({ lastUpdated, resultsOnly }) => {
  const { state } = useContext(AppContext);
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });
  const snapshotOrblets = snapshottedAcc?.royalGuardian?.orblets;

  if (!Number.isFinite(snapshotOrblets)) {
    return <Section title={'Orblets'}>
      <Box sx={{ p: 2 }}><Notice>This snapshot has no orblets: save a new one to compare them.</Notice></Box>
    </Section>;
  }

  return <Section title={'Orblets'}
                  info={'Buying Orblet Market upgrades spends orblets, so the result is your net change since the snapshot, not everything the Orb dropped.'}>
    <CounterTable hours={elapsedHours(lastUpdated, snapshottedAcc?.snapshotTime)} resultsOnly={resultsOnly}
                  rows={[counter('Orblets', snapshotOrblets, state?.account?.royalGuardian?.orblets, { icon: 'data/Orblet.png', game: 'Save.Orblets' })]}/>
  </Section>;
};

export default OrbletsSection;

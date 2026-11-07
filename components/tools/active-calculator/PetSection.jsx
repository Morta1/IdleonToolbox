import { counter, CounterTable, elapsedHours, Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';

const PetSection = ({ lastUpdated, resultsOnly }) => {
  const { state } = useContext(AppContext);
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });

  const snapshotPet = snapshottedAcc?.breeding?.fencePets?.[0];
  const currentPet = state?.account?.breeding?.fencePets?.[0];

  return <Section title={'Pets'}>
    <CounterTable hours={elapsedHours(lastUpdated, snapshottedAcc?.snapshotTime)} resultsOnly={resultsOnly} perMinute rows={[
      counter('Shiny progress', snapshotPet?.shinyProgress || snapshotPet?.progress, currentPet?.shinyProgress, { kind: 'amount' }),
      counter('Breedability progress', snapshotPet?.breedingProgress, currentPet?.breedingProgress, { kind: 'amount' })
    ]}/>
  </Section>;
};

export default PetSection;

import { counter, CounterTable, elapsedHours, Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import GameIcon from '@components/common/GameIcon';
import { LIQUID_INFO } from '@parsers/world-2/alchemy';

const CauldronsSection = ({ lastUpdated, resultsOnly }) => {
  const { state } = useContext(AppContext);
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });
  const snapshot = snapshottedAcc?.alchemy?.liquidCauldrons;
  const current = state?.account?.alchemy?.liquidCauldrons;

  // Every liquid, whatever the two saves hold: a failed section's Now reads "-"
  const bands = LIQUID_INFO.map(({ displayName }, index) => ({
    key: displayName,
    label: displayName,
    icon: <GameIcon src={`data/aJarL${index}.png`} size={24} alt={''}/>,
    rows: [
      counter(`${displayName} cap`, snapshot?.[index]?.decantCap?.progress, current?.[index]?.decantCap?.progress, { kind: 'amount' }),
      counter(`${displayName} rate`, snapshot?.[index]?.decantRate?.progress, current?.[index]?.decantRate?.progress, { kind: 'amount' })
    ]
  }));

  return <Section title={'Cauldrons'}>
    <CounterTable bands={bands} hours={elapsedHours(lastUpdated, snapshottedAcc?.snapshotTime)} resultsOnly={resultsOnly}/>
  </Section>;
};

export default CauldronsSection;

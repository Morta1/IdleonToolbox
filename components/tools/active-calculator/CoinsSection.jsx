import { elapsedHours, Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { Box } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { getCoinsArray } from '@utility/helpers';
import CoinDisplay from '@components/common/CoinDisplay';
import Panel from '@components/common/cards/Panel';

// Coins read as the game draws them, tier by tier. A drop keeps its sign outside the tiers.
const coinsRow = (name, coins) => <Panel.Row key={name} name={name} value={Number.isFinite(coins)
  ? <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
    {coins < 0 ? '-' : null}
    <CoinDisplay dense money={getCoinsArray(Math.abs(coins))}/>
  </Box>
  : '-'}/>;

const CoinsSection = ({ selectedChar, lastUpdated, resultsOnly }) => {
  const { state } = useContext(AppContext);
  const [snapshottedChar] = useLocalStorage({ key: 'activeDropPlayer', defaultValue: null });
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });
  const snapshotMoney = snapshottedChar?.money;
  const currentMoney = state?.characters?.[selectedChar]?.money;
  const diff = currentMoney - snapshotMoney;
  const hours = elapsedHours(lastUpdated, snapshottedAcc?.snapshotTime);

  return <Section title={'Coins'}>
    {resultsOnly ? null : coinsRow('Snapshot', snapshotMoney)}
    {resultsOnly ? null : coinsRow('Now', currentMoney)}
    {coinsRow('Gained', diff)}
    {coinsRow('Per minute', hours ? diff / hours / 60 : NaN)}
    {coinsRow('Per hour', hours ? diff / hours : NaN)}
  </Section>;
};

export default CoinsSection;

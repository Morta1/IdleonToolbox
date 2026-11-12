import React, { useContext } from 'react';
import { Stack } from '@mui/material';
import { formatNum } from '@utility/helpers';
import { AppContext } from '@components/common/context/AppProvider';
import StatTile from '@components/common/cards/StatTile';
import Timer from '@components/common/Timer';
import StatusText from '@components/common/StatusText';

// Hours each placed, unfinished flag still needs: a board slot builds at its boosted rate (flagSpeed), a side column
// slot at the plain board rate
const flagHoursLeft = (construction) => [
  ...(construction?.board ?? []).map((slot) => [slot, slot?.flagSpeed]),
  ...[...(construction?.leftColumn ?? []), ...(construction?.rightColumn ?? [])].map((slot) => [slot, construction?.totalFlaggyRate])
].filter(([slot, rate]) => slot?.flagPlaced && rate > 0 && slot.requiredAmount > slot.currentAmount)
  .map(([slot, rate]) => (slot.requiredAmount - slot.currentAmount) / rate);

// These are the same three totals the game prints on the construction board itself.
const ROWS = [
  { key: 'totalBuildRate', label: 'Build rate' },
  { key: 'totalPlayerExpRate', label: 'Player XP rate' },
  { key: 'totalFlaggyRate', label: 'Flaggy rate' }
];

// The tab's numbers: the value you end up with leads, because after optimizing that is the number being read;
// the change and where it came from are the sub. A failed section has no totals: "-".
const ConstructionStats = ({ construction, optimized }) => {
  const { state } = useContext(AppContext);
  const flagsLeft = flagHoursLeft(construction);
  const nextFlag = flagsLeft.length ? Math.min(...flagsLeft) : null;
  const statTile = ({ key, label }) => {
    const current = construction?.[key];
    const next = optimized?.[key];
    const delta = next == null || current == null ? null : next - current;
    return <StatTile key={key} label={label} value={current == null ? '-' : `${formatNum(next ?? current)}/hr`}
                     sub={delta == null ? undefined : `${formatNum(delta, 'amount', { signed: true })} from ${formatNum(current)}`}/>;
  };
  return <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
    {ROWS.map(statTile)}
    <StatTile label={'Player XP bonus'} value={construction?.totalExpRate == null ? '-' : formatNum(construction.totalExpRate, 'pct')}/>
    {nextFlag != null ? <StatTile label={'Next flag'} sub={`${formatNum(flagsLeft.length)} building`}
                                  value={<Timer type={'countdown'} component={'span'} date={state?.lastUpdated + nextFlag * 3600 * 1000}
                                                placeholder={<StatusText status={'ready'}/>}/>}/> : null}
  </Stack>;
};

export default ConstructionStats;

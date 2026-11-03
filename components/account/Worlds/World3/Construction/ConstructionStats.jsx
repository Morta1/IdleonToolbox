import React from 'react';
import { Stack } from '@mui/material';
import { formatNum } from '@utility/helpers';
import StatTile from '@components/common/cards/StatTile';

// These are the same three totals the game prints on the construction board itself.
const ROWS = [
  { key: 'totalBuildRate', label: 'Build rate' },
  { key: 'totalPlayerExpRate', label: 'Player XP rate' },
  { key: 'totalFlaggyRate', label: 'Flaggy rate' }
];

// The tab's numbers: the value you end up with leads, because after optimizing that is the number being read;
// the change and where it came from are the sub. A failed section has no totals: "-".
const ConstructionStats = ({ construction, optimized }) => {
  const statTile = ({ key, label }) => {
    const current = construction?.[key];
    const next = optimized?.[key];
    const delta = next == null || current == null ? null : next - current;
    return <StatTile key={key} label={label} value={current == null ? '-' : `${formatNum(next ?? current)}/hr`}
                     sub={delta == null ? undefined : `${formatNum(delta, 'amount', { signed: true })} from ${formatNum(current)}`}/>;
  };
  return <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
    {ROWS.map(statTile)}
    <StatTile label={'Player XP bonus'} value={construction?.totalExpRate == null ? '-' : formatNum(construction.totalExpRate, 'pct')}/>
  </Stack>;
};

export default ConstructionStats;

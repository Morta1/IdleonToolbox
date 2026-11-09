import React from 'react';
import { Box } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import Panel from '@components/common/cards/Panel';

// A bonus the game names with a leading "%" is a percent, as its item line prints it ("+12.5%_DROP_RATE"); the rest
// (STR, Weapon Power) are flat amounts. A percent keeps the game's "% LUK" name, so it never shares a label with the
// flat LUK beside it. print(value, percent): each system's own number rule (the vine rounds up).
export const bonusRows = (bonuses, print) => (bonuses ?? []).map(({ name, value }) => {
  const percent = String(name ?? '').startsWith('%');
  return [cleanUnderscore(String(name ?? '')), print(value ?? 0, percent)];
});

// As many columns as the Panel's width holds at about 260 px each, up to 4: two full-width columns put each name about
// 400 px from its value, and Hat Rack's 24 bonuses took 456 px at the top of the page. A line between rows as the Panel
// draws them, none over the first row.
const COLUMNS = [[520, 2], [780, 3], [1040, 4]];
const firstRow = (count) => ({ [`& > :nth-of-type(-n+${count})`]: { borderTop: 0 } });
const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  '& > *': { borderTop: 1, borderColor: 'divider' },
  ...firstRow(1),
  ...Object.fromEntries(COLUMNS.map(([width, count]) => [`@container (min-width: ${width}px)`, {
    gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
    ...firstRow(count)
  }]))
};

// Hat Rack's, Cape Vine's and Gallery's totals: one look on all three, a long list read like a table.
// A guest has no bonus: no Panel, no heading.
const BonusesPanel = ({ rows, ...panel }) => (rows?.length ? <Panel title={'Bonuses'} foldOnPhone {...panel}>
  {/* The Panel's width, not the window's: beside a side ad the Panel is narrower than the window suggests */}
  <Box sx={{ containerType: 'inline-size' }}>
    <Box sx={GRID_SX}>
      {rows.map(([label, value], index) => <Panel.KV key={`${label}-${index}`} label={label} value={value}/>)}
    </Box>
  </Box>
</Panel> : null);

export default BonusesPanel;

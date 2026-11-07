import React from 'react';
import { cleanUnderscore } from '@utility/helpers';
import Panel from '@components/common/cards/Panel';

// A bonus the game names with a leading "%" is a percent, as its item line prints it ("+12.5%_DROP_RATE"); the rest
// (STR, Weapon Power) are flat amounts. A percent keeps the game's "% LUK" name, so it never shares a label with the
// flat LUK beside it. print(value, percent): each system's own number rule (the vine rounds up).
export const bonusRows = (bonuses, print) => (bonuses ?? []).map(({ name, value }) => {
  const percent = String(name ?? '').startsWith('%');
  return [cleanUnderscore(String(name ?? '')), print(value ?? 0, percent)];
});

// Hat Rack's, Cape Vine's and Gallery's totals: one look on all three, label and value rows in two columns from md.
// A guest has no bonus: no Panel, no heading.
const BonusesPanel = ({ rows, ...panel }) => (rows?.length ? <Panel title={'Bonuses'} foldOnPhone {...panel}>
  <Panel.Columns>
    {rows.map(([label, value], index) => <Panel.KV key={`${label}-${index}`} label={label} value={value}/>)}
  </Panel.Columns>
</Panel> : null);

export default BonusesPanel;

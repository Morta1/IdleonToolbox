import React, { useState } from 'react';
import { Autocomplete, TextField, Typography } from '@mui/material';
import { notateNumber } from '@utility/helpers';

// A capped upgrade stops at its cap, so +100 already reaches max on almost every capped one.
const LEVELS_AHEAD = [1, 5, 10, 25, 100];
// Typed values need a ceiling: totals are summed one level at a time and some upgrades (Royal
// Armory past 999, Menagerie boosts) have no cap.
const MAX_LEVELS_AHEAD = 1000;

// +1 is the card's own cost row with nothing added, so it reads as the default view.
const levelsAheadLabel = (amount) => amount === 1 ? 'Current' : `+${amount} levels`;

// Anything without a whole number in it ("Current", "", "abc") falls back to the current level.
const parseLevelsAhead = (value) => {
  const amount = Number.parseInt(String(value).replace(/\D/g, ''), 10);
  return amount >= 1 ? Math.min(amount, MAX_LEVELS_AHEAD) : 1;
};

// Shared "Levels ahead" picker: every upgrade card prices the total cost of buying that many levels.
const useLevelsAhead = () => {
  const [levelsAhead, setLevelsAhead] = useState(1);
  const [levelsInput, setLevelsInput] = useState(levelsAheadLabel(1));

  const picker = <Autocomplete
    freeSolo
    disableClearable
    selectOnFocus
    size="small"
    sx={{ width: 150 }}
    options={LEVELS_AHEAD}
    getOptionLabel={levelsAheadLabel}
    // The presets are always offered: typing "37" would otherwise filter every one of them out.
    filterOptions={(options) => options}
    // No controlled value: MUI would rewrite the text to the value's label on every keystroke that
    // changes it, so "37" would turn into "+3 levels7" mid-typing.
    value={null}
    inputValue={levelsInput}
    // A pick, or Enter on typed text ('createOption'), settles the field on the amount's label.
    onChange={(event, value) => {
      const amount = parseLevelsAhead(value);
      setLevelsAhead(amount);
      setLevelsInput(levelsAheadLabel(amount));
    }}
    onInputChange={(event, value, reason) => {
      if (reason !== 'input') return;
      setLevelsInput(value);
      setLevelsAhead(parseLevelsAhead(value));
    }}
    onBlur={() => setLevelsInput(levelsAheadLabel(levelsAhead))}
    renderInput={(params) => (
      <TextField {...params} label="Levels ahead" inputProps={{
        ...params.inputProps,
        inputMode: 'numeric',
        // A click on a label ("Current", "+5 levels") selects it so typing replaces it; a typed
        // number keeps the caret where it was clicked. Done on click, since a selection made on
        // focus is dropped by the mouseup that follows.
        onClick: (event) => {
          params.inputProps.onClick?.(event);
          if (!/^\d+$/.test(event.target.value)) event.target.select();
        }
      }}/>
    )}
  />;

  return { picker, levelsAhead };
};

// Far enough ahead, some cost curves (Compass within a few hundred levels) sum past the largest
// number JS can hold, and notateNumber renders Infinity as "NaNEInfinity".
export const formatLevelsAheadCost = (cost) => Number.isFinite(cost) ? notateNumber(cost, 'Big') : '∞';

// The "Lv N: cost" line under a card's cost row, for when the picker reaches past the next level.
// indent lines it up with the cost text, past the currency icon.
export const LevelsAheadCaption = ({ targetLevel, targetCost, owned, format = formatLevelsAheadCost, indent = 44 }) => (
  <Typography variant="caption" color="text.secondary" sx={{ pl: `${indent}px` }}>
    {'Lv '}{targetLevel}{': '}
    <Typography component="span" variant="caption" color={owned >= targetCost ? 'success.main' : 'error.light'}>
      {Number.isFinite(targetCost) ? format(targetCost) : '∞'}
    </Typography>
  </Typography>
);

export default useLevelsAhead;

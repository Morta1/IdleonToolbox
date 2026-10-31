import React, { useId, useState } from 'react';
import { InputAdornment, TextField } from '@mui/material';
import { notateNumber, numberWithCommas, parseShorthandNumber } from '@utility/helpers';

// One field for every number a player types (Controls board). A text field, not type="number": no spinner, and the
// mouse wheel never changes it. It reads game notation (1.5B, 3.2e12, 45%) and shows the value it read.

// Exact digits while they stay readable, the game's notation past that.
const plain = (n) => (Math.abs(n) < 1e15 ? numberWithCommas(Math.round(n * 1e4) / 1e4) : notateNumber(n, 'Big'));

const rangeText = (min, max) => {
  if (min != null && max != null) return `${plain(min)} to ${plain(max)}`;
  if (max != null) return `Up to ${plain(max)}`;
  return min != null ? `At least ${plain(min)}` : null;
};

// What the text says, and what is wrong with it. Empty is null: the caller's default.
const readNumber = (text, { min, max, integer }) => {
  if (text.trim() === '') return { value: null, error: null };
  const value = parseShorthandNumber(text);
  if (Number.isNaN(value)) return { value: null, error: 'Enter a number like 1.5B' };
  if (integer && !Number.isInteger(value)) return { value, error: 'Enter a whole number' };
  if (max != null && value > max) return { value, error: `Up to ${plain(max)}` };
  if (min != null && value < min) return { value, error: `At least ${plain(min)}` };
  return { value, error: null };
};

const settle = (value, { min, max, integer }) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, integer ? Math.round(value) : value));

// Letters mean notation (1.5B, 3.2e12): only then is the value it read worth a line.
const NOTATION = /[a-z]/i;

const NumberField = ({
  label,
  value,
  onChange,
  min,
  max,
  defaultValue,
  unit,
  integer = false,
  inputMode = 'decimal',
  disabled,
  fullWidth,
  sx
}) => {
  const id = useId();
  // The text while the player is typing; null otherwise, so the field shows `value`.
  const [draft, setDraft] = useState(null);
  const limits = { min, max, integer };
  const read = draft === null ? { value, error: null } : readNumber(draft, limits);
  const showsRead = draft !== null && read.error === null && read.value !== null && NOTATION.test(draft);
  const help = read.error ?? (showsRead ? `= ${plain(read.value)}` : rangeText(min, max));

  const handleChange = (event) => {
    const text = event.target.value;
    setDraft(text);
    const next = readNumber(text, limits);
    if (next.error === null) onChange(next.value);
  };

  // Leaving the field settles it: past a limit takes the limit, a fraction in a whole-number field rounds,
  // and text that is not a number goes back to the last value.
  const commit = () => {
    if (draft !== null && read.error !== null && read.value !== null) onChange(settle(read.value, limits));
    setDraft(null);
  };

  return <TextField
    id={id}
    label={label}
    value={draft ?? (value == null ? '' : plain(value))}
    placeholder={defaultValue != null ? `${plain(defaultValue)} (default)` : undefined}
    error={read.error !== null}
    helperText={help}
    disabled={disabled}
    fullWidth={fullWidth}
    sx={sx}
    // Editing starts from the plain digits: the grouped "1,234" would read as a decimal comma once a digit goes.
    onFocus={() => setDraft(value == null ? '' : String(value))}
    onChange={handleChange}
    onBlur={commit}
    onKeyDown={(event) => {
      if (event.key === 'Enter') commit();
    }}
    slotProps={{
      htmlInput: { inputMode },
      input: { endAdornment: unit ? <InputAdornment position="end">{unit}</InputAdornment> : null }
    }}
  />;
};

export default NumberField;

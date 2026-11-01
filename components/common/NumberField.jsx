import React, { useId, useState } from 'react';
import { InputAdornment, TextField } from '@mui/material';
import { notateNumber, numberWithCommas, parseShorthandNumber } from '@utility/helpers';

// One field for every number a player types (Controls board). A text field, not type="number": no spinner, and the
// mouse wheel never changes it. It reads game notation (1.5B, 3.2e12, 45%) and shows the value it read.

// Exact digits while they stay readable, the game's notation past that. Exported for text that sits beside a field and
// names one of its numbers (a default), so the two read alike.
export const fieldNumber = (n) => (Math.abs(n) < 1e15 ? numberWithCommas(Math.round(n * 1e4) / 1e4) : notateNumber(n, 'Big'));

const rangeText = (min, max) => {
  if (min != null && max != null) return `${fieldNumber(min)} to ${fieldNumber(max)}`;
  if (max != null) return `Up to ${fieldNumber(max)}`;
  return min != null ? `At least ${fieldNumber(min)}` : null;
};

// The limit a value is past, if any: one being typed, or a saved one from before the limit.
const limitError = (value, { min, max }) => {
  if (value == null) return null;
  if (max != null && value > max) return `Up to ${fieldNumber(max)}`;
  return min != null && value < min ? `At least ${fieldNumber(min)}` : null;
};

// What the text says, and what is wrong with it. Empty is null: the caller's default.
const readNumber = (text, limits) => {
  if (text.trim() === '') return { value: null, error: null };
  const value = parseShorthandNumber(text);
  if (Number.isNaN(value)) return { value: null, error: 'Enter a number like 1.5B' };
  // 1e400 reads as Infinity, which no page can print or add up.
  if (!Number.isFinite(value)) return { value: null, error: 'Enter a smaller number' };
  if (limits.integer && !Number.isInteger(value)) return { value, error: 'Enter a whole number' };
  return { value, error: limitError(value, limits) };
};

const settle = (value, { min, max, integer }) => Math.min(max ?? Number.MAX_VALUE, Math.max(min ?? -Number.MAX_VALUE, integer ? Math.round(value) : value));

// Letters mean notation (1.5B, 3.2e12): only then is the value it read worth a line.
const NOTATION = /[a-z]/i;

// ariaLabel names a field whose label is short or sits beside it. help is the line under it when there is nothing else
// to say (default: the range); false leaves it out, for a field in a row of controls. error is the caller's own message
// (a goal above its max), shown after the field's. onCommit gets the value the field is left with (on leave or Enter),
// null when emptied, for callers that act only then.
const NumberField = ({
  label,
  ariaLabel,
  value,
  onChange,
  onCommit,
  min,
  max,
  defaultValue,
  placeholder,
  unit,
  icon,
  help,
  error,
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
  const read = draft === null ? { value, error: limitError(value, limits) } : readNumber(draft, limits);
  const showsRead = draft !== null && read.error === null && read.value !== null && NOTATION.test(draft);
  const shownError = read.error ?? error ?? null;
  const resting = help === false ? null : help ?? rangeText(min, max);
  const helperText = shownError ?? (showsRead ? `= ${fieldNumber(read.value)}` : resting);

  const handleChange = (event) => {
    const text = event.target.value;
    setDraft(text);
    const next = readNumber(text, limits);
    if (next.error === null) onChange?.(next.value);
  };

  // Leaving the field settles it: past a limit takes the limit, a fraction in a whole-number field rounds,
  // and text that is not a number goes back to the last value.
  const commit = () => {
    if (draft === null) return;
    const settled = read.error !== null && read.value !== null ? settle(read.value, limits) : null;
    if (settled !== null) onChange?.(settled);
    onCommit?.(settled ?? (read.error === null ? read.value : value));
    setDraft(null);
  };

  return <TextField
    id={id}
    label={label}
    value={draft ?? (value == null ? '' : fieldNumber(value))}
    placeholder={defaultValue != null ? `${fieldNumber(defaultValue)} (default)` : placeholder}
    error={shownError !== null}
    helperText={helperText}
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
      htmlInput: { inputMode, 'aria-label': ariaLabel },
      input: {
        startAdornment: icon ? <InputAdornment position="start">{icon}</InputAdornment> : null,
        endAdornment: unit ? <InputAdornment position="end">{unit}</InputAdornment> : null
      }
    }}
  />;
};

export default NumberField;

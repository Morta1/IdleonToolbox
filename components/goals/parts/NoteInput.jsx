import React from 'react';
import { TextField } from '@mui/material';

export const MAX_NOTE_LENGTH = 120;

const NoteInput = ({ value, onChange }) => (
  <TextField
    size="small"
    fullWidth
    label="Note"
    placeholder="Optional"
    value={value}
    slotProps={{ htmlInput: { maxLength: MAX_NOTE_LENGTH }, inputLabel: { shrink: true } }}
    onChange={(e) => onChange(e.target.value)}
  />
);

export default NoteInput;

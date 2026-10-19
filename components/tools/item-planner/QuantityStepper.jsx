import React, { useState } from 'react';
import { Box, IconButton, InputBase } from '@mui/material';
import { IconMinus, IconPlus } from '@tabler/icons-react';
import { sanitizeCount } from '@utility/itemPlanner';

const CONTROL_SIZE = { xs: 44, sm: 36 };

// min 0 lets the minus button ask for 0, which the tracked list treats as "remove"
const QuantityStepper = ({ value, onChange, label, min = 1 }) => {
  const [draft, setDraft] = useState(null);
  const commit = () => {
    if (draft !== null) onChange(sanitizeCount(draft));
    setDraft(null);
  };
  const buttonSx = { width: CONTROL_SIZE, height: CONTROL_SIZE, borderRadius: 0, color: 'text.secondary' };

  return <Box sx={{
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    border: 1,
    borderColor: 'divider',
    borderRadius: 1
  }}>
    <IconButton sx={buttonSx} aria-label={label ? `One fewer ${label}` : 'Fewer'}
                onClick={() => onChange(Math.max(min, value - 1))}>
      <IconMinus size={16}/>
    </IconButton>
    <InputBase
      value={draft ?? String(value)}
      onFocus={() => setDraft(String(value))}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
        }
      }}
      inputProps={{ inputMode: 'numeric', 'aria-label': label ? `${label} count` : 'How many' }}
      sx={{
        width: { xs: 40, sm: 44 },
        height: CONTROL_SIZE,
        borderLeft: 1,
        borderRight: 1,
        borderColor: 'divider',
        '& input': { textAlign: 'center', fontWeight: 500, fontSize: 14 }
      }}
    />
    <IconButton sx={buttonSx} aria-label={label ? `One more ${label}` : 'More'} onClick={() => onChange(value + 1)}>
      <IconPlus size={16}/>
    </IconButton>
  </Box>;
};

export default QuantityStepper;

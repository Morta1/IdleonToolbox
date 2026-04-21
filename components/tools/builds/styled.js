// Shared styled primitives for the builds feature.
// Runtime-parameterised styling (family accent bars, color constants) stays
// in utility/builds/classes.js. Anything that's purely static lives here so
// it's cached once by emotion and has a semantic class name in the DOM.

import { styled } from '@mui/material/styles';
import { Box, Chip, TextField } from '@mui/material';
import { ACCENT } from '@utility/builds/classes';

// Dark paper surface — BuildCard, tab cards, sticky form toolbar, etc.
// Based on Box so callers can compose layout (flex row / column / grid)
// without needing a semantically-wrong Card wrapper.
export const SurfaceCard = styled(Box)({
  background: '#1C252E',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 8,
  boxShadow: 'none'
});

// Compact uppercase tag chip — idle, soft-tinted. Consumers that need a
// selected / hover state should pass `sx` overrides or the MUI `color` prop.
export const TagChip = styled(Chip)({
  height: 20,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0.3,
  textTransform: 'uppercase',
  backgroundColor: 'rgba(255,255,255,0.05)',
  color: 'rgba(255,255,255,0.7)',
  border: '1px solid rgba(255,255,255,0.07)',
  '& .MuiChip-label': { padding: '0 6px' }
});

// Pill-shaped inputs (used in the list filter bar and the form sticky toolbar).
const pillFieldMixin = {
  borderRadius: 999,
  background: 'rgba(255,255,255,0.04)',
  '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.16)' },
  '&.Mui-focused fieldset': {
    borderColor: ACCENT.primary,
    boxShadow: `0 0 0 3px ${ACCENT.primarySoft}`
  }
};

export const PillTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': pillFieldMixin
});

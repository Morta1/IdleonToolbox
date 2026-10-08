import React from 'react';
import Box from '@mui/material/Box';

// Stands in for a missing icon. "World 3" reads as its number; anything else as its first letter.
export const badgeLetter = (label = '') => (/^World \d$/.test(label) ? label.slice(-1) : label.charAt(0)).toUpperCase();

const LetterBadge = ({ label, size, radius, sx }) => <Box aria-hidden="true" data-letter-badge="" sx={{
  width: size, height: size, borderRadius: radius, flexShrink: 0, bgcolor: 'action.hover', color: 'text.secondary',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.55), fontWeight: 600, lineHeight: 1,
  ...sx
}}>{badgeLetter(label)}</Box>;

export default LetterBadge;

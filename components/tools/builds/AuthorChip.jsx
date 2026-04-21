import React from 'react';
import { Typography } from '@mui/material';

const AuthorChip = ({ ownerName, isAnonymous }) => {
  return (
    <Typography variant="body2" color="text.secondary">
      by {isAnonymous ? 'Anonymous' : ownerName || 'Player'}
    </Typography>
  );
};

export default AuthorChip;

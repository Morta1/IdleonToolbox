import { Popover, Typography } from '@mui/material';
import React from 'react';

const Popper = ({ anchorEl, handleClose, message = 'Copied to clipboard!' }) => {
  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined;
  return <Popover
    sx={{ ml: 1 }}
    id={id}
    open={open}
    anchorEl={anchorEl}
    onClose={handleClose}
    anchorOrigin={{
      vertical: 'center',
      horizontal: 'right'
    }}
    transformOrigin={{
      vertical: 'center',
      horizontal: 'left'
    }}
  >
    <Typography sx={{ py: 1, px: 2 }}>{message}</Typography>
  </Popover>
}

export default Popper;

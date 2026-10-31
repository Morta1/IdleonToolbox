import React, { useState } from 'react';
import { Box, ButtonBase, ClickAwayListener } from '@mui/material';
import { IconInfoCircle } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';

const TOUCH = '@media (pointer: coarse)';

// A note that opens from its trigger (Info board). Hover or keyboard focus previews it; a click, a tap or
// Enter keeps it open until a click elsewhere or Esc. The project Tooltip on its own needs a press and hold
// on a phone and never takes focus. The trigger is ButtonBase as a span: the button role, the tab stop,
// Enter and Space and the theme's focus ring, around any content. label names it when its content does not
// (an icon); aria-expanded says it is pinned, which is also how a caller styles that state.
export const NoteTrigger = ({ note, label, maxWidth, sx, children }) => {
  const [pinned, setPinned] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const handleClose = (event) => {
    setPreviewing(false);
    if (event?.key === 'Escape') setPinned(false);
  };

  return <ClickAwayListener onClickAway={() => setPinned(false)}>
    <Box component={'span'} sx={{ display: 'inline-flex', verticalAlign: 'middle' }}>
      <Tooltip
        // A node title with describeChild: the note describes the trigger and never renames it
        title={<span>{note}</span>}
        describeChild
        maxWidth={maxWidth}
        open={pinned || previewing}
        onOpen={() => setPreviewing(true)}
        onClose={handleClose}
        disableTouchListener
      >
        <ButtonBase
          component={'span'}
          disableRipple
          aria-label={label}
          aria-expanded={pinned}
          onClick={(event) => {
            // A note never triggers the card, row or sort header it sits in
            event.stopPropagation();
            setPinned(!pinned);
          }}
          sx={sx}
        >
          {children}
        </ButtonBase>
      </Tooltip>
    </Box>
  </ClickAwayListener>;
};

const INFO_SX = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  // The 24 px button keeps a 16 px line from growing
  my: '-4px',
  color: 'text.muted',
  '&:hover': { color: 'text.primary' },
  '&[aria-expanded="true"]': { color: 'primary.main', bgcolor: 'primary.soft' },
  // 24 px to click, 40 px to tap, drawn around the button so the row does not move. ButtonBase is not an
  // IconButton, so the theme's 40 px touch minimum does not reach it.
  [TOUCH]: { '&::after': { content: '""', position: 'absolute', inset: -8, borderRadius: '50%' } }
};

// The outline i after a label: what a number or a rule means, in one to three sentences (Info board).
const InfoButton = ({ label, children, maxWidth, sx }) => (
  <NoteTrigger note={children} label={`About ${label}`} maxWidth={maxWidth}
               sx={[INFO_SX, ...(Array.isArray(sx) ? sx : [sx])]}>
    <IconInfoCircle size={16}/>
  </NoteTrigger>
);

export default InfoButton;

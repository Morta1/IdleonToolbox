import React, { useState } from 'react';
import { Box, ButtonBase, ClickAwayListener } from '@mui/material';
import { IconInfoCircle } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';

const TOUCH = '@media (pointer: coarse)';
// A table note's widest: the viewport less the page's 24 px gutters
const TABLE_NOTE_WIDTH = 'calc(100vw - 48px)';

// A note that opens from its trigger (Info board). Hover or keyboard focus previews it; a click, a tap or
// Enter keeps it open until a click elsewhere or Esc. The project Tooltip on its own needs a press and hold
// on a phone and never takes focus. The trigger is ButtonBase as a span: the button role, the tab stop,
// Enter and Space and the theme's focus ring, around any content. label names it when its content does not
// (an icon); aria-expanded says it is pinned, which is also how a caller styles that state. block makes the trigger
// as wide as its parent, for content that takes the width it is given (a progress bar). table is a note that holds a
// table: it sizes to the table, up to the viewport less the page's gutters, so every column shows without a scroll.
// onPick and phoneOnly make the trigger a picker whose note shows only below 600 px, where the page has no room for
// the picked thing's details beside its grid (Stamps): a click picks, and on a phone it also pins the note.
export const NoteTrigger = ({ note, label, maxWidth, table, sx, block, onPick, phoneOnly, buttonProps, children }) => {
  const [pinned, setPinned] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const handleClose = (event) => {
    setPreviewing(false);
    if (event?.key === 'Escape') setPinned(false);
  };

  return <ClickAwayListener onClickAway={() => setPinned(false)}>
    <Box component={'span'} sx={{ display: block ? 'flex' : 'inline-flex', verticalAlign: 'middle' }}>
      <Tooltip
        // A node title with describeChild: the note describes the trigger and never renames it
        title={<span>{note}</span>}
        describeChild
        maxWidth={table ? TABLE_NOTE_WIDTH : maxWidth}
        open={pinned || previewing}
        onOpen={() => setPreviewing(true)}
        onClose={handleClose}
        disableTouchListener
        slotProps={phoneOnly ? { popper: { sx: { display: { sm: 'none' } } } } : undefined}
      >
        <ButtonBase
          component={'span'}
          disableRipple
          aria-label={label}
          aria-expanded={pinned}
          {...buttonProps}
          onClick={(event) => {
            // A note never triggers the card, row or sort header it sits in
            event.stopPropagation();
            onPick?.(event);
            setPinned(!pinned);
          }}
          sx={[block ? { width: '100%' } : null, ...(Array.isArray(sx) ? sx : [sx])]}
        >
          {children}
        </ButtonBase>
      </Tooltip>
    </Box>
  </ClickAwayListener>;
};

const INFO_SX = {
  // The box is the 16 px glyph, so the i takes the room of the icon it replaced and never pushes a
  // title onto a second line, whatever margin a caller adds. The 24 px click area and the 40 px tap
  // area are drawn around it.
  width: 16,
  height: 16,
  borderRadius: '50%',
  color: 'text.muted',
  '&::before': { content: '""', position: 'absolute', inset: -4, borderRadius: '50%' },
  '&:hover': { color: 'text.primary' },
  // The pinned fill is a 24 px circle: the box's own fill plus a 4 px ring of the same tint.
  '&[aria-expanded="true"]': {
    color: 'primary.main',
    bgcolor: 'primary.soft',
    boxShadow: '0 0 0 4px var(--mui-palette-primary-soft)'
  },
  // ButtonBase is not an IconButton, so the theme's 40 px touch minimum does not reach it.
  [TOUCH]: { '&::after': { content: '""', position: 'absolute', inset: -12, borderRadius: '50%' } }
};

// The outline i after a label: what a number or a rule means, in one to three sentences (Info board).
const InfoButton = ({ label, children, maxWidth, sx }) => (
  <NoteTrigger note={children} label={`About ${label}`} maxWidth={maxWidth}
               sx={[INFO_SX, ...(Array.isArray(sx) ? sx : [sx])]}>
    <IconInfoCircle size={16}/>
  </NoteTrigger>
);

export default InfoButton;

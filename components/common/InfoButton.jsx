import React, { useEffect, useRef, useState } from 'react';
import { Box, ButtonBase, ClickAwayListener } from '@mui/material';
import { IconInfoCircle } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';
import SheetContext from '@components/common/cards/SheetContext';
import { FOCUSABLE } from '@utility/focusable';

const TOUCH = '@media (pointer: coarse)';
// A table note's widest: the viewport less the 16 px every note keeps from the screen's edges (NOTE_POPPER)
const TABLE_NOTE_WIDTH = 'calc(100vw - 32px)';
// A note keeps the page's 16 px gutter from the screen's edges: a phone note opened flush to them
const NOTE_POPPER = { popperOptions: { modifiers: [{ name: 'preventOverflow', options: { padding: 16 } }] } };
const PHONE_NOTE_POPPER = { ...NOTE_POPPER, sx: { display: { sm: 'none' } } };

// A tile note sits 8 px under its tile, from its left edge (Info board): MUI's are 14 and 2 px
const UNDER_TILE_NOTE = { sx: { '.MuiTooltip-popper[data-popper-placement*="bottom"] &': { mt: 1, ml: 0 } } };

// A trigger's click stops at React's root, which a ClickAwayListener on the document never hears, so a pinned note would
// stay pinned under the next one: pinning closes the last.
let closePinned = null;
const pinOne = (setPinned) => {
  if (closePinned !== setPinned) closePinned?.(false);
  closePinned = setPinned;
};
const forgetPin = (setPinned) => {
  if (closePinned === setPinned) closePinned = null;
};

// A note pinned from the keyboard hands the focus to its first control, so its link or button can be reached. The effect
// lives here because the note mounts a render after its trigger is pinned (the Popper's portal).
const NoteBody = ({ bodyRef, takeFocus, children }) => {
  useEffect(() => {
    if (!takeFocus) return;
    const controls = [...(bodyRef.current?.querySelectorAll(FOCUSABLE) ?? [])];
    controls.find((control) => control.getAttribute('tabindex') !== '-1')?.focus({ preventScroll: true });
  }, [takeFocus]);
  return <span ref={bodyRef}>{children}</span>;
};

// A note that opens from its trigger (Info board). Hover or keyboard focus previews it; a click, a tap or
// Enter keeps it open until a click elsewhere or Esc. The project Tooltip on its own needs a press and hold
// on a phone and never takes focus. The trigger is ButtonBase as a span: the button role, the tab stop,
// Enter and Space and the theme's focus ring, around any content. One note is pinned at a time; pinned from the keyboard
// it takes the focus onto its first control, and Esc hands it back. label names it when its content does not
// (an icon); aria-expanded says it is pinned, which is also how a caller styles that state. block makes the trigger
// as wide as its parent, for content that takes the width it is given (a progress bar). table is a note that holds a
// table: it sizes to the table, up to the viewport less the page's gutters, so every column shows without a scroll.
// onPick and phoneOnly make the trigger a picker whose note shows only below 600 px, where the page has no room for
// the picked thing's details beside its grid (Stamps): a click picks, and on a phone it also pins the note.
export const NoteTrigger = ({ note, label, maxWidth, table, sx, block, onPick, phoneOnly, buttonProps, underTile, children }) => {
  const [pinned, setPinned] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [pinnedByKey, setPinnedByKey] = useState(false);
  const triggerRef = useRef(null);
  const noteRef = useRef(null);
  // The focus Esc hands back to the trigger would open its preview again
  const skipFocusPreview = useRef(false);
  // underTile: a StatTile's note opens under the whole tile (its data-stat-tile mark), from its left edge, so the tile's own
  // number stays readable (Info board).
  const tileAnchor = underTile ? { anchorEl: () => triggerRef.current?.closest('[data-stat-tile]') ?? triggerRef.current } : {};

  const handleClose = () => setPreviewing(false);

  // Escape closes the note and nothing else: a drawer or dialog under it stays. In the capture phase, ahead of the Modal
  // that holds the focus; while a note is open it is the top thing on the screen.
  const open = pinned || previewing;
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      if (noteRef.current?.contains(document.activeElement)) {
        skipFocusPreview.current = true;
        triggerRef.current?.focus();
      }
      setPinned(false);
      setPreviewing(false);
    };
    document.addEventListener('keydown', closeOnEscape, true);
    return () => document.removeEventListener('keydown', closeOnEscape, true);
  }, [open]);

  useEffect(() => () => forgetPin(setPinned), []);

  return <ClickAwayListener onClickAway={() => setPinned(false)}>
    <Box component={'span'} sx={{ display: block ? 'flex' : 'inline-flex', verticalAlign: 'middle' }}>
      <Tooltip
        // A node title with describeChild: the note describes the trigger and never renames it
        title={<SheetContext value={null}><NoteBody bodyRef={noteRef} takeFocus={pinned && pinnedByKey}>{note}</NoteBody></SheetContext>}
        describeChild
        maxWidth={table ? TABLE_NOTE_WIDTH : maxWidth}
        open={open}
        onOpen={(event) => {
          if (event?.type === 'focus' && skipFocusPreview.current) {
            skipFocusPreview.current = false;
            return;
          }
          setPreviewing(true);
        }}
        onClose={handleClose}
        disableTouchListener
        placement={underTile ? 'bottom-start' : 'bottom'}
        slotProps={{ popper: { ...(phoneOnly ? PHONE_NOTE_POPPER : NOTE_POPPER), ...tileAnchor }, ...(underTile ? { tooltip: UNDER_TILE_NOTE } : {}) }}
      >
        <ButtonBase
          ref={triggerRef}
          component={'span'}
          disableRipple
          aria-label={label}
          aria-expanded={pinned}
          {...buttonProps}
          onClick={(event) => {
            // A note never triggers the card, row or sort header it sits in
            event.stopPropagation();
            onPick?.(event);
            const next = !pinned;
            // A trigger inside another note leaves that note open: it sits on the note, not beside it
            if (next && !event.currentTarget.closest('[role="tooltip"]')) pinOne(setPinned);
            // A keyboard's click has no click count, and neither has Enter on this span
            setPinnedByKey(event.detail === 0);
            setPinned(next);
          }}
          sx={[block ? { width: '100%' } : null, ...(Array.isArray(sx) ? sx : [sx])]}
        >
          {children}
        </ButtonBase>
      </Tooltip>
    </Box>
  </ClickAwayListener>;
};

// A short value whose exact form opens from it (Info board, a value with a dotted underline). The underline is what says
// there is more behind this number.
export const DottedValue = ({ note, label, table, sx, children }) => <NoteTrigger note={note} label={label} table={table} sx={sx}>
  <Box component={'span'} sx={{ textDecoration: 'underline dotted', textUnderlineOffset: 3, cursor: 'help' }}>{children}</Box>
</NoteTrigger>;

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
const InfoButton = ({ label, children, maxWidth, sx, underTile }) => (
  <NoteTrigger note={children} label={`About ${label}`} maxWidth={maxWidth} underTile={underTile}
               sx={[INFO_SX, ...(Array.isArray(sx) ? sx : [sx])]}>
    <IconInfoCircle size={16}/>
  </NoteTrigger>
);

export default InfoButton;

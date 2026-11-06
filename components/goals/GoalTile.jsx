import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Box, Button, Divider, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import CardGrid from '@components/common/cards/CardGrid';
import { IconDotsVertical, IconNote } from '@tabler/icons-react';
import { editText, goalFace, valueColor } from './parts/format';
import { COMPACT_BUTTON_SX, GoalBar, GoalIcon, GoalMark, GoalValueText, LINE_SX, GoalPin } from './parts/GoalVisuals';
import { displayTitle, goalActions } from './parts/actions';
import GoalEntriesDialog from './GoalEntriesDialog';
import { isUnresolved } from '@utility/goals/resolve';

const CARD_HEIGHT = 80;

// Three fixed rows (name, value, bar and percent) so every card lines up with its neighbours; the actions
// button has its own slot on the value line, so the name keeps the whole first line
const CARD_SX = {
  minWidth: 0,
  height: CARD_HEIGHT,
  boxSizing: 'border-box',
  border: 1,
  borderColor: 'divider',
  borderRadius: 1,
  px: 1,
  py: 0.75,
  display: 'grid',
  gridTemplateRows: '24px 20px 20px',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  columnGap: 1
};

// One goal as a card. Its actions sit in a menu; a range card edits either of its two goals and removes both
// 24px on a desktop; a phone gets a 40px target whose negative margins keep the 24px footprint
const ACTIONS_BUTTON_SX = (theme) => ({
  width: 40,
  height: 40,
  my: '-10px',
  mr: '-12px',
  [theme.breakpoints.up('sm')]: { width: 24, height: 24, my: '-2px', mr: '-4px' }
});

const GoalTile = ({ view, onEdit, onRemove, onTogglePin, source = 'dashboard' }) => {
  const router = useRouter();
  const [menu, setMenu] = useState(null);
  const [entriesOpen, setEntriesOpen] = useState(false);
  const face = goalFace(view);
  const unresolved = isUnresolved(view);
  const reached = view.status === 'reached';
  const { editable, route, openLabel, onOpenPage, onOpenWiki } = goalActions(view, router.query);

  const fromMenu = (action) => {
    const anchor = menu;
    setMenu(null);
    action(anchor);
  };

  return (
    <Box component="li" data-goal-status={view.status} sx={CARD_SX}>
      <Box sx={{ gridRow: 1, gridColumn: '1 / 3', display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
        <GoalPin pinned={view.pinned} onToggle={onTogglePin && !unresolved ? () => onTogglePin(view) : undefined} keepSlot={!!onTogglePin && !unresolved} size={14}/>
        {view.icon ? <GoalIcon src={view.icon} alt="" size={24}/> : null}
        <Typography data-goal-name variant="body2" component="span" sx={{ ...LINE_SX, fontWeight: 500, flexShrink: 1 }}>
          {displayTitle(view)}
        </Typography>
        {view.note ? (
          <Box component="span" sx={{ display: 'inline-flex', color: 'text.secondary', flexShrink: 0 }}>
            <IconNote size={14} aria-label="Has a note" role="img"/>
          </Box>
        ) : null}
      </Box>
      <Box sx={{ gridRow: 2, gridColumn: 2, alignSelf: 'center', display: 'flex' }}>
        {unresolved ? null : (
          <IconButton size="small" aria-label="Goal actions" aria-haspopup="menu" sx={ACTIONS_BUTTON_SX}
                      onClick={(e) => setMenu(e.currentTarget)}>
            <IconDotsVertical size={16}/>
          </IconButton>
        )}
      </Box>
      <Box sx={{ gridRow: 2, gridColumn: unresolved ? '1 / 3' : 1, display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
        <GoalMark mark={face.mark} size={14}/>
        <Typography data-goal-value variant="body2" component="span"
                    sx={{ ...LINE_SX, color: valueColor(view.status), flex: 1 }}>
          <GoalValueText face={face}/>
        </Typography>
        {/* a tier's goal is part of the value; hint captions (Next up, Tracking) wait for the menu */}
        {face.caption && !face.hint && !unresolved ? (
          <Typography data-goal-caption variant="caption" component="span" color="text.secondary"
                      sx={{ ...LINE_SX, flexShrink: 1 }}>
            {face.caption}
          </Typography>
        ) : null}
      </Box>
      <Box sx={{ gridRow: 3, gridColumn: '1 / 3', display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        {face.bar ? (
          <GoalBar progress={view.progress} reached={reached} ready={face.ready} label={displayTitle(view)} sx={{ flex: 1 }}/>
        ) : null}
        {!face.bar && face.barText ? (
          <Typography data-goal-bar-text variant="caption" component="span" color="text.secondary" sx={LINE_SX}>
            {face.barText}
          </Typography>
        ) : null}
        {face.aside ? (
          <Typography data-goal-aside variant="caption" component="span" sx={{ flexShrink: 0 }}
                      color={reached ? 'text.success' : 'text.secondary'}>
            {face.aside}
          </Typography>
        ) : null}
        {unresolved && face.caption ? (
          <Typography data-goal-caption variant="caption" component="span" color="text.secondary"
                      sx={{ ...LINE_SX, flex: 1 }}>
            {face.caption}
          </Typography>
        ) : null}
        {view.status === 'invalid' ? (
          <Button size="small" sx={COMPACT_BUTTON_SX}
                  onClick={(e) => onEdit?.(view, e.currentTarget)}>
            Edit
          </Button>
        ) : null}
        {unresolved ? (
          <Button size="small" color="error" sx={COMPACT_BUTTON_SX}
                  onClick={() => onRemove?.(view)}>
            Remove
          </Button>
        ) : null}
      </Box>
      <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)}>
        {view.note ? (
          <Typography data-goal-note variant="body2" color="text.secondary" sx={{ px: 2, py: 0.5, maxWidth: 280 }}>
            {view.note}
          </Typography>
        ) : null}
        {/* the note above is text, so focus starts on the first action */}
        {editable.map((part, index) => (
          <MenuItem key={part.id} autoFocus={index === 0} onClick={() => fromMenu((anchor) => onEdit?.(part, anchor))}>
            {editText(view, part)}
          </MenuItem>
        ))}
        {route ? (
          <MenuItem component={Link} href={route} onClick={onOpenPage}>{openLabel}</MenuItem>
        ) : null}
        {onOpenWiki ? <MenuItem onClick={() => fromMenu(onOpenWiki)}>Open wiki page</MenuItem> : null}
        {view.kind === 'all' && view.shortCount ? (
          <MenuItem onClick={() => fromMenu(() => setEntriesOpen(true))}>Next up</MenuItem>
        ) : null}
        <Divider/>
        <MenuItem sx={{ color: 'text.error' }} onClick={() => fromMenu(() => onRemove?.(view))}>Remove</MenuItem>
      </Menu>
      {entriesOpen ? <GoalEntriesDialog view={view} source={source} onClose={() => setEntriesOpen(false)}/> : null}
    </Box>
  );
};

// The card grid: as many columns as fit the same width as the rows, one a row on a phone
export const GoalGrid = ({ label, children }) => (
  <CardGrid size={'s'} component={'ul'} aria-label={label} sx={{ listStyle: 'none', m: 0, p: 0 }}>
    {children}
  </CardGrid>
);

export default GoalTile;

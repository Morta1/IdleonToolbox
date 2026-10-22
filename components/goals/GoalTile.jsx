import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Box, Button, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { IconDotsVertical, IconNote } from '@tabler/icons-react';
import { cardLabel, editText, goalFace } from './parts/format';
import { GoalBar, GoalIcon, GoalMark, GoalValueText } from './parts/GoalVisuals';
import { displayTitle, goalActions } from './parts/actions';
import GoalEntriesDialog from './GoalEntriesDialog';
import { isUnresolved } from '@utility/goals/resolve';

export const CARD_HEIGHT = 78;

// Three fixed rows (name and system, value, bar and caption) so every card lines up with its neighbours; the actions
// button has its own slot and never covers the name
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
  gridTemplateRows: '22px 20px 20px',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  columnGap: 1
};
const LINE_SX = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 };

const valueColor = (status) => {
  if (status === 'reached') return 'success.main';
  if (status === 'missing' || status === 'invalid') return 'text.secondary';
  return 'text.primary';
};

// One goal as a card. Its actions sit in a menu; a range card edits either of its two goals and removes both
const GoalTile = ({ view, onEdit, onRemove }) => {
  const router = useRouter();
  const [menu, setMenu] = useState(null);
  const [entriesOpen, setEntriesOpen] = useState(false);
  const face = goalFace(view);
  const missing = view.status === 'missing';
  const unresolved = isUnresolved(view);
  const reached = view.status === 'reached';
  const { editable, route, openLabel, onOpenPage } = goalActions(view, router.query);

  const fromMenu = (action) => {
    const anchor = menu;
    setMenu(null);
    action(anchor);
  };

  return (
    <Box component="li" data-goal-status={view.status} sx={{ ...CARD_SX, opacity: missing ? 0.6 : 1 }}>
      <Box sx={{ gridRow: 1, gridColumn: 1, display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
        <GoalIcon src={view.icon} alt="" size={20}/>
        <Typography data-goal-name variant="body2" component="span" sx={{ ...LINE_SX, fontWeight: 500, flexShrink: 1 }}>
          {displayTitle(view)}
        </Typography>
        {view.note ? (
          <Box component="span" sx={{ display: 'inline-flex', color: 'text.secondary', flexShrink: 0 }}>
            <IconNote size={14} aria-label="Has a note" role="img"/>
          </Box>
        ) : null}
        <Typography data-goal-label variant="caption" component="span" color="text.secondary"
                    sx={{ ...LINE_SX, flexShrink: 100 }}>
          {cardLabel(view)}
        </Typography>
      </Box>
      <Box sx={{ gridRow: '1 / 3', gridColumn: 2, alignSelf: 'start' }}>
        {unresolved ? null : (
          <IconButton size="small" aria-label="Goal actions" aria-haspopup="menu" sx={{ width: 28, height: 28, mr: -0.5 }}
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
        <Typography data-goal-aside variant="caption" component="span" sx={{ flexShrink: 0 }}
                    color={reached ? 'success.main' : 'text.secondary'}>
          {face.aside ?? ''}
        </Typography>
      </Box>
      <Box sx={{ gridRow: 3, gridColumn: '1 / 3', display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        {face.bar ? <GoalBar progress={view.progress} reached={reached} sx={{ flex: 1, minWidth: 40 }}/> : null}
        <Typography data-goal-caption variant="caption" component="span" color="text.secondary"
                    sx={{ ...LINE_SX, flex: face.bar ? 1.5 : 1 }}>
          {face.caption ?? ''}
        </Typography>
        {view.status === 'invalid' ? (
          <Button size="small" sx={{ textTransform: 'none', minWidth: 0, py: 0 }}
                  onClick={(e) => onEdit?.(view, e.currentTarget)}>
            Edit
          </Button>
        ) : null}
        {unresolved ? (
          <Button size="small" color="error" sx={{ textTransform: 'none', minWidth: 0, py: 0 }}
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
        {editable.map((part) => (
          <MenuItem key={part.id} onClick={() => fromMenu((anchor) => onEdit?.(part, anchor))}>
            {editText(view, part)}
          </MenuItem>
        ))}
        {route ? (
          <MenuItem component={Link} href={route} onClick={onOpenPage}>{openLabel}</MenuItem>
        ) : null}
        {view.kind === 'all' && view.shortCount ? (
          <MenuItem onClick={() => fromMenu(() => setEntriesOpen(true))}>Next up</MenuItem>
        ) : null}
        <MenuItem onClick={() => fromMenu(() => onRemove?.(view))}>Remove</MenuItem>
      </Menu>
      {entriesOpen ? <GoalEntriesDialog view={view} onClose={() => setEntriesOpen(false)}/> : null}
    </Box>
  );
};

// The card grid: as many 200px columns as fit
export const GoalGrid = ({ label, children }) => (
  <Box component="ul" aria-label={label} sx={{
    listStyle: 'none',
    m: 0,
    p: 0,
    display: 'grid',
    gap: 1.5,
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))'
  }}>
    {children}
  </Box>
);

export default GoalTile;

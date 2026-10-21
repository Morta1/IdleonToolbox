import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Box, Button, IconButton, Link as MuiLink, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { IconCheck, IconDotsVertical, IconExternalLink, IconPencil, IconX } from '@tabler/icons-react';
import { sessionQuery } from '@utility/nav-query';
import { trackEvent } from '@utility/analytics';
import { cardLabel, closestLinkText, editText, goalName, rangeBoundText, REACHED, valueParts } from './parts/format';
import { GoalBar, GoalIcon } from './parts/GoalVisuals';
import GoalEntriesDialog from './GoalEntriesDialog';

const ACTIONS_CLASS = 'goal-tile-actions';
const SHOWN = '&[data-actions-shown="true"]';
const HOVER = '@media (hover: hover)';
const TOUCH = '@media (hover: none)';

// A pointer reveals the actions on hover or keyboard focus; a touch screen gets the tap menu. A tap on the card shows
// them on any device, since some touch screens report a hover they cannot do
const CARD_SX = {
  position: 'relative',
  minWidth: 0,
  border: 1,
  borderColor: 'divider',
  borderRadius: 1,
  p: 1.5,
  [HOVER]: {
    [`& .${ACTIONS_CLASS}`]: { opacity: 0, pointerEvents: 'none', transition: 'opacity 120ms' },
    [`&:hover .${ACTIONS_CLASS}, &:focus-within .${ACTIONS_CLASS}, ${SHOWN} .${ACTIONS_CLASS}`]: { opacity: 1, pointerEvents: 'auto' }
  },
  [TOUCH]: { [`${SHOWN} .${ACTIONS_CLASS}`]: { display: 'flex' } }
};
const ACTIONS_SX = {
  position: 'absolute',
  top: 6,
  right: 6,
  display: 'flex',
  bgcolor: 'background.paper',
  borderRadius: 1,
  boxShadow: 2,
  [TOUCH]: { display: 'none' }
};
const MENU_BUTTON_SX = { display: 'none', width: 44, height: 44, mr: -1, my: -1, [TOUCH]: { display: 'inline-flex' } };
const LINK_TEXT_SX = {
  mt: 1,
  display: 'block',
  maxWidth: '100%',
  textAlign: 'left',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

// A long name (a tier, a range) wraps to a second line rather than being cut; the grid row stretches every card in it
const CLAMP_SX = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  overflowWrap: 'anywhere',
  minWidth: 0
};

const pageHref = (route, query) => ({ pathname: route, query: sessionQuery(query) });

// A range card edits either of its two goals
const EditButton = ({ view, onEdit }) => {
  const [menu, setMenu] = useState(null);
  if (!view.range) {
    return (
      <IconButton size="small" aria-label="Edit goal" onClick={(e) => onEdit?.(view, e.currentTarget)}>
        <IconPencil size={16}/>
      </IconButton>
    );
  }
  const pick = (part) => {
    const anchor = menu;
    setMenu(null);
    onEdit?.(part, anchor);
  };
  return (
    <>
      <IconButton size="small" aria-label="Edit goal" aria-haspopup="menu" onClick={(e) => setMenu(e.currentTarget)}>
        <IconPencil size={16}/>
      </IconButton>
      <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)}>
        {[view.range.lower, view.range.upper].map((part) => (
          <MenuItem key={part.id} onClick={() => pick(part)}>{rangeBoundText(part)}</MenuItem>
        ))}
      </Menu>
    </>
  );
};

// One goal as a card: name, what it is, the amount you have with the target beside it, and a thin bar.
// An all or group goal links its unmet entries; a range view (pairRanges) removes both of its goals through
// onRemove(view) and edits either one.
const GoalTile = ({ view, onEdit, onRemove }) => {
  const router = useRouter();
  const [menu, setMenu] = useState(null);
  const [entriesOpen, setEntriesOpen] = useState(false);
  const [actionsShown, setActionsShown] = useState(false);
  const missing = view.status === 'missing';
  const reached = view.status === 'reached';
  const { value, target } = valueParts(view, { short: true });
  const linkText = closestLinkText(view);
  const name = missing && !view.icon ? view.label : goalName(view);
  const editable = view.range ? [view.range.lower, view.range.upper] : [view];
  const route = !missing && view.route ? pageHref(view.route, router.query) : null;
  const openLabel = `Open ${view.label} page`;
  const onOpenPage = () => trackEvent('goal_click', { system: view.system, kind: view.kind });

  let valueColor = 'text.primary';
  if (reached) valueColor = 'success.main';
  else if (missing) valueColor = 'text.secondary';

  // A tap on the card itself, not on one of its buttons or links
  const onCardClick = (e) => {
    if (missing || e.target.closest('a, button, [role="menu"]') || !e.currentTarget.contains(e.target)) return;
    setActionsShown(!actionsShown);
  };

  const fromMenu = (action) => {
    const anchor = menu;
    setMenu(null);
    action(anchor);
  };

  return (
    <Box component="li" data-goal-status={view.status} data-actions-shown={actionsShown} onClick={onCardClick}
         sx={{ ...CARD_SX, opacity: missing ? 0.6 : 1 }}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
        <GoalIcon src={view.icon} alt="" size={32}/>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography data-goal-name variant="body2" noWrap sx={{ fontWeight: 500 }}>{name}</Typography>
          <Typography data-goal-label variant="caption" component="p" color="text.secondary" noWrap>
            {cardLabel(view)}
          </Typography>
          {view.note ? (
            <Typography data-goal-note variant="caption" component="p" color="text.secondary" noWrap>
              {view.note}
            </Typography>
          ) : null}
        </Box>
        {!missing ? (
          <IconButton aria-label="Goal actions" aria-haspopup="menu" sx={MENU_BUTTON_SX}
                      onClick={(e) => setMenu(e.currentTarget)}>
            <IconDotsVertical size={18}/>
          </IconButton>
        ) : null}
      </Stack>
      <Stack direction="row" alignItems="baseline" columnGap={0.75} flexWrap="wrap" sx={{ mt: 1, minWidth: 0 }}>
        {reached ? (
          <Box component="span" sx={{ color: 'success.main', alignSelf: 'center', display: 'inline-flex' }}>
            <IconCheck size={18} aria-label={REACHED} role="img"/>
          </Box>
        ) : null}
        <Typography data-goal-value component="span" variant={missing ? 'body2' : 'h6'} color={valueColor}
                    sx={{ ...CLAMP_SX, lineHeight: 1.2 }}>
          {value}
        </Typography>
        {target ? (
          <Typography data-goal-target component="span" variant="body2" color="text.secondary" sx={CLAMP_SX}>
            {target}
          </Typography>
        ) : null}
      </Stack>
      {!missing && view.progress != null ? <GoalBar progress={view.progress} reached={reached} sx={{ mt: 1 }}/> : null}
      {linkText ? (
        <MuiLink component="button" variant="body2" underline="hover" sx={LINK_TEXT_SX}
                 onClick={() => setEntriesOpen(true)}>
          {linkText}
        </MuiLink>
      ) : null}
      {missing ? (
        <Button size="small" color="error" sx={{ mt: 1, textTransform: 'none' }} onClick={() => onRemove?.(view)}>
          Remove
        </Button>
      ) : (
        <Box className={ACTIONS_CLASS} sx={ACTIONS_SX}>
          <EditButton view={view} onEdit={onEdit}/>
          {route ? (
            <IconButton size="small" component={Link} href={route} aria-label={openLabel} onClick={onOpenPage}>
              <IconExternalLink size={16}/>
            </IconButton>
          ) : null}
          <IconButton size="small" aria-label="Remove goal" onClick={() => onRemove?.(view)}>
            <IconX size={16}/>
          </IconButton>
        </Box>
      )}
      <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)}>
        {editable.map((part) => (
          <MenuItem key={part.id} onClick={() => fromMenu((anchor) => onEdit?.(part, anchor))}>
            {editText(view, part)}
          </MenuItem>
        ))}
        {route ? (
          <MenuItem component={Link} href={route} onClick={onOpenPage}>{openLabel}</MenuItem>
        ) : null}
        <MenuItem onClick={() => fromMenu(() => onRemove?.(view))}>Remove</MenuItem>
      </Menu>
      {entriesOpen ? <GoalEntriesDialog view={view} onClose={() => setEntriesOpen(false)}/> : null}
    </Box>
  );
};

// The responsive card grid: as many 205px columns as fit, one column on a phone
export const GoalGrid = ({ label, children }) => (
  <Box component="ul" aria-label={label} sx={{
    listStyle: 'none',
    m: 0,
    p: 0,
    display: 'grid',
    gap: 1.5,
    gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(auto-fill, minmax(205px, 1fr))' }
  }}>
    {children}
  </Box>
);

export default GoalTile;

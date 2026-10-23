import React, { useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Box, Button, ButtonBase, Stack, Typography } from '@mui/material';
import { IconChevronDown, IconNote } from '@tabler/icons-react';
import { editText, goalFace, goalText, valueColor } from './parts/format';
import { COMPACT_BUTTON_SX, CostValue, FOCUS_SX, GoalBar, GoalIcon, GoalMark, GoalValueText, LINE_SX as ONE_LINE_SX, PinnedMark } from './parts/GoalVisuals';
import { displayTitle, goalActions } from './parts/actions';
import GoalEntries from './GoalEntries';
import { isUnresolved } from '@utility/goals/resolve';

const ROW_HEIGHT = 38;

// Fixed slots so the value and the bar sit at the same x in every row. A phone gives the name its own full line and
// puts the value, bar and percent on the second; a tier's goal line shows on a desktop only
const ROW_GRID_SX = {
  display: 'grid',
  alignItems: 'center',
  columnGap: 1,
  width: '100%',
  height: ROW_HEIGHT,
  px: 1,
  textAlign: 'left',
  alignContent: 'center',
  // a desktop row splits into three even parts: the name, the value, and the bar with its percent
  gridTemplateColumns: {
    xs: '24px minmax(0, 1fr) 56px 32px 16px',
    sm: '28px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) 40px 16px'
  },
  gridTemplateRows: { xs: '18px 16px', sm: 'auto' },
  gridTemplateAreas: {
    xs: '"icon name name name chevron" "icon value bar aside chevron"',
    sm: '"icon name value bar aside chevron"'
  }
};
const LINE_SX = { ...ONE_LINE_SX, display: 'block' };
const MAIN_LINE_SX = { ...LINE_SX, fontSize: 14, lineHeight: '18px' };
const SUB_LINE_SX = { ...LINE_SX, fontSize: 12, lineHeight: '16px', color: 'text.secondary' };
// A phone keeps Edit and Remove on the name line so the reason and the amount get the full second line
const UNRESOLVED_GRID_SX = {
  display: 'grid',
  alignItems: 'center',
  alignContent: 'center',
  columnGap: 1,
  height: ROW_HEIGHT,
  px: 1,
  gridTemplateColumns: '24px minmax(0, 1fr) auto',
  gridTemplateRows: '18px 16px',
  gridTemplateAreas: { xs: '"icon name actions" "icon reason reason"', sm: '"icon name actions" "icon reason actions"' }
};
// One text line tall, so the buttons never spill into the reason line under them
// Only a desktop row has room for the caption under the value
const DESKTOP_ONLY_SX = { display: { xs: 'none', sm: 'block' } };

// The one-line slots shared by every row: icon, name over the system, value (over a tier's goal), bar, percent
// An open row lets its name wrap, so a long title is readable in full
const WRAPPED_SX = { whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip' };

const RowSlots = ({ view, face, open = false }) => (
  <>
    <Box component="span" sx={{ gridArea: 'icon', display: 'flex' }}>
      <GoalIcon src={view.icon} alt="" size={24}/>
    </Box>
    <Box component="span" sx={{ gridArea: 'name', minWidth: 0 }}>
      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
        {view.pinned ? <PinnedMark/> : null}
        <Box component="span" data-goal-name sx={{ ...MAIN_LINE_SX, fontWeight: 500, minWidth: 0, ...(open ? WRAPPED_SX : {}) }}>
          {displayTitle(view)}
        </Box>
        {view.note ? (
          <Box component="span" sx={{ display: 'inline-flex', color: 'text.secondary', flexShrink: 0 }}>
            <IconNote size={14} aria-label="Has a note" role="img"/>
          </Box>
        ) : null}
      </Box>
    </Box>
    <Box component="span" sx={{ gridArea: 'value', minWidth: 0 }}>
      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
        <GoalMark mark={face.mark} size={14}/>
        <Box component="span" data-goal-value sx={{
          ...MAIN_LINE_SX,
          fontSize: { xs: 12, sm: 14 },
          lineHeight: { xs: '16px', sm: '18px' },
          color: valueColor(view.status)
        }}>
          <GoalValueText face={face}/>
        </Box>
      </Box>
      {face.caption && !face.hint ? (
        <Box component="span" data-goal-caption sx={{ ...SUB_LINE_SX, ...DESKTOP_ONLY_SX }}>{face.caption}</Box>
      ) : null}
    </Box>
  </>
);

// The bar and the percent beside it (a tier shows its step); an empty slot keeps the row's shape
const ProgressSlots = ({ view, face }) => {
  const reached = view.status === 'reached';
  return (
    <>
      {face.bar ? (
        <Box component="span" sx={{ gridArea: 'bar', alignSelf: 'center' }}>
          <GoalBar progress={view.progress} reached={reached} ready={face.ready} label={displayTitle(view)}/>
        </Box>
      ) : null}
      {!face.bar && face.barText ? (
        <Box component="span" data-goal-bar-text sx={{ ...SUB_LINE_SX, gridArea: 'bar', alignSelf: 'center' }}>
          {face.barText}
        </Box>
      ) : null}
      <Box component="span" data-goal-aside sx={{
        gridArea: 'aside',
        alignSelf: 'center',
        textAlign: 'right',
        fontSize: 12,
        lineHeight: '16px',
        color: reached ? 'success.main' : 'text.secondary'
      }}>
        {face.aside ?? ''}
      </Box>
    </>
  );
};

// The details a tap opens under the row: what the goal asks for, the price, the note, the entries still short and
// the actions
const RowDetails = ({ view, face, id, source, onEdit, onRemove, onTogglePin }) => {
  const router = useRouter();
  const { editable, route, openLabel, onOpenPage } = goalActions(view, router.query);
  const showGoal = view.kind !== 'all' && !view.boolean && !view.watch;
  return (
    <Stack id={id} gap={1} sx={{ px: 1, pb: 1.5, pt: 0.5 }}>
      {showGoal ? <Typography variant="body2" color="text.secondary">{`Goal: ${goalText(view)}`}</Typography> : null}
      {face.cost ? (
        <Typography variant="body2" component="div" color="text.secondary"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          <CostValue cost={face.cost} full/>
        </Typography>
      ) : null}
      {view.note ? (
        <Typography data-goal-note variant="body2" sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
          <Box component="span" sx={{ display: 'inline-flex', color: 'text.secondary', mt: 0.25 }}>
            <IconNote size={14} aria-hidden/>
          </Box>
          {view.note}
        </Typography>
      ) : null}
      {view.kind === 'all' && view.shortCount ? (
        <Stack gap={0.5}>
          <Typography variant="subtitle2" component="h3">Next up</Typography>
          <GoalEntries view={view} source={source}/>
        </Stack>
      ) : null}
      <Stack direction="row" gap={1} flexWrap="wrap">
        {editable.map((part) => (
          <Button key={part.id} size="small" variant="outlined" sx={{ textTransform: 'none' }}
                  onClick={(e) => onEdit?.(part, e.currentTarget)}>
            {editText(view, part)}
          </Button>
        ))}
        {route ? (
          <Button size="small" variant="outlined" component={Link} href={route} onClick={onOpenPage}
                  sx={{ textTransform: 'none' }}>
            {/* the row no longer names its system, so the button does ("Open Bubbles page") */}
            {openLabel}
          </Button>
        ) : null}
        <Button size="small" variant="outlined" sx={{ textTransform: 'none' }} onClick={() => onTogglePin?.(view)}>
          {view.pinned ? 'Unpin' : 'Pin'}
        </Button>
        <Button size="small" color="error" sx={{ textTransform: 'none' }} onClick={() => onRemove?.(view)}>
          Remove
        </Button>
      </Stack>
    </Stack>
  );
};

// A goal that cannot be measured: what went wrong and the entry's current amount (when it is still there) under its
// name, and the fix (Edit when the entry is still there, Remove) always in view where the value and bar would be
const UnresolvedRow = ({ view, face, onEdit, onRemove }) => (
  <Box data-goal-row sx={UNRESOLVED_GRID_SX}>
    <Box component="span" sx={{ gridArea: 'icon', display: 'flex' }}>
      <GoalIcon src={view.icon} alt="" size={24}/>
    </Box>
    <Box component="span" sx={{ gridArea: 'name', display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
      {view.pinned ? <PinnedMark/> : null}
      <Box component="span" data-goal-name sx={{ ...MAIN_LINE_SX, fontWeight: 500, minWidth: 0 }}>{displayTitle(view)}</Box>
    </Box>
    {/* the reason and the entry's current amount share one line */}
    <Box component="span" data-goal-reason sx={{ ...SUB_LINE_SX, gridArea: 'reason' }}>
      <span data-goal-value>{face.value}</span>
      {face.caption ? <>{' · '}<span data-goal-caption>{face.caption}</span></> : null}
    </Box>
    <Box sx={{ gridArea: 'actions', display: 'flex', gap: 0.5 }}>
      {view.status === 'invalid' ? (
        <Button size="small" sx={COMPACT_BUTTON_SX}
                onClick={(e) => onEdit?.(view, e.currentTarget)}>
          Edit
        </Button>
      ) : null}
      <Button size="small" color="error" sx={COMPACT_BUTTON_SX}
              onClick={() => onRemove?.(view)}>
        Remove
      </Button>
    </Box>
  </Box>
);

// One goal as a compact row: a tap opens its details in place. A goal that cannot be measured does not open
const GoalListRow = ({ view, onEdit, onRemove, onTogglePin, source = 'dashboard' }) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  const face = goalFace(view);
  const unresolved = isUnresolved(view);
  return (
    <Box component="li" data-goal-status={view.status} data-goal-open={open} sx={{
      minWidth: 0,
      border: 1,
      borderColor: open ? 'primary.main' : 'divider',
      borderRadius: 1,
      opacity: view.status === 'missing' ? 0.6 : 1
    }}>
      {unresolved ? <UnresolvedRow view={view} face={face} onEdit={onEdit} onRemove={onRemove}/> : (
        <ButtonBase data-goal-row aria-expanded={open} aria-controls={open ? id : undefined}
                    onClick={() => setOpen(!open)}
                    sx={{ ...ROW_GRID_SX, ...FOCUS_SX, borderRadius: 1, font: 'inherit',
                      ...(open ? { height: 'auto', minHeight: ROW_HEIGHT, py: 0.75 } : {}) }}>
          <RowSlots view={view} face={face} open={open}/>
          <ProgressSlots view={view} face={face}/>
          <Box component="span" sx={{ gridArea: 'chevron', display: 'flex', color: 'text.secondary' }}>
            <IconChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}/>
          </Box>
        </ButtonBase>
      )}
      {open && !unresolved ? (
        <RowDetails view={view} face={face} id={id} source={source} onEdit={onEdit} onRemove={onRemove}
                    onTogglePin={onTogglePin}/>
      ) : null}
    </Box>
  );
};

// One capped-width column keeps the name, value and bar close enough to scan on wide screens
export const GoalRows = ({ label, children }) => (
  <Box component="ul" aria-label={label} sx={{
    listStyle: 'none',
    m: 0,
    p: 0,
    display: 'grid',
    gap: 1,
    alignItems: 'start',
    gridTemplateColumns: 'minmax(0, 1fr)',
    // a set width: the dashboard card hugs its content, so the list decides how wide it is
    width: { xs: '100%', md: 880 },
    maxWidth: '100%'
  }}>
    {children}
  </Box>
);

export default GoalListRow;

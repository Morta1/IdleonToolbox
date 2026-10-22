import React, { useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Box, Button, ButtonBase, Stack, Typography } from '@mui/material';
import { IconNote } from '@tabler/icons-react';
import { cardLabel, editText, goalFace, goalText } from './parts/format';
import { CostValue, GoalBar, GoalIcon, GoalMark, GoalValueText } from './parts/GoalVisuals';
import { displayTitle, goalActions } from './parts/actions';
import GoalEntries from './GoalEntries';
import { isUnresolved } from '@utility/goals/resolve';

export const ROW_HEIGHT = 38;

// Fixed slots so the value and the bar sit at the same x in every row. A phone stacks the percent over the bar in
// the last slot
const ROW_GRID_SX = {
  display: 'grid',
  alignItems: 'center',
  columnGap: 1,
  width: '100%',
  height: ROW_HEIGHT,
  px: 1,
  textAlign: 'left',
  gridTemplateColumns: { xs: '24px minmax(0, 1fr) 132px 44px', sm: '28px minmax(0, 1fr) 190px minmax(48px, 120px) 40px' },
  gridTemplateAreas: { xs: '"icon name value aside"', sm: '"icon name value bar aside"' }
};
const LINE_SX = { display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const MAIN_LINE_SX = { ...LINE_SX, fontSize: 14, lineHeight: '18px' };
const SUB_LINE_SX = { ...LINE_SX, fontSize: 12, lineHeight: '16px', color: 'text.secondary' };

const valueColor = (status) => {
  if (status === 'reached') return 'success.main';
  if (status === 'missing' || status === 'invalid') return 'text.secondary';
  return 'text.primary';
};

// The one-line slots shared by every row: icon, name over the system, value over its caption, bar, percent
const RowSlots = ({ view, face }) => (
  <>
    <Box component="span" sx={{ gridArea: 'icon', display: 'flex' }}>
      <GoalIcon src={view.icon} alt="" size={24}/>
    </Box>
    <Box component="span" sx={{ gridArea: 'name', minWidth: 0 }}>
      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
        <Box component="span" data-goal-name sx={{ ...MAIN_LINE_SX, fontWeight: 500, minWidth: 0 }}>
          {displayTitle(view)}
        </Box>
        {view.note ? (
          <Box component="span" sx={{ display: 'inline-flex', color: 'text.secondary', flexShrink: 0 }}>
            <IconNote size={14} aria-label="Has a note" role="img"/>
          </Box>
        ) : null}
      </Box>
      <Box component="span" data-goal-label sx={SUB_LINE_SX}>{cardLabel(view)}</Box>
    </Box>
    <Box component="span" sx={{ gridArea: 'value', minWidth: 0 }}>
      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
        <GoalMark mark={face.mark} size={14}/>
        <Box component="span" data-goal-value sx={{ ...MAIN_LINE_SX, color: valueColor(view.status), minWidth: 0 }}>
          <GoalValueText face={face}/>
        </Box>
      </Box>
      <Box component="span" data-goal-caption sx={SUB_LINE_SX}>{face.caption ?? ''}</Box>
    </Box>
  </>
);

// The bar and the percent beside it (a tier shows its step); an empty slot keeps the row's shape
const ProgressSlots = ({ view, face }) => {
  const reached = view.status === 'reached';
  return (
    <>
      {face.bar ? (
        <Box component="span" sx={{ gridArea: { xs: 'aside', sm: 'bar' }, alignSelf: { xs: 'end', sm: 'center' }, mb: { xs: 0.75, sm: 0 } }}>
          <GoalBar progress={view.progress} reached={reached}/>
        </Box>
      ) : null}
      <Box component="span" data-goal-aside sx={{
        gridArea: 'aside',
        alignSelf: { xs: 'start', sm: 'center' },
        mt: { xs: 0.5, sm: 0 },
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
const RowDetails = ({ view, face, id, onEdit, onRemove }) => {
  const router = useRouter();
  const { editable, route, onOpenPage } = goalActions(view, router.query);
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
          <GoalEntries view={view}/>
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
            Open page
          </Button>
        ) : null}
        <Button size="small" color="error" sx={{ textTransform: 'none' }} onClick={() => onRemove?.(view)}>
          Remove
        </Button>
      </Stack>
    </Stack>
  );
};

// A goal that cannot be measured: what went wrong under its name, the entry's current amount when it is still there,
// and the fix (Edit when the entry is still there, Remove) always in view where the value and bar would be
const UnresolvedRow = ({ view, face, onEdit, onRemove }) => (
  <Box data-goal-row sx={{ display: 'flex', alignItems: 'center', gap: 1, height: ROW_HEIGHT, px: 1 }}>
    <GoalIcon src={view.icon} alt="" size={24}/>
    <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
      <Box component="span" data-goal-name sx={{ ...MAIN_LINE_SX, fontWeight: 500 }}>{displayTitle(view)}</Box>
      <Box component="span" data-goal-value sx={SUB_LINE_SX}>{face.value}</Box>
    </Box>
    {face.caption ? (
      // a phone keeps the room for the reason; the card view still shows the amount there
      <Box component="span" data-goal-caption sx={{
        ...MAIN_LINE_SX,
        display: { xs: 'none', sm: 'block' },
        flexShrink: 0,
        maxWidth: 120,
        color: 'text.secondary'
      }}>
        {face.caption}
      </Box>
    ) : null}
    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
      {view.status === 'invalid' ? (
        <Button size="small" sx={{ textTransform: 'none', minWidth: 0, py: 0 }}
                onClick={(e) => onEdit?.(view, e.currentTarget)}>
          Edit
        </Button>
      ) : null}
      <Button size="small" color="error" sx={{ textTransform: 'none', minWidth: 0, py: 0 }}
              onClick={() => onRemove?.(view)}>
        Remove
      </Button>
    </Box>
  </Box>
);

// One goal as a compact row: a tap opens its details in place. A goal that cannot be measured does not open
const GoalListRow = ({ view, onEdit, onRemove }) => {
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
                    onClick={() => setOpen(!open)} sx={{ ...ROW_GRID_SX, borderRadius: 1, font: 'inherit' }}>
          <RowSlots view={view} face={face}/>
          <ProgressSlots view={view} face={face}/>
        </ButtonBase>
      )}
      {open && !unresolved ? (
        <RowDetails view={view} face={face} id={id} onEdit={onEdit} onRemove={onRemove}/>
      ) : null}
    </Box>
  );
};

// Two columns of rows on a desktop, one under 900px; an open row grows without stretching its neighbour
export const GoalRows = ({ label, children }) => (
  <Box component="ul" aria-label={label} sx={{
    listStyle: 'none',
    m: 0,
    p: 0,
    display: 'grid',
    gap: 1,
    alignItems: 'start',
    gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }
  }}>
    {children}
  </Box>
);

export default GoalListRow;

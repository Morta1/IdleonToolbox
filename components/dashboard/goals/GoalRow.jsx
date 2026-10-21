import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Box, Button, IconButton, Link as MuiLink, Menu, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { IconChevronDown, IconChevronUp, IconPencil, IconTargetArrow, IconX } from '@tabler/icons-react';
import { useGoals } from '@components/goals/GoalsProvider';
import { getDescriptor } from '@utility/goals/registry';
import { entryProgressText, formatNumber, formatPercent, rangeBoundText } from '@components/goals/parts/format';
import { sessionQuery } from '@utility/nav-query';
import { trackEvent } from '@utility/analytics';
import { notateProgress } from '@utility/helpers';
import { GoalBar, GoalIcon, GoalProgress, GoalStatus } from '@components/goals/parts/GoalVisuals';

const GoalPopover = dynamic(() => import('@components/goals/GoalPopover'), { ssr: false });

const CLOSEST_SHOWN = 5;
const PAGE_SIZE = 50;

const stop = (event) => event.stopPropagation();

// The nearest unmet entries; when none has started, the ones still needed
const closestText = (view) => {
  const near = view.closest.length > 0;
  const shown = (near ? view.closest : view.short).slice(0, CLOSEST_SHOWN)
    .map((entry) => {
      if (view.boolean) return entry.name;
      return `${entry.name} ${view.unit === 'percentOfMax' ? formatPercent(entry.value) : notateProgress(entry.value)}`;
    });
  const more = view.shortCount - shown.length;
  return `${near ? 'Closest' : 'Still needed'}: ${shown.join(', ')}${more > 0 ? ` · and ${formatNumber(more)} more` : ''}`;
};

// Phones get 44px targets in a fixed column
const ACTION_SX = { width: { xs: 44, sm: 32 }, height: { xs: 44, sm: 32 } };
// A phone puts the goal text on its own line under the name, beside the name it would squeeze both
const ROW_GRID = {
  display: 'grid',
  columnGap: 1,
  rowGap: 0.25,
  alignItems: 'start',
  gridTemplateColumns: { xs: '28px minmax(0, 1fr) auto', sm: '28px minmax(0, 1fr) auto auto' },
  gridTemplateAreas: {
    xs: '"icon name actions" ". status status" ". note note" ". bar bar" ". closest closest"',
    sm: '"icon name status actions" ". note note ." ". bar bar ." ". closest closest ."'
  }
};
const NAME_SX = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  overflowWrap: 'anywhere',
  minWidth: 0
};

const BAR_SX = { flex: 1, minWidth: 40 };

const pageHref = (route, query) => ({ pathname: route, query: sessionQuery(query) });

const ExpandedEntries = ({ view, query }) => {
  const [search, setSearch] = useState('');
  const [pages, setPages] = useState(1);
  const [picking, setPicking] = useState(null);
  const { findEntryGoal } = useGoals();
  const descriptor = getDescriptor(view.system);
  const needle = search.trim().toLowerCase();
  const matches = needle ? view.short.filter(({ name }) => String(name).toLowerCase().includes(needle)) : view.short;
  const shown = matches.slice(0, pages * PAGE_SIZE);

  return (
    <Stack gap={1} sx={{ pl: { xs: 0, sm: 4.5 }, pt: 1 }}>
      <TextField size="small" placeholder="Search" value={search}
                 slotProps={{ htmlInput: { 'aria-label': 'Search' } }}
                 onChange={(e) => {
                   setSearch(e.target.value);
                   setPages(1);
                 }} sx={{ maxWidth: 260 }}/>
      <Box component="ul" aria-label="Entries still short"
           sx={{ listStyle: 'none', m: 0, p: 0, pr: 0.5, maxHeight: 360, overflowY: 'auto' }}>
        {shown.map((entry) => (
          <Stack component="li" key={entry.key} direction="row" alignItems="center" gap={1} sx={{ py: 0.25 }}>
            <GoalIcon src={entry.icon} alt=""/>
            <Typography data-entry-name variant="body2" noWrap sx={{ flex: { xs: 1, sm: '0 0 180px' }, minWidth: 0 }}>
              {entry.name}
            </Typography>
            {/* A phone has room for the name or the bar, and the name matters more */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, flex: 1 }}>
              <GoalBar progress={entry.progress} sx={BAR_SX}/>
            </Box>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ flexShrink: 0, minWidth: 88, textAlign: 'right' }}>
              {entryProgressText(view, entry)}
            </Typography>
            <IconButton size="small" aria-label={`Set goal for ${entry.name}`} sx={ACTION_SX}
                        color={findEntryGoal(view.system, entry.key, view.scope) ? 'primary' : 'default'}
                        onClick={(e) => {
                          stop(e);
                          setPicking({ anchorEl: e.currentTarget, key: entry.key });
                        }}>
              <IconTargetArrow size={16}/>
            </IconButton>
          </Stack>
        ))}
      </Box>
      {picking && descriptor ? (
        <span style={{ display: 'contents' }} onClick={stop} onMouseDown={stop} onPointerDown={stop}>
          <GoalPopover anchorEl={picking.anchorEl} open onClose={() => setPicking(null)}
                       systems={[descriptor]} initial={{ system: view.system, key: picking.key, scope: view.scope }}
                       source="dashboard"/>
        </span>
      ) : null}
      {matches.length > shown.length ? (
        <Button size="small" sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                onClick={() => setPages(pages + 1)}>
          Show 50 more
        </Button>
      ) : null}
      {view.route ? (
        <MuiLink component={Link} href={pageHref(view.route, query)} variant="body2" underline="hover">
          {`Full list on the ${view.label} page`}
        </MuiLink>
      ) : null}
    </Stack>
  );
};

// A range row edits either of its two goals
const EditButton = ({ view, onEdit }) => {
  const [menu, setMenu] = useState(null);
  if (!view.range) {
    return (
      <IconButton size="small" aria-label="Edit goal" sx={ACTION_SX} onClick={(e) => {
        stop(e);
        onEdit?.(view, e.currentTarget);
      }}>
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
      <IconButton size="small" aria-label="Edit goal" aria-haspopup="menu" sx={ACTION_SX} onClick={(e) => {
        stop(e);
        setMenu(e.currentTarget);
      }}>
        <IconPencil size={16}/>
      </IconButton>
      <span style={{ display: 'contents' }} onClick={stop}>
        <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)}>
          {[view.range.lower, view.range.upper].map((part) => (
            <MenuItem key={part.id} onClick={() => pick(part)}>{rangeBoundText(part)}</MenuItem>
          ))}
        </Menu>
      </span>
    </>
  );
};

// One goal. `all` / group goals expand to every entry still short of the target; clicking the row expands it.
// A range view (pairRanges) removes both of its goals through onRemove(view) and edits either one.
const GoalRow = ({ view, onEdit, onRemove, defaultExpanded = false }) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const missing = view.status === 'missing';
  const expandable = view.kind === 'all' && !missing && view.shortCount > 0;
  const toggle = () => {
    if (expandable) setExpanded(!expanded);
  };

  let name = view.name;
  if (missing) name = view.icon ? view.name : view.label;
  // An all or group goal opens in place; the expanded list links the page
  const linked = !missing && view.route && view.kind !== 'all';

  return (
    <Box component="li" data-goal-status={view.status} sx={{ py: 1 }}>
      <Box onClick={toggle} sx={{ ...ROW_GRID, cursor: expandable ? 'pointer' : 'default' }}>
        <Box sx={{ gridArea: 'icon' }}><GoalIcon src={view.icon} alt=""/></Box>
        {linked ? (
          <MuiLink component={Link} href={pageHref(view.route, router.query)} underline="hover" color="inherit"
                   sx={{ ...NAME_SX, gridArea: 'name', alignSelf: 'center', justifySelf: 'start' }}
                   onClick={(e) => {
                     stop(e);
                     trackEvent('goal_click', { system: view.system, kind: view.kind });
                   }}>
            {name}
          </MuiLink>
        ) : <Typography sx={{ ...NAME_SX, gridArea: 'name', alignSelf: 'center' }}>{name}</Typography>}
        <GoalStatus view={view} sx={{ gridArea: 'status', alignSelf: 'center', whiteSpace: { sm: 'nowrap' } }}/>
        <Stack direction="row" sx={{ gridArea: 'actions' }}>
          {!missing ? <EditButton view={view} onEdit={onEdit}/> : null}
          <IconButton size="small" aria-label="Remove goal" sx={ACTION_SX} onClick={(e) => {
            stop(e);
            onRemove?.(view);
          }}>
            <IconX size={16}/>
          </IconButton>
          {expandable ? (
            <IconButton size="small" aria-label={expanded ? 'Collapse' : 'Expand'} sx={ACTION_SX} onClick={(e) => {
              stop(e);
              toggle();
            }}>
              {expanded ? <IconChevronUp size={16}/> : <IconChevronDown size={16}/>}
            </IconButton>
          ) : null}
        </Stack>
        {view.note ? (
          <Typography variant="caption" color="text.secondary" data-goal-note noWrap sx={{ gridArea: 'note' }}>
            {view.note}
          </Typography>
        ) : null}
        {!missing && view.progress != null ? <GoalProgress view={view} sx={{ gridArea: 'bar' }}/> : null}
        {expandable && !expanded ? (
          <Typography variant="body2" color="text.secondary" sx={{ gridArea: 'closest' }}>{closestText(view)}</Typography>
        ) : null}
      </Box>
      {expandable && expanded ? <ExpandedEntries view={view} query={router.query}/> : null}
    </Box>
  );
};

export default GoalRow;

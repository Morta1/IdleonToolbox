import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Box, Button, IconButton, LinearProgress, Link as MuiLink, Stack, TextField, Typography } from '@mui/material';
import { IconChevronDown, IconChevronUp, IconPencil, IconTargetArrow, IconX } from '@tabler/icons-react';
import { useGoals } from '@components/goals/GoalsProvider';
import { getDescriptor } from '@utility/goals/registry';
import { formatNumber, formatPercent } from '@components/goals/parts/format';
import { sessionQuery } from '@utility/nav-query';
import { trackEvent } from '@utility/analytics';
import { notateNumber, prefix } from '@utility/helpers';

const GoalPopover = dynamic(() => import('@components/goals/GoalPopover'), { ssr: false });

const CLOSEST_SHOWN = 5;
const PAGE_SIZE = 50;

const stop = (event) => event.stopPropagation();

const amount = (view, n) => (view.unit === 'percentOfMax' ? formatPercent(n) : formatNumber(n));

const targetText = (view) => {
  if (view.tierName) return view.tierName;
  if (view.target === 'max') return 'Max';
  return amount(view, view.targetValue ?? view.target);
};

const valueText = (view) => (view.kind === 'all'
  ? `${formatNumber(view.met)} / ${formatNumber(view.total)}`
  : `${view.valueTierName ?? amount(view, view.value)} / ${targetText(view)}`);

const closestText = (view) => {
  const closest = view.short.slice(0, CLOSEST_SHOWN)
    .map((entry) => `${entry.name} ${view.unit === 'percentOfMax' ? formatPercent(entry.value) : notateNumber(entry.value)}`);
  const more = view.shortCount - CLOSEST_SHOWN;
  return `Closest: ${closest.join(', ')}${more > 0 ? ` · and ${formatNumber(more)} more` : ''}`;
};

const RowIcon = ({ src, alt }) => (
  <Box sx={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {src ? <Box component="img" src={`${prefix}${src}.png`} alt={alt}
                sx={{ maxWidth: 28, maxHeight: 28, objectFit: 'contain' }}/> : null}
  </Box>
);

const Bar = ({ progress, reached }) => (
  <LinearProgress variant="determinate" value={Math.round((progress ?? 0) * 100)}
                  color={reached ? 'success' : 'primary'}
                  sx={{ height: 6, borderRadius: 3, flex: 1, minWidth: 40 }}/>
);

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
      <Box component="ul" aria-label="Entries still short" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {shown.map((entry) => (
          <Stack component="li" key={entry.key} direction="row" alignItems="center" gap={1} sx={{ py: 0.25 }}>
            <RowIcon src={entry.icon} alt=""/>
            <Typography data-entry-name variant="body2" noWrap sx={{ flex: { xs: 1, sm: '0 0 180px' }, minWidth: 0 }}>
              {entry.name}
            </Typography>
            {/* A phone has room for the name or the bar, and the name matters more */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, flex: 1 }}>
              <Bar progress={entry.progress}/>
            </Box>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ flexShrink: 0, minWidth: 88, textAlign: 'right' }}>
              {`${amount(view, entry.value)} / ${amount(view, entry.targetValue)}`}
            </Typography>
            <IconButton size="small" aria-label={`Set goal for ${entry.name}`}
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

// One goal. `all` / group goals expand to every entry still short of the target.
const GoalRow = ({ view, onEdit, onRemove, defaultExpanded = false }) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const missing = view.status === 'missing';
  const reached = view.status === 'reached';
  const expandable = view.kind === 'all' && !missing && view.shortCount > 0;
  const toggle = () => {
    if (expandable) setExpanded(!expanded);
  };

  let name = view.name;
  if (missing) name = view.icon ? view.name : view.label;

  return (
    <Box component="li" data-goal-status={view.status} sx={{ py: 1 }}>
      <Box onClick={toggle} sx={{ cursor: expandable ? 'pointer' : 'default' }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <RowIcon src={view.icon} alt=""/>
          <Stack sx={{ minWidth: 0, flex: 1 }}>
            {!missing && view.route ? (
              <MuiLink component={Link} href={pageHref(view.route, router.query)} underline="hover" color="inherit"
                       noWrap sx={{ alignSelf: 'flex-start', maxWidth: '100%' }}
                       onClick={(e) => {
                         stop(e);
                         trackEvent('goal_click', { system: view.system, kind: view.kind });
                       }}>
                {name}
              </MuiLink>
            ) : <Typography noWrap>{name}</Typography>}
            {view.kind === 'all' && !missing ? (
              <Typography variant="caption" color="text.secondary">
                {`${view.metricLabel}: ${targetText(view)}`}
              </Typography>
            ) : null}
          </Stack>
          {missing ? (
            <Typography variant="body2" color="text.secondary" noWrap>No longer exists</Typography>
          ) : (
            <Typography variant="body2" noWrap color={reached ? 'success.main' : 'text.primary'} sx={{ flexShrink: 0 }}>
              {valueText(view)}
            </Typography>
          )}
          {!missing ? (
            <IconButton size="small" aria-label="Edit goal" onClick={(e) => {
              stop(e);
              onEdit?.(view, e.currentTarget);
            }}>
              <IconPencil size={16}/>
            </IconButton>
          ) : null}
          <IconButton size="small" aria-label="Remove goal" onClick={(e) => {
            stop(e);
            onRemove?.(view);
          }}>
            <IconX size={16}/>
          </IconButton>
          {expandable ? (
            <IconButton size="small" aria-label={expanded ? 'Collapse' : 'Expand'} onClick={(e) => {
              stop(e);
              toggle();
            }}>
              {expanded ? <IconChevronUp size={16}/> : <IconChevronDown size={16}/>}
            </IconButton>
          ) : null}
        </Stack>
        {!missing && view.progress != null ? (
          <Box sx={{ display: 'flex', pl: 4.5, pt: 0.5 }}>
            <Bar progress={view.progress} reached={reached}/>
          </Box>
        ) : null}
        {expandable && !expanded ? (
          <Typography variant="body2" color="text.secondary" sx={{ pl: 4.5, pt: 0.5 }}>
            {closestText(view)}
          </Typography>
        ) : null}
      </Box>
      {expandable && expanded ? <ExpandedEntries view={view} query={router.query}/> : null}
    </Box>
  );
};

export default GoalRow;

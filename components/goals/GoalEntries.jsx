import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import { IconTargetArrow } from '@tabler/icons-react';
import { useGoals } from '@components/goals/GoalsProvider';
import { getDescriptor } from '@utility/goals/registry';
import { entryProgressText } from './parts/format';
import { GoalBar, GoalIcon } from './parts/GoalVisuals';

const GoalPopover = dynamic(() => import('@components/goals/GoalPopover'), { ssr: false });

const PAGE_SIZE = 50;
// A short list needs no search
const SEARCH_FROM = 10;

// Phones get 44px targets
const ACTION_SX = { width: { xs: 44, sm: 32 }, height: { xs: 44, sm: 32 } };

// Every entry of an all or group goal still short of the target, nearest first, with search, paging and a button
// that gives one entry its own goal
const GoalEntries = ({ view, maxHeight = 320 }) => {
  const [search, setSearch] = useState('');
  const [pages, setPages] = useState(1);
  const [picking, setPicking] = useState(null);
  const { findEntryGoal } = useGoals();
  const descriptor = getDescriptor(view.system);
  const needle = search.trim().toLowerCase();
  const matches = needle ? view.short.filter(({ name }) => String(name).toLowerCase().includes(needle)) : view.short;
  const shown = matches.slice(0, pages * PAGE_SIZE);

  return (
    <Stack gap={1}>
      {view.short.length > SEARCH_FROM ? (
        <TextField size="small" placeholder="Search" value={search}
                   slotProps={{ htmlInput: { 'aria-label': 'Search' } }}
                   onChange={(e) => {
                     setSearch(e.target.value);
                     setPages(1);
                   }} sx={{ maxWidth: 260 }}/>
      ) : null}
      <Box component="ul" aria-label="Entries still short"
           sx={{ listStyle: 'none', m: 0, p: 0, pr: 0.5, maxHeight, overflowY: 'auto' }}>
        {shown.map((entry) => (
          <Stack component="li" key={entry.key} direction="row" alignItems="center" gap={1} sx={{ py: 0.25 }}>
            <GoalIcon src={entry.icon} alt="" size={24}/>
            <Typography data-entry-name variant="body2" noWrap sx={{ flex: { xs: 1, sm: '0 0 180px' }, minWidth: 0 }}>
              {entry.name}
            </Typography>
            {/* A phone has room for the name or the bar, and the name matters more */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, flex: 1 }}>
              <GoalBar progress={entry.progress} sx={{ flex: 1, minWidth: 40 }}/>
            </Box>
            <Typography variant="body2" color="text.secondary" noWrap
                        sx={{ flexShrink: 0, minWidth: 88, textAlign: 'right' }}>
              {entryProgressText(view, entry)}
            </Typography>
            {descriptor?.allOnly ? null : (
              <IconButton size="small" aria-label={`Set goal for ${entry.name}`} sx={ACTION_SX}
                          color={findEntryGoal(view.system, entry.key, view.scope) ? 'primary' : 'default'}
                          onClick={(e) => setPicking({ anchorEl: e.currentTarget, key: entry.key })}>
                <IconTargetArrow size={16}/>
              </IconButton>
            )}
          </Stack>
        ))}
      </Box>
      {matches.length > shown.length ? (
        <Button size="small" sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                onClick={() => setPages(pages + 1)}>
          Show 50 more
        </Button>
      ) : null}
      {picking && descriptor ? (
        <GoalPopover anchorEl={picking.anchorEl} open onClose={() => setPicking(null)}
                     systems={[descriptor]} initial={{ system: view.system, key: picking.key, scope: view.scope }}
                     source="dashboard" entryOnly/>
      ) : null}
    </Stack>
  );
};

export default GoalEntries;

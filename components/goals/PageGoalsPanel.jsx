import React from 'react';
import Link from 'next/link';
import { Box, Button, ButtonBase, Divider, Link as MuiLink, Stack, Typography } from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import { goalName, progressText } from './parts/format';
import { GoalBar, GoalIcon } from './parts/GoalVisuals';

const PanelRow = ({ view, onOpen }) => {
  const missing = view.status === 'missing';
  const reached = view.status === 'reached';
  return (
    <Box component="li" data-goal-status={view.status}>
      <ButtonBase onClick={() => onOpen(view)}
                  sx={{ width: '100%', display: 'block', textAlign: 'left', borderRadius: 1, px: 1, py: 0.75 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <GoalIcon src={view.icon} alt=""/>
          <Typography data-goal-name variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
            {goalName(view)}
          </Typography>
          <Typography variant="body2" noWrap sx={{ flexShrink: 0 }}
                      color={reached ? 'success.main' : missing ? 'text.secondary' : 'text.primary'}>
            {missing ? 'No longer exists' : progressText(view)}
          </Typography>
        </Stack>
        {!missing && view.progress != null ? (
          <Box sx={{ pl: 4.5, pt: 0.5 }}>
            <GoalBar progress={view.progress} reached={reached} sx={{ height: 4 }}/>
          </Box>
        ) : null}
      </ButtonBase>
    </Box>
  );
};

// views: the page's goals, already resolved and ordered (open first, reached last)
const PageGoalsPanel = ({ views, onAdd, onOpen, dashboardHref, onLeave }) => (
  <Stack gap={1}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
      <Typography variant="h6">Goals on this page</Typography>
      <Button size="small" startIcon={<IconPlus size={16}/>} sx={{ textTransform: 'none' }} onClick={onAdd}>
        Add goal
      </Button>
    </Stack>
    <Box component="ul" aria-label="Goals on this page"
         sx={{ listStyle: 'none', m: 0, p: 0, mx: -1, maxHeight: '60vh', overflowY: 'auto' }}>
      {views.map((view) => <PanelRow key={view.id} view={view} onOpen={onOpen}/>)}
    </Box>
    <Divider/>
    <MuiLink component={Link} href={dashboardHref} variant="body2" underline="hover" onClick={onLeave}
             sx={{ alignSelf: 'flex-start' }}>
      All goals on the dashboard
    </MuiLink>
  </Stack>
);

export default PageGoalsPanel;

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Button from '@mui/material/Button';
import { IconTarget } from '@tabler/icons-react';
import { useGoals } from '@components/goals/GoalsProvider';
import { descriptorsForRoute } from '@utility/goals/registry';
import GoalPopover from './GoalPopover';

// Loaded through next/dynamic from the NavBar, only on routes that have goals.
const AddGoalButton = () => {
  const router = useRouter();
  const { enabled } = useGoals();
  const [anchorEl, setAnchorEl] = useState(null);
  const systems = descriptorsForRoute(router?.pathname);
  if (!enabled || !systems.length) return null;

  return (
    <>
      <Button sx={{ textTransform: 'none' }} startIcon={<IconTarget/>} onClick={(e) => setAnchorEl(e.currentTarget)}>
        Add goal
      </Button>
      <GoalPopover anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)} systems={systems}
                   initial={{}} source="header"/>
    </>
  );
};

export default AddGoalButton;

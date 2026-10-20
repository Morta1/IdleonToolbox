// Spread into the sx of whatever element hosts a SetGoalButton: the button stays hidden until the host
// is hovered or focused, unless a goal exists. Touch devices have no hover, so it stays visible, muted.
export const goalHostSx = {
  '& .goal-set-btn': { opacity: 0, transition: 'opacity .15s' },
  '&:hover .goal-set-btn, &:focus-within .goal-set-btn': { opacity: 1 },
  '& .goal-set-btn.has-goal': { opacity: 1 },
  '@media (hover: none)': {
    '& .goal-set-btn': { opacity: 0.6 },
    '& .goal-set-btn.has-goal': { opacity: 1 }
  }
};

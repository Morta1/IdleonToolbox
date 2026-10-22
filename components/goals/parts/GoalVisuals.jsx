import React from 'react';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { IconCheck, IconCircle } from '@tabler/icons-react';
import { getCoinsArray, prefix } from '@utility/helpers';
import CoinDisplay from '@components/common/CoinDisplay';
import { isUnresolved } from '@utility/goals/resolve';
import { canBuy, CAN_BUY_NOW, costAmount, costText, goalFace, REACHED } from './format';

export const GoalIcon = ({ src, alt, size = 28 }) => (
  <Box sx={{ width: size, height: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {src ? <Box component="img" src={`${prefix}${src}.png`} alt={alt}
                sx={{ maxWidth: size, maxHeight: size, objectFit: 'contain' }}/> : null}
  </Box>
);

export const GoalBar = ({ progress, reached, sx }) => (
  <LinearProgress variant="determinate" value={Math.round((progress ?? 0) * 100)}
                  color={reached ? 'success' : 'primary'} sx={{ height: 4, borderRadius: 2, ...sx }}/>
);

// A check on a reached goal, an empty circle on a yes/no goal not done yet
export const GoalMark = ({ mark, size = 16 }) => {
  if (mark === 'check') {
    return (
      <Box component="span" sx={{ color: 'success.main', display: 'inline-flex', flexShrink: 0 }}>
        <IconCheck size={size} aria-label={REACHED} role="img"/>
      </Box>
    );
  }
  if (mark === 'open') {
    return (
      <Box component="span" sx={{ color: 'text.secondary', display: 'inline-flex', flexShrink: 0 }}>
        <IconCircle size={size} aria-hidden/>
      </Box>
    );
  }
  return null;
};

const CURRENCY_ICON_SX = { width: 16, height: 16, objectFit: 'contain', flexShrink: 0 };

// One amount of a price's currency as the page draws it: coin tiers (the top `tiers` of them), or the currency icon
// and the amount
const CostAmount = ({ cost, n, tiers }) => {
  if (cost.display === 'coins') return <CoinDisplay dense money={getCoinsArray(n)} maxCoins={tiers}/>;
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
      <Box component="img" src={`${prefix}${cost.icon(n)}.png`} alt="" sx={CURRENCY_ICON_SX}/>
      {costAmount(cost, n)}
    </Box>
  );
};

const COST_SX = { display: 'inline-flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap', verticalAlign: 'top', height: '1lh' };

// What you have of a price, drawn in its currency: "[coin]45 of [coin]12" (the top coin tier of each), every tier
// when `full`. Once affordable the short form is "Can buy now [coin]12". Screen readers get the words
// ("1.2M of 5M coins")
export const CostValue = ({ cost, full = false }) => {
  const text = costText(cost);
  if (cost.display !== 'coins' && !cost.icon) return full || !canBuy(cost) ? text : CAN_BUY_NOW;
  if (!full && canBuy(cost)) {
    return (
      <>
        {CAN_BUY_NOW}
        <Box component="span" sx={visuallyHidden}>{`, ${costAmount(cost, cost.price)} ${cost.label}`}</Box>
        <Box component="span" aria-hidden data-goal-cost sx={{ ...COST_SX, ml: 0.75 }}>
          <CostAmount cost={cost} n={cost.price} tiers={1}/>
        </Box>
      </>
    );
  }
  const tiers = full ? Infinity : 1;
  return (
    <>
      <Box component="span" sx={visuallyHidden}>{text}</Box>
      {/* one text line tall, so a row of coins never grows the slot it sits in */}
      <Box component="span" aria-hidden data-goal-cost sx={full ? { ...COST_SX, flexWrap: 'wrap', height: 'auto' } : COST_SX}>
        <CostAmount cost={cost} n={cost.have} tiers={tiers}/>
        <span>of</span>
        <CostAmount cost={cost} n={cost.price} tiers={tiers}/>
      </Box>
    </>
  );
};

// The value slot's text, with the price drawn in its currency
export const GoalValueText = ({ face }) => (face.cost ? <CostValue cost={face.cost}/> : face.value);

// The thin bar with its percent (or tier step) beside it; nothing for a goal without a bar
export const GoalProgress = ({ view, sx }) => {
  const face = goalFace(view);
  if (!face.bar) return null;
  const reached = view.status === 'reached';
  return (
    <Stack direction="row" alignItems="center" gap={1} sx={sx}>
      <GoalBar progress={view.progress} reached={reached} sx={{ flex: 1, minWidth: 40 }}/>
      <Typography variant="caption" color={reached ? 'success.main' : 'text.secondary'}
                  sx={{ minWidth: 36, textAlign: 'right' }}>
        {face.aside}
      </Typography>
    </Stack>
  );
};

// "449,924 of 500,000" on one line, with its caption after a dot; a reached goal gets a check
export const GoalStatus = ({ view, sx }) => {
  const face = goalFace(view);
  let color = 'text.primary';
  if (view.status === 'reached') color = 'success.main';
  else if (isUnresolved(view)) color = 'text.secondary';
  return (
    <Typography variant="body2" component="span" data-goal-text color={color}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', ...sx }}>
      <GoalMark mark={face.mark}/>
      <GoalValueText face={face}/>
      {/* the space keeps the text one line for copy and screen readers; the flex gap draws it */}
      {face.caption ? ' ' : null}
      {face.caption ? <Box component="span" sx={{ color: 'text.secondary' }}>{`· ${face.caption}`}</Box> : null}
    </Typography>
  );
};

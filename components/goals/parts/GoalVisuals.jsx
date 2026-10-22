import React from 'react';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { IconCheck, IconCircle } from '@tabler/icons-react';
import { getCoinsArray, prefix } from '@utility/helpers';
import CoinDisplay from '@components/common/CoinDisplay';
import { swatchColor } from '@utility/goals/icons';
import { canBuy, CAN_BUY_NOW, costAmount, costFaceText, costText, goalFace, goalTitle, REACHED, valueColor } from './format';

// One line of a row or card that ends in an ellipsis instead of wrapping
export const LINE_SX = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 };

const HEXAGON = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

export const GoalIcon = ({ src, alt, size = 28 }) => {
  const swatch = swatchColor(src);
  return (
    <Box sx={{ width: size, height: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* a colour is drawn the way the Palette page draws it: a filled hexagon */}
      {swatch ? (
        <Box role={alt ? 'img' : undefined} aria-label={alt || undefined}
             sx={{ width: size * 0.8, height: size * 0.9, clipPath: HEXAGON, bgcolor: swatch }}/>
      ) : null}
      {src && !swatch ? (
        <Box component="img" src={`${prefix}${src}.png`} alt={alt} sx={{ maxWidth: size, maxHeight: size, objectFit: 'contain' }}/>
      ) : null}
    </Box>
  );
};

// A one-line text button (Edit, Remove on a row or card): on a phone a 40px target whose negative margins keep the
// one-line footprint
export const COMPACT_BUTTON_SX = (theme) => ({
  textTransform: 'none',
  minWidth: 0,
  py: 0,
  lineHeight: '18px',
  minHeight: 40,
  my: '-11px',
  [theme.breakpoints.up('sm')]: { minHeight: 0, my: 0 }
});

// Keyboard focus on a goal row or panel row: ButtonBase draws no outline of its own
export const FOCUS_SX = { '&.Mui-focusVisible': { outlineStyle: 'solid', outlineWidth: '2px', outlineColor: 'primary.main', outlineOffset: '-2px' } };

// label: the goal or entry the bar belongs to, so a screen reader names it
// ready: a full bar waiting on the player (an affordable price), drawn apart from a reached goal's
export const GoalBar = ({ progress, reached, ready = false, label, sx }) => {
  let color = 'primary';
  if (reached) color = 'success';
  else if (ready) color = 'warning';
  return (
    <LinearProgress variant="determinate" value={Math.round((progress ?? 0) * 100)} aria-label={label}
                    color={color} sx={{ height: 4, borderRadius: 2, ...sx }}/>
  );
};

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
  if (cost.display !== 'coins' && !cost.icon) return full ? text : costFaceText(cost);
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
  // the game's own money display stops at the top five tiers
  const tiers = full ? 5 : 1;
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
      <GoalBar progress={view.progress} reached={reached} label={goalTitle(view)} sx={{ flex: 1, minWidth: 40 }}/>
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
  return (
    <Typography variant="body2" component="span" data-goal-text color={valueColor(view.status)}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', ...sx }}>
      <GoalMark mark={face.mark}/>
      <GoalValueText face={face}/>
      {/* the space keeps the text one line for copy and screen readers; the flex gap draws it */}
      {face.caption ? ' ' : null}
      {face.caption ? <Box component="span" sx={{ color: 'text.secondary' }}>{`· ${face.caption}`}</Box> : null}
    </Typography>
  );
};

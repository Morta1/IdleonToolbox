import React, { useState } from 'react';
import { Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@components/Tooltip';
import { notateNumber } from '@utility/helpers';
import { hasMasterclassDailyDiscount } from '@parsers/misc';

// A capped upgrade stops at its cap, so +100 already reaches max on almost every capped one.
const LEVELS_AHEAD = [1, 5, 10, 25, 100];

// Shared "Levels ahead" picker and Daily Shopping Spree toggle for every masterclass upgrade page.
// The toggle starts on the live state (discounts left today) and, once touched, prices every level
// shown with or without the discount.
const useMasterclassCostControls = (account) => {
  const [levelsAhead, setLevelsAhead] = useState(1);
  const [discountOverride, setDiscountOverride] = useState(null);
  const liveDiscount = hasMasterclassDailyDiscount(account);
  const discount = discountOverride ?? liveDiscount;

  const controls = <>
    <FormControl size="small" sx={{ width: 150 }}>
      <InputLabel>Levels ahead</InputLabel>
      <Select value={levelsAhead} label="Levels ahead" onChange={(e) => setLevelsAhead(e.target.value)}>
        {LEVELS_AHEAD.map((amount) => (
          // +1 is the card's own cost row with nothing added, so it reads as the default view.
          <MenuItem key={amount} value={amount}>{amount === 1 ? 'Current' : `+${amount} levels`}</MenuItem>
        ))}
      </Select>
    </FormControl>
    <Stack direction="row" alignItems="center">
      <FormControlLabel
        sx={{ width: 'fit-content', mr: 0.5 }}
        control={<Checkbox checked={discount} size="small" onChange={() => setDiscountOverride(!discount)}/>}
        label="Daily Shopping Spree"
      />
      <Tooltip title={`Prices every cost with the Daily Shopping Spree legend talent discount (80% off). You ${liveDiscount
        ? 'still have discounted purchases left today'
        : 'have no discounted purchases left today'}.`}>
        <InfoIcon sx={{ fontSize: 14, opacity: 0.7 }}/>
      </Tooltip>
    </Stack>
  </>;

  // Only force the parser when the toggle disagrees with the save, so the default view stays the
  // exact live price.
  const forceLegendTalent = discount === liveDiscount ? undefined : discount;

  return { controls, levelsAhead, forceLegendTalent, isOverridden: forceLegendTalent !== undefined };
};

// The "Lv N: cost" line under a card's cost row, for when the picker reaches past the next level.
export const LevelsAheadCaption = ({ targetLevel, targetCost, owned }) => (
  <Typography variant="caption" color="text.secondary" sx={{ pl: 4 }}>
    {'Lv '}{targetLevel}{': '}
    <Typography component="span" variant="caption" color={owned >= targetCost ? 'success.main' : 'error.light'}>
      {notateNumber(targetCost, 'Big')}
    </Typography>
  </Typography>
);

export default useMasterclassCostControls;

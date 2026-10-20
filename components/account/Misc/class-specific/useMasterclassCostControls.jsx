import React, { useState } from 'react';
import { Checkbox, FormControlLabel, Stack } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@components/Tooltip';
import { hasMasterclassDailyDiscount } from '@parsers/misc';
import useLevelsAhead from '@components/common/LevelsAhead';

export { formatLevelsAheadCost, LevelsAheadCaption } from '@components/common/LevelsAhead';

// Shared "Levels ahead" picker and Daily Shopping Spree toggle for every masterclass upgrade page.
// The toggle starts on the live state (discounts left today) and, once touched, prices every level
// shown with or without the discount.
const useMasterclassCostControls = (account) => {
  const { picker, levelsAhead } = useLevelsAhead();
  const [discountOverride, setDiscountOverride] = useState(null);
  const liveDiscount = hasMasterclassDailyDiscount(account);
  const discount = discountOverride ?? liveDiscount;

  const controls = <>
    {picker}
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

export default useMasterclassCostControls;

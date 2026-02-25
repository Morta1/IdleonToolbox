import React from 'react';
import { Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';

const RatKing = ({ ratKing }) => {
  if (!ratKing) return null;

  const { crownsCount, kingRatUnlocked, ratBitMulti, ratCurrencyGain, ratCrownOdds, shopUpgrades } = ratKing;

  return (
    <Stack>
      <Divider sx={{ mt: 2 }}/>
      <Stack mt={1} divider={<Divider sx={{ my: 1 }}/>}>
        <TextAndValue title={'Crowns'} value={crownsCount}/>
        <TextAndValue title={'Bit Multi'} value={`${notateNumber(ratBitMulti, 'MultiplierInfo')}x`}/>
        <TextAndValue title={'Crown Odds'} value={`${(ratCrownOdds * 100).toFixed(2)}%`}/>
        {kingRatUnlocked
          ? <TextAndValue title={'Token Gain'} value={`${notateNumber(ratCurrencyGain, 'MultiplierInfo')}/hr`}/>
          : null}
      </Stack>
      {shopUpgrades?.length > 0 && <>
        <Divider sx={{ my: 2 }}/>
        <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>King Rat Shop</Typography>
        <Stack mt={1} direction={'row'} gap={3}>
          {shopUpgrades.map(({ name, level, bonus, cost }) => (
            <Stack key={name}>
              <Typography variant={'body2'}>{cleanUnderscore(name)}</Typography>
              <Typography variant={'body2'}>Lv. {level} (+{bonus}%)</Typography>
              <Typography variant={'body2'}>Cost: {notateNumber(cost, 'bits')}</Typography>
            </Stack>
          ))}
        </Stack>
      </>}
    </Stack>
  );
};

const TextAndValue = ({ title, value }) => (
  <Stack direction={'row'} justifyContent={'space-between'}>
    <Typography variant={'body1'}>{title}:</Typography>
    <Typography variant={'body1'}>{value}</Typography>
  </Stack>
);

export default RatKing;

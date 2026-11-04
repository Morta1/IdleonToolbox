import React from 'react';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import ItemCard from '@components/common/cards/ItemCard';
import DataTable from '@components/common/DataTable';

// The shop as a small table: the upgrade with its level under its name, its bonus, and the next level's cost, the
// currency named once in the header. A name never wraps: the header over the costs takes two lines instead.
const SHOP_COLUMNS = [
  {
    key: 'name', label: 'Upgrade',
    render: ({ name, level }) => <Stack component={'span'}>
      <span>{cleanUnderscore(name)}</span>
      <Typography component={'span'} variant={'caption'} color={'text.secondary'}>{formatNum(level ?? 0, 'level')}</Typography>
    </Stack>
  },
  {
    key: 'bonus', label: 'Bonus', numeric: true, value: ({ bonus }) => bonus ?? 0,
    render: ({ bonus }) => formatNum(bonus ?? 0, 'pct', { signed: true })
  },
  { key: 'cost', label: 'Next cost (tokens)', numeric: true, kind: 'whole', value: ({ cost }) => cost ?? 0 }
];

// The King Rat import's panel: rat tokens read in the amount kind on both sides, the balance and the shop costs
const RatKing = ({ ratKing }) => {
  if (!ratKing) return null;
  const { crownsCount, kingRatUnlocked, ratBitMulti, ratCurrencyGain, ratCrownOdds, shopUpgrades } = ratKing;
  return <>
    <ItemCard.Section label={'King Rat'}>
      <ItemCard.Facts rows={[
        ['Crowns', crownsCount ?? 0, 'amount'],
        ['Bit multi', `${formatGame(ratBitMulti ?? 1, 'GamingStatType.RatBitMulti')}x`],
        ['Crown odds', formatNum((ratCrownOdds ?? 0) * 100, 'pct')],
        kingRatUnlocked ? ['Token gain', `${formatGame(ratCurrencyGain ?? 0, 'GamingStatType.RatCurrencyGain')}/hr`] : null
      ]}/>
    </ItemCard.Section>
    {shopUpgrades?.length ? <ItemCard.Section label={'King Rat Shop'}>
      <DataTable fits columns={SHOP_COLUMNS} rows={shopUpgrades} rowKey={'name'} sx={{ '& tbody td.name': { whiteSpace: 'nowrap' } }}/>
    </ItemCard.Section> : null}
  </>;
};

export default RatKing;

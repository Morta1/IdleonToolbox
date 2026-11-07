import React from 'react';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import DataTable from '@components/common/DataTable';

// An import's shop (King Rat's, the Autumn Squirrel's) as one small table: the upgrade with its level under its name, its
// bonus where the name doesn't already say it, and the next level's cost, the currency named once in the header. A short
// name never wraps (the header over the costs takes two lines instead); the squirrel's upgrades are the game's sentences,
// which wrap.
const ShopTable = ({ rows, currency, withBonus }) => {
  const columns = [
    {
      key: 'name', label: 'Upgrade',
      render: ({ name, level }) => <Stack component={'span'}>
        <span>{cleanUnderscore(name)}</span>
        <Typography component={'span'} variant={'caption'} color={'text.secondary'}>{formatNum(level ?? 0, 'level')}</Typography>
      </Stack>
    },
    withBonus ? {
      key: 'bonus', label: 'Bonus', numeric: true, value: ({ bonus }) => bonus ?? 0,
      render: ({ bonus }) => formatNum(bonus ?? 0, 'pct', { signed: true })
    } : null,
    { key: 'cost', label: `Next cost (${currency})`, numeric: true, kind: 'whole', value: ({ cost }) => cost ?? 0 }
  ].filter(Boolean);
  return <DataTable fits columns={columns} rows={rows} rowKey={'name'}
                    sx={withBonus ? { '& tbody td.name': { whiteSpace: 'nowrap' } } : undefined}/>;
};

export default ShopTable;

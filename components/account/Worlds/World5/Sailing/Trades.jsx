import { Stack } from '@mui/material';
import React from 'react';
import { isValid } from 'date-fns';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import Num from '@components/common/Num';
import Notice from '@components/common/Notice';
import useFormatDate from '@hooks/useFormatDate';
import { treasureIndex, treasureName } from './LootPile';

// An amount beside its sprite, right-aligned in its cell
const amountCell = (icon, alt, value) => <Stack direction={'row'} gap={1} alignItems={'center'} justifyContent={'flex-end'}>
  <GameIcon src={icon} size={24} alt={alt}/>
  <Num value={value ?? 0} system={'Sailing'}/>
</Stack>;

// The trades are the next 40 six-hour windows from the save's own time, so a save older than ten days has none left
const Trades = ({ trades, hasBoats }) => {
  const formatDate = useFormatDate();
  if (!trades?.length) return hasBoats
    ? <Notice>No trades left from this save: trades show for ten days after each upload.</Notice>
    : <Notice tone={'locked'}>Trades show here once you have a boat: each one prices your first boat&apos;s loot.</Notice>;
  return <DataTable fits rowKey={'id'} rows={trades.map((trade) => ({ ...trade, id: new Date(trade.date).getTime() }))}
                    columns={[
                      {
                        key: 'date', label: 'When',
                        render: ({ date }) => (isValid(new Date(date)) ? formatDate(new Date(date), { showSeconds: false }) : '-')
                      },
                      {
                        key: 'give', label: 'You give', numeric: true,
                        render: ({ rawName, lootItemCost }) => amountCell(`data/${rawName}.png`, treasureName(treasureIndex(rawName)), lootItemCost)
                      },
                      {
                        key: 'get', label: 'You get', numeric: true,
                        render: ({ moneyValue }) => amountCell('data/SailT0.png', 'Gold bars', moneyValue)
                      }
                    ]}/>;
};

export default Trades;

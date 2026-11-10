import { Box, Stack } from '@mui/material';
import React from 'react';
import { isValid } from 'date-fns';
import { IconArrowRight } from '@tabler/icons-react';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import Num from '@components/common/Num';
import Notice from '@components/common/Notice';
import useFormatDate from '@hooks/useFormatDate';
import { treasureIndex, treasureName } from './LootPile';

// An amount beside its sprite; end: right-aligned in a table cell
const amount = (icon, alt, value, end) => <Stack direction={'row'} gap={end ? 1 : 0.75} alignItems={'center'}
                                                 justifyContent={end ? 'flex-end' : 'flex-start'}>
  <GameIcon src={icon} size={24} alt={alt}/>
  <Num value={value ?? 0} system={'Sailing'}/>
</Stack>;
const give = ({ rawName, lootItemCost }, end) => amount(`data/${rawName}.png`, treasureName(treasureIndex(rawName)), lootItemCost, end);
const get = ({ moneyValue }, end) => amount('data/SailT0.png', 'Gold bars', moneyValue, end);

// The trades are the next 40 six-hour windows from the save's own time, so a save older than ten days has none left.
// In a failed section the page's note says why there are none.
// Small cards from sm, as the old page had them: 8 rows at 1920 where the table ran 40. A phone takes one card a row,
// twice the table's height, so it keeps the table. CSS picks one, so the export's markup matches the client's.
const Trades = ({ trades, hasBoats, sectionFailed }) => {
  const formatDate = useFormatDate();
  if (!trades?.length) return sectionFailed ? null : hasBoats
    ? <Notice>Trades show for ten days after each upload: this save&apos;s have all passed.</Notice>
    : <Notice tone={'locked'}>Trades show here once you have a boat: each one prices your first boat&apos;s loot.</Notice>;
  const when = ({ date }) => (isValid(new Date(date)) ? formatDate(new Date(date), { showSeconds: false }) : '-');
  const rows = trades.map((trade) => ({ ...trade, id: new Date(trade.date).getTime() }));
  return <>
    <CardGrid size={'s'} sx={{ display: { xs: 'none', sm: 'grid' } }}>
      {rows.map((trade) => <ItemCard key={trade.id} title={when(trade)}>
        <Stack direction={'row'} alignItems={'center'} gap={1.5} sx={{ typography: 'body2' }}>
          {give(trade)}
          <Box component={IconArrowRight} size={16} aria-label={'for'} sx={{ color: 'text.secondary', flexShrink: 0 }}/>
          {get(trade)}
        </Stack>
      </ItemCard>)}
    </CardGrid>
    <Box sx={{ display: { sm: 'none' } }}>
      <DataTable fits rowKey={'id'} rows={rows}
                 columns={[
                   { key: 'date', label: 'When', render: when },
                   { key: 'give', label: 'You give', numeric: true, render: (trade) => give(trade, true) },
                   { key: 'get', label: 'You get', numeric: true, render: (trade) => get(trade, true) }
                 ]}/>
    </Box>
  </>;
};

export default Trades;

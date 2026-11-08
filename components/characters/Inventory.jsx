import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatDuration, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import ItemDisplay from '@components/common/ItemDisplay';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';

// A rate on a tile: from 1,000 an hour in the game's Big ("+144K/hr"), as a tile's other numbers read; "+143,236.38/hr"
// ran past a 72 px tile. The tile's note keeps the exact rate.
const tileRate = (perHour) => (Math.abs(perHour) >= 1e3
  ? `${perHour < 0 ? '-' : '+'}${formatGame(Math.abs(perHour), 'Big', { whole: true })}/hr`
  : formatNum(perHour, 'rate'));

// A character's inventory, a Panel with its capacity. asc, and no slots to count: the active calculator's lists, which sit
// under their own headings, so the grid alone (asc is the wider list). ratesKnown false: those lists' rates have no time
// to divide by (a snapshot newer than the save), so their tiles read "-".
const Inventory = ({ inventory, inventoryLength, inventorySlots, amountKey = 'amount', asc, account, ratesKnown = true }) => {
  const capacity = inventorySlots ? `Capacity ${formatNum(inventoryLength || inventory?.length || 0)} / ${formatNum(inventorySlots)}` : null;
  const grid = <CardGrid size={'icon'} fill sheetColumns={[6]}>
    {inventory?.map((item, index) => <IconTile
      key={item?.rawName + '' + index} icon={`data/${item?.rawName}.png`} alt={cleanUnderscore(item?.displayName ?? item?.name ?? '')}
      value={!ratesKnown ? '-' : item?.perHour ? tileRate(item.perHour) : formatNum(item?.[amountKey], 'whole')}
      details={ratesKnown && item?.perHour ? <ExtraData {...item} amount={item?.[amountKey]}/> : <ItemDisplay {...item} account={account}/>}/>)}
  </CardGrid>;
  return capacity && !asc
    ? <Panel title={'Inventory'} meta={capacity}>{grid}</Panel>
    : <Box sx={{ width: asc ? 450 : 250, maxWidth: '100%' }}>
      {capacity ? <Typography variant={'body2'} color={'text.secondary'} sx={{ mb: 1 }}>{capacity}</Typography> : null}
      {grid}
    </Box>;
};

const ExtraData = ({ name, displayName, perHour, perDay, perGoal, amount }) => <Stack gap={0.5}>
  <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(name || displayName)}</Typography>
  <ItemCard.Facts rows={[
    perHour ? ['Total', formatNum(amount, 'whole')] : null,
    perHour ? ['Rate', formatNum(perHour, 'rate', { precise: true })] : null,
    perDay ? ['Per day', formatNum(perDay, 'rate', { precise: true, per: 'day' })] : null,
    perGoal ? ['Goal', perGoal > 0 ? `${formatDuration(perGoal * 3600)} to go` : 'Reached'] : null
  ]}/>
</Stack>;

export default Inventory;

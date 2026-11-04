import { Stack } from '@mui/material';
import { isValid } from 'date-fns';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import useFormatDate from '@hooks/useFormatDate';
import GameIcon from '@components/common/GameIcon';
import Num from '@components/common/Num';
import { treasureIndex, treasureName } from './LootPile';

// One trade: the treasure you give against the gold bars you get (the dashboard's sailing trade note)
const Trade = ({ rawName, date, lootItemCost, moneyValue }) => {
  const formatDate = useFormatDate();
  return <>
    <Stack direction={'row'} alignItems={'center'} gap={1}>
      {isValid(new Date(date)) ? formatDate(new Date(date), { showSeconds: false }) : null}
    </Stack>
    <Stack direction={'row'} alignItems={'center'} gap={1}>
      <Stack direction={'row'} gap={1} alignItems={'center'}>
        <GameIcon src={`data/${rawName}.png`} size={24} alt={treasureName(treasureIndex(rawName))}/>
        <Num value={lootItemCost ?? 0} system={'Sailing'}/>
      </Stack>
      <CompareArrowsIcon/>
      <Stack direction={'row'} gap={1} alignItems={'center'}>
        <GameIcon src={'data/SailT0.png'} size={24} alt={'Gold bars'}/>
        <Num value={moneyValue ?? 0} system={'Sailing'}/>
      </Stack>
    </Stack>
  </>;
};

export default Trade;

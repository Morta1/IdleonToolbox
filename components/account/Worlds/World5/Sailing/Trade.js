import { Stack } from '@mui/material';
import { format, isValid } from 'date-fns';
import { notateNumber, prefix } from '../../../../../utility/helpers';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

const Trade = ({ rawName, date, lootItemCost, moneyValue }) => {
  return <>
    <Stack direction={'row'} alignItems={'center'} justifyContent={'center'} gap={1}>
      {isValid(new Date(date)) ? format(new Date(date), 'dd/MM/yyyy HH:mm:ss') : null}
    </Stack>
    <Stack direction={'row'} alignItems={'center'} gap={1} justifyContent={'center'}>
      <Stack direction={'row'} gap={1}>
        <img src={`${prefix}data/${rawName}.png`} alt=""/>
        {notateNumber(lootItemCost)}
      </Stack>
      <CompareArrowsIcon/>
      <Stack direction={'row'} gap={1}>
        <img src={`${prefix}data/SailT0.png`} alt=""/>
        {notateNumber(moneyValue)}
      </Stack>
    </Stack>
  </>
};

export default Trade;

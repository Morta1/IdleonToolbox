import { Stack } from '@mui/material';
import { isValid } from 'date-fns';
import { notateNumber, prefix } from '@utility/helpers';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import useFormatDate from '@hooks/useFormatDate';

const Trade = ({ rawName, date, lootItemCost, moneyValue }) => {
  const formatDate = useFormatDate();
  return <>
    <Stack direction={'row'} alignItems={'center'} justifyContent={'center'} gap={1}>
      {isValid(new Date(date)) ? formatDate(new Date(date)) : null}
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

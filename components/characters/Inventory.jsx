import { Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, numberWithCommas, prefix } from '../../utility/helpers';
import { TitleAndValue } from '../common/styles';
import Tooltip from '../Tooltip';

const Inventory = ({ inventory, inventoryLength, inventorySlots, amountKey = 'amount' }) => {
  return <Stack sx={{ width: 250 }}>
    {inventorySlots ? <TitleAndValue title={'Capacity'}
                                     value={`${inventoryLength || inventory?.length || 0}/${inventorySlots}`}/> : null}
    <Stack sx={{ mt: 1 }} direction={'row'} flexWrap={'wrap'}>
      {inventory?.map((item, index) => {
        return <Tooltip title={<ExtraData {...item}/>}
                        key={item?.rawName + '' + index}>
          <Stack alignItems={'center'}
                 sx={{
                   border: '1px solid rgb(255 255 255 / 12%)',
                   width: '25%',
                   p: 1
                 }}>
            <img width={32} height={32} src={`${prefix}data/${item?.rawName}.png`} alt=""/>
            <Typography>{notateNumber(item?.[amountKey])}</Typography>
          </Stack>
        </Tooltip>
      })}
    </Stack>
  </Stack>
};

const ExtraData = ({ name, perHour, perDay, perGoal }) => {
  return <Stack>
    <Typography variant={'body1'}>{cleanUnderscore(name)}</Typography>
    {perHour ? <Divider sx={{ my: 1 }}/> : null}
    {perHour ? <Typography variant={'body2'}>{numberWithCommas(perHour.toFixed(2))} / hr</Typography> : null}
    {perDay ? <Typography variant={'body2'}>{numberWithCommas(perDay.toFixed(2))} / day</Typography> : null}
    {perGoal ? <Typography variant={'body2'}>{perGoal > 0
      ? `${perGoal.toFixed(2)} hours to goal`
      : 'Goal reached'} </Typography> : null}
  </Stack>
}

export default Inventory;

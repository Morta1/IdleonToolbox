import { Stack, Typography } from "@mui/material";
import { notateNumber, prefix, cleanUnderscore } from "../../utility/helpers";
import { TitleAndValue } from "../common/styles";
import Tooltip from "../Tooltip";

const Inventory = ({ inventory, inventorySlots }) => {
  return <Stack sx={{ width: 250 }}>
    <TitleAndValue title={'Capacity'} value={`${inventory?.length ?? 0}/${inventorySlots}`}/>
    <Stack sx={{ mt: 1 }} direction={'row'} flexWrap={'wrap'}>
      {inventory?.map((item, index) => {
        return <Tooltip title={cleanUnderscore(item?.name)} key={item?.rawName + '' + index}>
          <Stack alignItems={'center'}
                 sx={{
                   border: '1px solid rgb(255 255 255 / 12%)',
                   width: '25%',
                   p: 1
                 }}>
            <img width={32} height={32} src={`${prefix}data/${item?.rawName}.png`} alt=""/>
            <Typography>{notateNumber(item?.amount)}</Typography>
          </Stack>
        </Tooltip>

      })}
    </Stack>
  </Stack>
};

export default Inventory;

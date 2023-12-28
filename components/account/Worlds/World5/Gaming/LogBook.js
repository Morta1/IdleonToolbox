import { Stack } from '@mui/material';
import { prefix } from '@utility/helpers';

const LogBook = ({ logBook }) => {
  return (
    <Stack direction={'row'}  gap={2} flexWrap={'wrap'} alignitems={'center'}>
      {logBook?.map((rawName, index) => {
        return <img style={{ width: 64, height: 64 }} key={rawName + index} src={`${prefix}data/${rawName}`} alt={''}/>
      })}
    </Stack>
  );
};

export default LogBook;

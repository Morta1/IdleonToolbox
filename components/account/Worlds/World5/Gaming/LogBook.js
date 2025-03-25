import { Stack } from '@mui/material';
import { prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';

const LogBook = ({ logBook, ownedLogBooks }) => {
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignitems={'center'}>
      {logBook?.map(({ rawName, unlocked }, index) => {
        return <img data-index={index} style={{ width: 64, height: 64, opacity: unlocked ? 1 : .5 }}
                    key={rawName + index} src={`${prefix}data/${rawName}`} alt={''}/>
      })}
    </Stack>
  </>
};

export default LogBook;

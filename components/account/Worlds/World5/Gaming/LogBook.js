import { Stack } from '@mui/material';
import { prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';

const LogBook = ({ logBook }) => {
  const owned = logBook.reduce((sum, { unlocked }) => sum + (unlocked ? 1 : 0), 0);
  return <>
    <CardTitleAndValue title={''}
                       value={`${owned} / ${logBook?.length}`}></CardTitleAndValue>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignitems={'center'}>
      {logBook?.map(({ rawName, unlocked }, index) => {
        return <img data-index={index} style={{ width: 64, height: 64, opacity: unlocked ? 1 : .5 }}
                    key={rawName + index} src={`${prefix}data/${rawName}`} alt={''}/>
      })}
    </Stack>
  </>
};

export default LogBook;

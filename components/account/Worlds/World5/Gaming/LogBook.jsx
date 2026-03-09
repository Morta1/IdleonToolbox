import { Box, Stack } from '@mui/material';
import { prefix } from '@utility/helpers';

const LogBook = ({ logBook, ownedLogBooks }) => {
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignitems={'center'}>
      {logBook?.map(({ rawName, unlocked, crowned }, index) => {
        return <Box key={rawName + index} sx={{ position: 'relative', width: 64, height: 64 }}>
          <img style={{
            width: 64, height: 64,
            opacity: unlocked ? 1 : .5,
            filter: crowned ? 'hue-rotate(220deg) saturate(2)' : 'none'
          }}
               src={`${prefix}data/${rawName}`} alt={''}/>
          {crowned && <img style={{ position: 'absolute', top: 0, right: 0, width: 28, height: 28 }}
                           src={`${prefix}data/GamingRatCrown.png`} alt={''}/>}
        </Box>
      })}
    </Stack>
  </>
};

export default LogBook;

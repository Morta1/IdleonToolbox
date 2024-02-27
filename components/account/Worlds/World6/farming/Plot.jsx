import { Card, CardContent, Stack, Typography } from '@mui/material';
import { prefix } from '@utility/helpers';

const Plot = ({ plot }) => {
  return <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
    {plot?.map(({
                  seedType,
                  progress,
                  growthReq,
                  growthRate,
                  cropType,
                  cropQuantity,
                  cropProgress,
                  cropRawName,
                  seedRawName,
                  nextOGChance,
                  currentOG,
                  ogMulti
                }, index) => {
      nextOGChance = Math.min(100, 100 * nextOGChance);
      nextOGChance = nextOGChance >= 10 ? Math.round(nextOGChance) : Math.round(10 * nextOGChance) / 10;
      // const timeLeft = growthReq - progress / growthRate;
      return <Card key={'plot-' + index} sx={{width: 200}}>
        <CardContent>
          <Stack direction={'row'} alignItems={'center'} gap={2}>
            <img src={`${prefix}etc/${seedRawName}`} alt={''}/>
            <Stack>
              <Stack direction={'row'} gap={1}>
                <img width={20} height={20} src={`${prefix}data/${cropRawName}`} alt={''}/>
                <Typography>{cropQuantity}</Typography>
              </Stack>
              <Typography variant={'caption'}>Floor {Math.floor((index / 9) + 1)}</Typography>
            </Stack>
          </Stack>
          <Typography mt={2}>Current OG: {currentOG} (x{ogMulti})</Typography>
          <Typography>Next OG: {nextOGChance}%</Typography>
          {/*<Typography>Growth: {notateNumber(progress)} / {notateNumber(growthReq)}</Typography>*/}
        </CardContent>
      </Card>
    })}
  </Stack>;
};

export default Plot;

import { Card, CardContent, Stack, Typography } from '@mui/material';
import { prefix } from '@utility/helpers';
import Timer from '@components/common/Timer';
import React from 'react';
import LockIcon from '@mui/icons-material/Lock';
import { getTotalCrop } from '@parsers/world-6/farming';
import { CardTitleAndValue } from '@components/common/styles';

const Plot = ({ plot, lastUpdated }) => {
  const totals = getTotalCrop(plot);
  return <>
    <CardTitleAndValue title={'Totals'}>
      <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
        {Object.entries(totals || {}).map(([icon, quantity]) => {
          return <Card variant={'outlined'} key={icon}>
            <CardContent>
              <Stack  direction={'row'} gap={1}>
                <Typography>{quantity}</Typography>
                <img width={20} height={20} src={`${prefix}data/${icon}`} alt={''}/>
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
    </CardTitleAndValue>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
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
                    isLocked,
                    currentOG,
                    ogMulti,
                    timeLeft
                  }, index) => {
        nextOGChance = Math.min(100, 100 * nextOGChance);
        nextOGChance = nextOGChance >= 10 ? Math.round(nextOGChance) : Math.round(10 * nextOGChance) / 10;
        return <Card key={'plot-' + index} sx={{ width: 200 }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'center'} gap={2}>
              <img src={`${prefix}etc/${seedRawName}`} alt={''}/>
              <Stack>
                <Stack direction={'row'} gap={1}>
                  <Typography>{cropQuantity}</Typography>
                  <img width={20} height={20} src={`${prefix}data/${cropRawName}`} alt={''}/>
                </Stack>
                <Typography variant={'caption'}>Floor {Math.floor((index / 9) + 1)}</Typography>
              </Stack>
              {isLocked ? <LockIcon sx={{ ml: 'auto' }}/> : null}
            </Stack>
            <Typography mt={2}>Current OG: {currentOG} (x{ogMulti})</Typography>
            <Typography>Next OG: {nextOGChance}%</Typography>
            <Timer type={'countdown'} lastUpdated={lastUpdated}
                   date={new Date().getTime() + timeLeft * 1000}/>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>;
};

export default Plot;
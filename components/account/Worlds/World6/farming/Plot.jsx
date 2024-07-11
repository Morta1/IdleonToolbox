import { Card, CardContent, Stack, Typography } from '@mui/material';
import { msToDate, notateNumber, prefix } from '@utility/helpers';
import Timer from '@components/common/Timer';
import React from 'react';
import LockIcon from '@mui/icons-material/Lock';
import { getProductDoubler, getTotalCrop } from '@parsers/world-6/farming';
import { CardTitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

const Plot = ({ plot, market, ranks, lastUpdated }) => {
  const { productDoubler, percent, multi } = getProductDoubler(market) || {};
  const totals = getTotalCrop(plot, market, ranks);
  return <>
    <CardTitleAndValue title={`Totals${productDoubler > 100 && multi >= 2 ? ` (x${multi})` : ''}`}>
      <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
        {Object.entries(totals || {}).map(([icon, quantity]) => {
          return <Card variant={'outlined'} key={icon}>
            <CardContent>
              <Stack direction={'row'} gap={1}>
                <Typography>{Math.round(quantity)}</Typography>
                <img width={20} height={20} src={`${prefix}data/${icon}`} alt={''}/>
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
      <Stack mt={1}>
        {productDoubler < 100 ? <Typography variant={'caption'}
                                            color={'text.secondary'}>*
          Doesn't include your {productDoubler}% chance to
          x2 the quantity collected from product doubler</Typography> : percent > 0 ? <Typography variant={'caption'}
                                                                                                  color={'text.secondary'}>*
          Doesn't
          include your {percent}% chance to
          x{parseInt(multi) + 1} the quantity
          collected from product doubler</Typography> : null}
      </Stack>
    </CardTitleAndValue>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      {plot?.map(({
                    rank,
                    rankProgress,
                    rankRequirement,
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
                    timeLeft,
                    maxTimeLeft
                  }, index) => {
        nextOGChance = Math.min(100, 100 * nextOGChance);
        nextOGChance = nextOGChance >= 10 ? Math.round(nextOGChance) : Math.round(10 * nextOGChance) / 10;
        return <Card key={'plot-' + index} sx={{ width: 200, mt: 1 }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'center'} gap={2}>
              <img src={`${prefix}etc/${seedRawName}`} alt={''}/>
              <Stack>
                <Stack direction={'row'} gap={1}>
                  <Typography>{cropQuantity}</Typography>
                  <img width={20} height={20} src={`${prefix}data/${cropRawName}`} alt={''}/>
                  <Tooltip title={<Typography style={{ fontWeight: 400 }}>Max
                    time: {msToDate(maxTimeLeft * 1000)}</Typography>}>
                    <InfoIcon fontSize={'small'}/>
                  </Tooltip>
                </Stack>
                <Typography variant={'caption'}>Floor {Math.floor((index / 9) + 1)}</Typography>
                <Typography variant={'caption'}>Rank {rank || 0}</Typography>
                {ranks?.[index]?.upgradeLevel > 0 ? <Typography
                  variant={'caption'}>{notateNumber(rankProgress)} / {notateNumber(rankRequirement)}</Typography> : null}
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

import React from 'react';
import Timer from '../../../common/Timer';
import { Divider, Stack, Typography } from '@mui/material';
import { getRealDateInMs, prefix } from '../../../../utility/helpers';
import Tooltip from '../../../Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import { Breakdown } from '../../../common/styles';

const Library = ({ libraryTimes, lastUpdated }) => {
  let { bookCount, next, breakpoints, breakdown } = libraryTimes || {};
  const nextDate = new Date().getTime() + next * 1000;
  const nextEndDate = getRealDateInMs(nextDate);

  return <>
    <Stack direction={'row'} alignItems={'center'} gap={1}>
      <img src={`${prefix}data/Libz.png`} alt=""/>
      <Typography sx={{ fontWeight: 'bold', fontSize: 18 }}>Library</Typography>
      <Tooltip title={<Breakdown breakdown={breakdown} titleStyle={{width: 170}}/>}>
        <InfoIcon/>
      </Tooltip>
    </Stack>
    <h4>Book count: {bookCount}</h4>
    <Stack direction={'row'} gap={1} alignItems={'center'}>
      <Typography sx={{ width: 130 }}>Next book in: </Typography> {next > 0 ?
      <Tooltip title={'End date: ' + nextEndDate}>
        <Timer type={'countdown'} lastUpdated={lastUpdated}
               date={nextDate}/>
      </Tooltip> :
      <Typography variant={'caption'}>Wait for game update</Typography>}
    </Stack>
    {breakpoints?.map(({ breakpoint, time }, index) => {
      let endDate = new Date().getTime() + time * 1000;
      endDate = getRealDateInMs(endDate);
      return time > 0 ? <React.Fragment key={'book-timer' + index}>
        <Divider sx={{ my: 1 }}/>
        <Stack direction={'row'} gap={1}>
          <Typography sx={{ width: 130 }}>{breakpoint === 0 ? '0 to 20' : breakpoint} books
            in: </Typography> {time > 0 ? <Tooltip title={'End date: ' + endDate}>
            <Timer type={'countdown'}
                   lastUpdated={lastUpdated}
                   staticTime={breakpoint === 0}
                   date={new Date().getTime() + time * 1000}/>
          </Tooltip> :
          <Typography variant={'caption'}>Wait for game update</Typography>}
        </Stack>
      </React.Fragment> : null
    })}
  </>
};

export default Library;

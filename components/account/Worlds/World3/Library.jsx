import React, { useState } from 'react';
import Timer from '../../../common/Timer';
import { Collapse, Divider, Stack, Typography } from '@mui/material';
import { prefix } from '@utility/helpers';
import useRealDate from '@hooks/useRealDate';
import Tooltip from '../../../Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Breakdown } from '@components/common/Breakdown/Breakdown';

const BookBreakpoint = ({ breakpoint, label, time, lastUpdated, getRealDateInMs }) => {
  let endDate = new Date().getTime() + time * 1000;
  endDate = getRealDateInMs(endDate);
  return time > 0 ? <>
    <Divider sx={{ my: 1 }} />
    <Stack direction={'row'} gap={1}>
      <Typography sx={{ width: 130 }}>{label || breakpoint} books
        in: </Typography>
      <Tooltip title={'End date: ' + endDate}>
        <Timer type={'countdown'}
          lastUpdated={lastUpdated}
          staticTime={breakpoint === 0}
          date={new Date().getTime() + time * 1000} />
      </Tooltip>
    </Stack>
  </> : null;
};

const Library = ({ libraryTimes, lastUpdated }) => {
  const getRealDateInMs = useRealDate();
  const [showMore, setShowMore] = useState(false);
  let { bookCount, next, breakpoints, breakdown } = libraryTimes || {};
  const nextDate = new Date().getTime() + next * 1000;
  const nextEndDate = getRealDateInMs(nextDate);

  const mainBreakpoints = breakpoints?.filter(({ label }) => !label || label === '0 to 20');
  const extraBreakpoints = breakpoints?.filter(({ label }) => label && label !== '0 to 20');

  return <>
    <Stack direction={'row'} alignItems={'center'} gap={1}>
      <img width={24} src={`${prefix}data/Libz.png`} alt="" />
      <Typography sx={{ fontWeight: 'bold', fontSize: 16 }}>Library</Typography>
      <Breakdown data={breakdown}>
        <InfoIcon fontSize={'small'} />
      </Breakdown>
    </Stack>
    <Typography sx={{ my: 1 }}>Book count: {bookCount}</Typography>
    <Stack direction={'row'} gap={1} alignItems={'center'}>
      <Typography sx={{ width: 130 }}>Next book in: </Typography> {next > 0 ?
        <Tooltip title={'End date: ' + nextEndDate}>
          <Timer type={'countdown'} lastUpdated={lastUpdated}
            date={nextDate} />
        </Tooltip> :
        <Typography variant={'caption'}>Wait for game update</Typography>}
    </Stack>
    {mainBreakpoints?.map((bp, index) => (
      <BookBreakpoint key={'book-timer-' + index} {...bp} lastUpdated={lastUpdated}
        getRealDateInMs={getRealDateInMs} />
    ))}
    {extraBreakpoints?.length > 0 && <>
      <Divider sx={{ my: 1 }} />
      <Typography variant={'caption'} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
        onClick={() => setShowMore(!showMore)}>
        More breakpoints {showMore ? <ExpandLessIcon fontSize={'small'} /> : <ExpandMoreIcon fontSize={'small'} />}
      </Typography>
      <Collapse in={showMore}>
        {extraBreakpoints.map((bp, index) => (
          <BookBreakpoint key={'book-timer-extra-' + index} {...bp} lastUpdated={lastUpdated}
            getRealDateInMs={getRealDateInMs} />
        ))}
      </Collapse>
    </>}
  </>
};

export default Library;

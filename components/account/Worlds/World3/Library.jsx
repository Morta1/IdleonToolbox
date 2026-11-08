import React from 'react';
import Timer from '../../../common/Timer';
import { Box, Stack, Typography } from '@mui/material';
import { formatDuration, formatNum } from '@utility/helpers';
import useFormatDate from '@hooks/useFormatDate';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import Panel from '@components/common/cards/Panel';
import { NoteTrigger } from '@components/common/InfoButton';

const MORE_SX = { mx: 1, my: 0.75, color: 'primary.main', fontSize: 13, fontWeight: 500, borderRadius: '4px' };
const NOTE_ROW_SX = { display: 'flex', justifyContent: 'space-between', gap: 3 };

// A wait, measured from now (the parse already counts the time since the save), and the date it ends on.
const WaitRow = ({ name, time }) => {
  const formatDate = useFormatDate();
  const endDate = new Date().getTime() + time * 1000;
  return <Panel.Row name={name} sub={formatDate(endDate, { showSeconds: false })}
                    value={<Timer type={'countdown'} date={endDate} component={'span'}/>}/>;
};

// live: a save to count from. A guest's library has books to count up to but no clock to count on, so it prints only the spans.
// The longer spans (40 to 100 books) open in a note, not in the card: opened in it, they grew the card, and on General's
// flowing columns every card after it moved.
const Library = ({ libraryTimes, failed, live }) => {
  const { bookCount, next, breakpoints, breakdown } = libraryTimes || {};
  // A labelled breakpoint ("0 to 20") is how long that many books take from none, not a wait: a duration, with no date.
  const breakpointRow = ({ breakpoint, label, time }) => {
    if (!(time > 0)) return null;
    if (label) return <Panel.Row key={label} name={`First ${label.replace('0 to ', '')} books take`} value={formatDuration(time)}/>;
    return live ? <WaitRow key={breakpoint} name={`${breakpoint} books in`} time={time}/> : null;
  };
  const mainBreakpoints = breakpoints?.filter(({ label }) => !label || label === '0 to 20');
  const extraBreakpoints = breakpoints?.filter(({ label, time }) => label && label !== '0 to 20' && time > 0);
  // The parser's total is seconds: the drawer is headed as its value reads
  const checkoutTime = formatDuration(breakdown?.totalValue);

  if (failed) {
    return <Panel icon={'data/Libz.png'} title={'Library'}>
      <Panel.KV label={'Books ready'} value={'-'}/>
      <Panel.KV label={'Next book in'} value={'-'}/>
    </Panel>;
  }

  return <Panel icon={'data/Libz.png'} title={'Library'}>
    <Panel.KV label={'Books ready'} value={formatNum(bookCount)}/>
    {breakdown ? <Panel.Row name={'Checkout time'}
                            value={<Breakdown asValue title={'Checkout time'} data={{ ...breakdown, totalValue: checkoutTime }}>{checkoutTime}</Breakdown>}/> : null}
    {live && next > 0 ? <WaitRow name={'Next book in'} time={next}/> : null}
    {mainBreakpoints?.map(breakpointRow)}
    {extraBreakpoints?.length > 0 ? <Box>
      <NoteTrigger label={'More breakpoints'} sx={MORE_SX} note={<Stack gap={0.75}>
        {extraBreakpoints.map(({ label, time }) => <Box key={label} sx={NOTE_ROW_SX}>
          <Typography variant={'body2'}>First {label.replace('0 to ', '')} books take</Typography>
          <Typography variant={'body2'} sx={{ fontWeight: 500 }}>{formatDuration(time)}</Typography>
        </Box>)}
      </Stack>}>
        More breakpoints
      </NoteTrigger>
    </Box> : null}
  </Panel>;
};

export default Library;

import React, { useState } from 'react';
import Timer from '../../../common/Timer';
import { Button, Collapse } from '@mui/material';
import { formatDuration, formatNum } from '@utility/helpers';
import useFormatDate from '@hooks/useFormatDate';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import Panel from '@components/common/cards/Panel';
import StatusText from '@components/common/StatusText';

// A wait, measured from now (the parse already counts the time since the save), and the date it ends on.
const WaitRow = ({ name, time, staticTime }) => {
  const formatDate = useFormatDate();
  const endDate = new Date().getTime() + time * 1000;
  return <Panel.Row name={name} sub={formatDate(endDate, { showSeconds: false })}
                    value={<Timer type={'countdown'} staticTime={staticTime} date={endDate} component={'span'}/>}/>;
};

const Library = ({ libraryTimes, failed }) => {
  const [showMore, setShowMore] = useState(false);
  const { bookCount, next, breakpoints, breakdown } = libraryTimes || {};
  const breakpointRow = ({ breakpoint, label, time }) => (time > 0
    ? <WaitRow key={label ?? breakpoint} name={`${label || breakpoint} books in`} time={time} staticTime={breakpoint === 0}/>
    : null);
  const mainBreakpoints = breakpoints?.filter(({ label }) => !label || label === '0 to 20');
  const extraBreakpoints = breakpoints?.filter(({ label }) => label && label !== '0 to 20');
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
    {breakdown ? <Panel.KV label={'Checkout time'} value={<Breakdown asValue title={'Checkout time'}
                                                                     data={{ ...breakdown, totalValue: checkoutTime }}>{checkoutTime}</Breakdown>}/> : null}
    {next > 0 ? <WaitRow name={'Next book in'} time={next}/>
      : <Panel.Row name={'Next book in'} value={<StatusText status={'info'}>Wait for game update</StatusText>}/>}
    {mainBreakpoints?.map(breakpointRow)}
    {extraBreakpoints?.length > 0 ? <Button size={'small'} aria-expanded={showMore} onClick={() => setShowMore(!showMore)}
                                            endIcon={showMore ? <IconChevronUp size={16}/> : <IconChevronDown size={16}/>}
                                            sx={{ mx: 1, my: 0.5, minHeight: { xs: 44, sm: 'auto' } }}>
      More breakpoints
    </Button> : null}
    {extraBreakpoints?.length > 0 ? <Collapse in={showMore}>{extraBreakpoints.map(breakpointRow)}</Collapse> : null}
  </Panel>;
};

export default Library;

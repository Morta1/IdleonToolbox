import React from 'react';
import Timer from '../../../common/Timer';
import { Box, Stack, Typography } from '@mui/material';
import { formatDuration, formatNum } from '@utility/helpers';
import useFormatDate from '@hooks/useFormatDate';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import Panel from '@components/common/cards/Panel';
import InfoButton from '@components/common/InfoButton';
import { getTimeToBooks } from '@parsers/misc';

const NOTE_ROW_SX = { display: 'flex', justifyContent: 'space-between', gap: 3 };
export const DEFAULT_LIBRARY_SPANS = [20, 40, 60, 80, 100];
const MAX_SPAN = 10000;

// The General page's "Library spans" setting: book counts, comma separated, each a whole number from 1 to 10,000.
export const parseLibrarySpans = (text) => {
  const parts = String(text ?? '').split(',').map((part) => part.trim()).filter(Boolean);
  const counts = parts.map(Number);
  if (!parts.length || counts.some((count) => !Number.isInteger(count) || count < 1 || count > MAX_SPAN)) {
    return { error: `Whole numbers from 1 to ${formatNum(MAX_SPAN)}, comma separated` };
  }
  return { spans: [...new Set(counts)].sort((a, b) => a - b) };
};

// A wait, measured from now (the parse already counts the time since the save), and the date it ends on.
const WaitRow = ({ name, time }) => {
  const formatDate = useFormatDate();
  const endDate = new Date().getTime() + time * 1000;
  return <Panel.Row name={name} sub={formatDate(endDate, { showSeconds: false })}
                    value={<Timer type={'countdown'} date={endDate} component={'span'}/>}/>;
};

const booksTake = (count) => `First ${formatNum(count, 'whole')} books take`;

// live: a save to count from. A guest's library has books to count up to but no clock to count on, so it prints only the spans.
// spans: the book counts the player picked (Page settings). The first is a row; the longer ones are an ⓘ note on it, not a
// fold in the card: opened in it, they grew the card, and on General's flowing columns every card after it moved.
const Library = ({ libraryTimes, failed, live, spans = DEFAULT_LIBRARY_SPANS }) => {
  const { bookCount, next, breakpoints, breakdown, baseFactor } = libraryTimes || {};
  // A span is how long that many books take from none, not a wait: a duration, with no date.
  const spanTimes = baseFactor > 0 ? spans.map((count) => ({ count, time: getTimeToBooks(baseFactor, count) })) : [];
  const [firstSpan, ...longerSpans] = spanTimes;
  const longerNote = longerSpans.length ? <InfoButton label={'longer spans'}>
    <Stack gap={0.75}>
      {longerSpans.map(({ count, time }) => <Box key={count} sx={NOTE_ROW_SX}>
        <Typography variant={'body2'}>{booksTake(count)}</Typography>
        <Typography variant={'body2'} sx={{ fontWeight: 500 }}>{formatDuration(time)}</Typography>
      </Box>)}
    </Stack>
  </InfoButton> : null;
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
    {live ? breakpoints?.filter(({ time }) => time > 0).map(({ breakpoint, time }) =>
      <WaitRow key={breakpoint} name={`${breakpoint} books in`} time={time}/>) : null}
    {firstSpan?.time > 0 ? <Panel.Row value={formatDuration(firstSpan.time)}
                                      name={<Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>{booksTake(firstSpan.count)}{longerNote}</Box>}/> : null}
  </Panel>;
};

export default Library;

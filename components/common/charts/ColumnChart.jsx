import { useEffect, useRef, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import Tooltip from '@components/Tooltip';
import { chartLines } from '@utility/chartTheme';
import { chartNum, labelIndexes, valueTicks } from '@utility/chartScale';
import { formatNum } from '@utility/helpers';
import { focusRing } from '../../../styles/theme/darkTheme';
import { ChartTooltipContent } from './ChartTooltip';
import useMarkFocus from './useMarkFocus';

const PLOT_ROWS = { xs: 'minmax(180px, 1fr) auto', sm: 'minmax(220px, 1fr) auto' };
// A host's spare height grows the plot up to this, axis labels included: past it a table twin beside it would stretch it.
const TALLEST_CHART = 520;
// The room an x label needs, as LineChart's X_LABEL_ROOM: about one 12 px digit or comma a character, and a gap.
// Labels are never rotated: when the columns are narrower than that, every second (third, ...) one prints,
// from the first.
const CHAR_WIDTH = 7;
const LABEL_GAP = 8;
// Before the plot is measured (the first render, the one the export holds) the count decides: up to eight
// buckets every label, past that four.
const ALL_LABELS = 8;
const FEW_LABELS = 4;

// Show a spread, or a few parts per bucket (Charts board, "Form by job"): columns in bucket order on one value
// axis, at most four ticks in text.muted on the 8% grid, the 23% edge under them. A column is at most 24 px wide,
// at least 2 px high when it holds anything, square at the baseline and 4 px round on top; stacked parts keep
// 2 px of card between them. One series labels its tallest column on the cap; the axis carries the rest. The hit
// area is the whole bucket, the tooltip sits on the column's top, and on a touch screen a drag across the plot
// picks the column under the finger (a column can be 14 px wide on a phone).
// series: [{ key, label, color }]; rows: [{ key, label, range, values: { [series key]: n }, color }]. A row's own
// color is a named bucket's game color (a world), which its label names.
const ColumnChart = ({ label, series, rows }) => {
  const theme = useTheme();
  const plot = useRef(null);
  const [width, setWidth] = useState(0);
  // Measured after mount, never during render, so the static export hydrates.
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(plot.current);
    return () => observer.disconnect();
  }, []);

  const { grid, edge } = chartLines(theme);
  const totals = rows.map((row) => series.reduce((sum, item) => sum + (row.values[item.key] ?? 0), 0));
  const { max, ticks } = valueTicks(0, Math.max(0, ...totals));
  const column = width && rows.length ? width / rows.length : 0;
  const labelWidth = CHAR_WIDTH * Math.max(0, ...rows.map((row) => String(row.label).length));
  const everyNth = column ? Math.max(1, Math.ceil((labelWidth + LABEL_GAP) / column)) : 0;
  // The end label moves inside the plot by what it overhangs (endLabelInside), out of the gap to the label before it,
  // which gives way when that leaves too little ("15,000" against "18,000+").
  const beforeEndGivesWay = everyNth * column < labelWidth + LABEL_GAP + Math.max(0, labelWidth - column) / 2;
  const labelled = new Set(everyNth
    ? rows.map((_, i) => i).filter((i) => i % everyNth === 0 && !(beforeEndGivesWay && i === rows.length - 1 - everyNth))
    : labelIndexes(rows.length, rows.length <= ALL_LABELS ? rows.length : FEW_LABELS));
  // A label wider than its column would run past the card at the plot's end ("18,000+" on a phone).
  const endLabelInside = column > 0 && labelWidth > column;
  const peak = series.length === 1 ? totals.indexOf(Math.max(...totals)) : -1;
  const { open, show, markProps } = useMarkFocus(rows.length);
  const height = (value) => `${max ? (value / max) * 100 : 0}%`;
  // Parts top-down, as the stack reads, without the empty ones; square keys, as the columns are.
  const tooltipRows = (row, index) => (series.length === 1
    ? [{ label: series[0].label, value: formatNum(totals[index]) }]
    : [
      ...series.toReversed().filter((item) => row.values[item.key])
        .map((item) => ({ key: item.key, label: item.label, value: formatNum(row.values[item.key]), color: item.color, mark: 'square' })),
      { key: 'total', label: 'Total', value: formatNum(totals[index]) }
    ]);
  const pick = (event) => {
    if (event.pointerType === 'mouse' || !event.buttons) return;
    const box = event.currentTarget.getBoundingClientRect();
    show(Math.max(0, Math.min(rows.length - 1, Math.floor(((event.clientX - box.left) / box.width) * rows.length))));
  };

  return <Box sx={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gridTemplateRows: PLOT_ROWS, columnGap: 1, pt: 2, flexGrow: 1, maxHeight: TALLEST_CHART }}>
    <Box aria-hidden sx={{ position: 'relative', minWidth: 28 }}>
      {ticks.map((tick) => <Box key={tick} sx={{
        position: 'absolute', right: 0, bottom: height(tick), transform: 'translateY(50%)',
        typography: 'caption', lineHeight: 1, color: 'text.muted', fontVariantNumeric: 'tabular-nums'
      }}>{chartNum(tick)}</Box>)}
    </Box>
    <Box ref={plot} sx={{ position: 'relative', borderBottom: `1px solid ${edge}` }}>
      {ticks.filter((tick) => tick > 0).map((tick) => <Box key={tick} aria-hidden sx={{
        position: 'absolute', left: 0, right: 0, bottom: height(tick), borderTop: `1px solid ${grid}`
      }}/>)}
      {/* pan-y: a sideways drag picks columns, an up or down one still scrolls the page. */}
      <Box component={'ol'} aria-label={label} onPointerMove={pick} sx={{
        position: 'absolute', inset: 0, m: 0, p: 0, listStyle: 'none', display: 'flex', touchAction: 'pan-y'
      }}>
        {rows.map((row, index) => <Box component={'li'} key={row.key} {...markProps(index)}
                                       aria-label={`${row.range}: ${formatNum(totals[index])}`} sx={{
          position: 'relative', flex: 1, minWidth: 0, height: '100%',
          display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: '2px',
          borderRadius: '4px',
          // A tap would leave a hover on, so only a pointer that hovers lightens a bar; focus always does.
          '@media (hover: hover)': { '&:hover .bar': { filter: 'brightness(1.25)' } },
          '&:focus-visible .bar': { filter: 'brightness(1.25)' },
          '&:focus-visible': focusRing(theme, 0)
        }}>
          {series.map((item, part) => {
            const value = row.values[item.key] ?? 0;
            if (!value) return null;
            const top = series.slice(part + 1).every((next) => !row.values[next.key]);
            return <Box key={item.key} className={'bar'} sx={{
              width: '70%', maxWidth: 24, height: height(value), minHeight: 2, flexShrink: 0,
              bgcolor: row.color ?? item.color, borderRadius: top ? '4px 4px 0 0' : 0
            }}/>;
          })}
          {index === peak ? <Box sx={{ typography: 'caption', lineHeight: '16px', fontWeight: 500, color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {chartNum(totals[index])}
          </Box> : null}
          {/* The tooltip's anchor: the column's top, not the bucket's (a short column's tooltip floated far above it). */}
          <Tooltip placement={'top'} open={open === index} disableHoverListener disableFocusListener disableTouchListener
                   disableInteractive title={<ChartTooltipContent title={row.range} rows={tooltipRows(row, index)}/>}>
            <Box component={'span'} aria-hidden sx={{
              position: 'absolute', left: '50%', bottom: height(totals[index]), width: '1px', height: '1px', pointerEvents: 'none'
            }}/>
          </Tooltip>
        </Box>)}
      </Box>
    </Box>
    <Box/>
    <Box aria-hidden sx={{ display: 'flex', pt: 0.5 }}>
      {rows.map((row, index) => <Box key={row.key} sx={{
        flex: 1, minWidth: 0, display: 'flex',
        justifyContent: endLabelInside && index === rows.length - 1 ? 'flex-end' : 'center'
      }}>
        {labelled.has(index) ? <Box component={'span'} sx={{ typography: 'caption', color: 'text.muted', whiteSpace: 'nowrap' }}>
          {row.label}
        </Box> : null}
      </Box>)}
    </Box>
  </Box>;
};

export default ColumnChart;

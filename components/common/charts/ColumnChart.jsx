import { Box, useTheme } from '@mui/material';
import Tooltip from '@components/Tooltip';
import { chartLines } from '@utility/chartTheme';
import { chartNum, labelIndexes, valueTicks } from '@utility/chartScale';
import { formatNum } from '@utility/helpers';
import { focusRing } from '../../../styles/theme/darkTheme';
import { ChartTooltipContent } from './ChartTooltip';
import useMarkFocus from './useMarkFocus';

const PLOT_HEIGHT = { xs: 180, sm: 220 };
// Up to eight buckets every label fits; past that four, the first and the last among them.
const ALL_LABELS = 8;
const FEW_LABELS = 4;

// Show a spread, or a few parts per bucket (Charts board, "Form by job"): columns in bucket order on one value
// axis, at most four ticks in text.muted on the 8% grid, the 23% edge under them. A column is at most 24 px wide,
// square at the baseline and 4 px round on top; stacked parts keep 2 px of card between them. One series labels
// its tallest column on the cap; the axis carries the rest. The hit area is the whole bucket.
// series: [{ key, label, color }]; rows: [{ key, label, range, values: { [series key]: n }, color }]. A row's own
// color is a named bucket's game color (a world), which its label names.
const ColumnChart = ({ label, series, rows }) => {
  const theme = useTheme();
  const { grid, edge } = chartLines(theme);
  const totals = rows.map((row) => series.reduce((sum, item) => sum + (row.values[item.key] ?? 0), 0));
  const { max, ticks } = valueTicks(0, Math.max(0, ...totals));
  const labelled = new Set(labelIndexes(rows.length, rows.length <= ALL_LABELS ? rows.length : FEW_LABELS));
  const peak = series.length === 1 ? totals.indexOf(Math.max(...totals)) : -1;
  const { open, markProps } = useMarkFocus(rows.length);
  const height = (value) => `${max ? (value / max) * 100 : 0}%`;
  const tooltipRows = (row, index) => (series.length === 1
    ? [{ label: series[0].label, value: formatNum(totals[index]) }]
    : [
      ...series.map((item) => ({ key: item.key, label: item.label, value: formatNum(row.values[item.key] ?? 0), color: item.color })),
      { key: 'total', label: 'Total', value: formatNum(totals[index]) }
    ]);

  return <Box sx={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', columnGap: 1, pt: 2 }}>
    <Box aria-hidden sx={{ position: 'relative', height: PLOT_HEIGHT, minWidth: 28 }}>
      {ticks.map((tick) => <Box key={tick} sx={{
        position: 'absolute', right: 0, bottom: height(tick), transform: 'translateY(50%)',
        typography: 'caption', lineHeight: 1, color: 'text.muted', fontVariantNumeric: 'tabular-nums'
      }}>{chartNum(tick)}</Box>)}
    </Box>
    <Box sx={{ position: 'relative', height: PLOT_HEIGHT, borderBottom: `1px solid ${edge}` }}>
      {ticks.filter((tick) => tick > 0).map((tick) => <Box key={tick} aria-hidden sx={{
        position: 'absolute', left: 0, right: 0, bottom: height(tick), borderTop: `1px solid ${grid}`
      }}/>)}
      <Box component={'ol'} aria-label={label} sx={{ position: 'absolute', inset: 0, m: 0, p: 0, listStyle: 'none', display: 'flex' }}>
        {rows.map((row, index) => <Tooltip
          key={row.key}
          placement={'top'}
          open={open === index}
          describeChild
          disableHoverListener
          disableFocusListener
          disableTouchListener
          disableInteractive
          title={<ChartTooltipContent title={row.range} rows={tooltipRows(row, index)}/>}
        >
          <Box component={'li'} {...markProps(index)} aria-label={`${row.range}: ${formatNum(totals[index])}`} sx={{
            flex: 1, minWidth: 0, height: '100%',
            display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: '2px',
            borderRadius: '4px',
            '&:hover .bar, &:focus-visible .bar': { filter: 'brightness(1.25)' },
            '&:focus-visible': focusRing(theme, 0)
          }}>
            {series.map((item, part) => {
              const value = row.values[item.key] ?? 0;
              if (!value) return null;
              const top = series.slice(part + 1).every((next) => !row.values[next.key]);
              return <Box key={item.key} className={'bar'} sx={{
                width: '70%', maxWidth: 24, height: height(value), flexShrink: 0,
                bgcolor: row.color ?? item.color, borderRadius: top ? '4px 4px 0 0' : 0
              }}/>;
            })}
            {index === peak ? <Box sx={{ typography: 'caption', lineHeight: '16px', fontWeight: 500, color: 'text.secondary', whiteSpace: 'nowrap' }}>
              {chartNum(totals[index])}
            </Box> : null}
          </Box>
        </Tooltip>)}
      </Box>
    </Box>
    <Box/>
    <Box aria-hidden sx={{ display: 'flex', pt: 0.5 }}>
      {rows.map((row, index) => <Box key={row.key} sx={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}>
        {labelled.has(index) ? <Box component={'span'} sx={{ typography: 'caption', color: 'text.muted', whiteSpace: 'nowrap' }}>
          {row.label}
        </Box> : null}
      </Box>)}
    </Box>
  </Box>;
};

export default ColumnChart;

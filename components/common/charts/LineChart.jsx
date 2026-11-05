import { useEffect, useRef, useState } from 'react';
import { Box, ClickAwayListener, useTheme } from '@mui/material';
import Tooltip from '@components/Tooltip';
import { chartLines } from '@utility/chartTheme';
import { chartNum, valueTicks } from '@utility/chartScale';
import { formatNum } from '@utility/helpers';
import { ChartTooltipContent } from './ChartTooltip';

// Change over time (Charts board, "Form by job", "Marks and chrome"): 2 px lines with round joins, straight between
// snapshots as the guild table's Sparkline draws them (a curve would draw values nobody recorded), at most four value
// ticks in text.muted, never rotated. series[0] is the line the chart is about: drawn last, on top, its latest value
// beside an 8 px dot ringed in the card color. Hover or a tap shows a crosshair and one tooltip with every series at
// that x. Points are not tab stops: ChartFrame's table is the keyboard's way in (Decision 9). Charts are the one place
// a tooltip opens off something that is not an i: it only repeats what the table holds.
// series: [{ id, label, color, data: [{ x, y }] }]; xDomain: { min, max } (default: the data's); axis overrides the
// value ticks; reverse puts the smallest value on top (rank #1).
const MARGIN = { top: 12, bottom: 32, left: 48 };
// The right edge keeps room for the last x label's half; the latest value's label gets more only when it would
// clip (a week still under way ends mid-plot, and the phone's plot needs the width).
const MIN_RIGHT = 24;
// About one 12 px tabular digit or comma: the value gutter widens to fit its longest tick (Decision 3).
const CHAR_WIDTH = 7;
// The room an x label needs. Labels are never rotated: a plot too narrow for all of them prints every second
// (third, ...) one, starting from the first, so the ones left stay evenly spaced.
const X_LABEL_ROOM = 40;
const round = (value) => Math.round(value * 10) / 10;

const LineChart = ({
                     label, series, xDomain, xTicks = [], formatX = String, tooltipTitle = String,
                     formatValue = formatNum, formatTick = chartNum, reverse = false, axis, height = 200
                   }) => {
  const theme = useTheme();
  const box = useRef(null);
  const popper = useRef(null);
  const [width, setWidth] = useState(0);
  const [hoverX, setHoverX] = useState(null);

  // Measured after mount, never during render, so the static export hydrates.
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);
  // The tooltip's anchor moves with the hovered point; its Popper measures it again.
  useEffect(() => {
    popper.current?.update();
  }, [hoverX, width]);

  const { grid, edge } = chartLines(theme);
  const known = series.flatMap((item) => item.data).filter((point) => point.y != null);
  const xs = [...new Set(known.map((point) => point.x))].toSorted((a, b) => a - b);
  const ys = known.map((point) => point.y);
  const { min, max, ticks } = axis ?? valueTicks(Math.min(...ys), Math.max(...ys));
  const left = Math.max(MARGIN.left, 12 + CHAR_WIDTH * Math.max(0, ...ticks.map((tick) => String(formatTick(tick)).length)));
  const xMin = xDomain?.min ?? xs[0];
  const xMax = xDomain?.max ?? xs.at(-1);
  const main = series[0];
  const last = main?.data.findLast((point) => point.y != null);
  // The dot's 10 px, the label (about one digit a character) and a little air.
  const endRoom = last ? 14 + CHAR_WIDTH * String(formatValue(last.y)).length : 0;
  const lastXAt = (right) => left + ((last.x - xMin) / (xMax - xMin || 1)) * Math.max(0, width - left - right);
  const right = last && lastXAt(MIN_RIGHT) + endRoom > width ? Math.max(MIN_RIGHT, endRoom) : MIN_RIGHT;
  const plotW = Math.max(0, width - left - right);
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const everyNth = Math.ceil(xTicks.length / (Math.floor(plotW / X_LABEL_ROOM) + 1));
  const shownXTicks = xTicks.filter((_, i) => i % everyNth === 0);
  const px =(x) => round(left + ((x - xMin) / (xMax - xMin || 1)) * plotW);
  const py = (y) => {
    const share = (y - min) / (max - min || 1);
    return round(MARGIN.top + (reverse ? share : 1 - share) * plotH);
  };
  // A missing value breaks the line instead of drawing through it.
  const pathOf = (data) => data.reduce((path, point, i) => (point.y == null ? path
    : `${path}${i === 0 || data[i - 1].y == null ? 'M' : 'L'}${px(point.x)},${py(point.y)}`), '');
  const nearest = (clientX) => {
    const x = clientX - box.current.getBoundingClientRect().left;
    return xs.reduce((best, value) => (Math.abs(px(value) - x) < Math.abs(px(best) - x) ? value : best), xs[0]);
  };
  const atHover = hoverX == null ? [] : series
    .map((item) => ({ item, point: item.data.find((point) => point.x === hoverX && point.y != null) }))
    .filter(({ point }) => point);
  const text12 = (fill) => ({ fill, fontSize: 12, fontFamily: theme.typography.fontFamily });
  const tickText = text12(theme.palette.text.muted);

  return <ClickAwayListener onClickAway={() => setHoverX(null)}>
    <Box ref={box} sx={{ position: 'relative', height }}>
      {width > 0 ? <svg width={width} height={height} role={'img'} aria-label={label} style={{ display: 'block' }}>
        {ticks.map((tick) => <g key={tick}>
          <line x1={left} x2={left + plotW} y1={py(tick)} y2={py(tick)} stroke={grid}/>
          <text x={left - 8} y={py(tick)} textAnchor={'end'} dominantBaseline={'central'} style={tickText}>
            {formatTick(tick)}
          </text>
        </g>)}
        <line x1={left} x2={left + plotW} y1={MARGIN.top + plotH} y2={MARGIN.top + plotH} stroke={edge}/>
        {shownXTicks.map((x) => <text key={x} x={px(x)} y={height - 8} textAnchor={'middle'} style={tickText}>{formatX(x)}</text>)}
        {hoverX != null ? <line x1={px(hoverX)} x2={px(hoverX)} y1={MARGIN.top} y2={MARGIN.top + plotH} stroke={edge}/> : null}
        {series.toReversed().map((item) => <path key={item.id} d={pathOf(item.data)} fill={'none'} stroke={item.color}
                                                 strokeWidth={2} strokeLinejoin={'round'} strokeLinecap={'round'}/>)}
        {atHover.map(({ item, point }) => <circle key={item.id} cx={px(point.x)} cy={py(point.y)} r={3} fill={item.color}/>)}
        {last ? <g transform={`translate(${px(last.x)}, ${py(last.y)})`}>
          {/* A plate in the card color from the dot past the label: a line that runs behind it (last week's) stops short
              of the digits, where a stroke of it between the dot and the label read as a minus sign. */}
          <rect x={5} y={-9} width={endRoom - 5} height={18} fill={theme.palette.background.paper}/>
          <circle r={4} fill={main.color} stroke={theme.palette.background.paper} strokeWidth={2}/>
          <text x={10} dominantBaseline={'central'} style={{ ...text12(theme.palette.text.secondary), fontWeight: 500 }}>
            {formatValue(last.y)}
          </text>
        </g> : null}
        {/* The hit area: a mouse hovers, a tap pins until a tap elsewhere (ClickAwayListener). A scroll that starts on
            the plot cancels the pointer, which lets the tooltip and the crosshair go. */}
        <rect x={left} y={MARGIN.top} width={plotW} height={plotH} fill={'transparent'}
              onPointerMove={(event) => setHoverX(nearest(event.clientX))}
              onPointerDown={(event) => setHoverX(nearest(event.clientX))}
              onPointerLeave={(event) => {
                if (event.pointerType === 'mouse') setHoverX(null);
              }}
              onPointerCancel={() => setHoverX(null)}/>
      </svg> : null}
      <Tooltip open={atHover.length > 0} placement={'top'} disableHoverListener disableFocusListener disableTouchListener
               disableInteractive PopperProps={{ popperRef: popper }}
               title={<ChartTooltipContent
                 title={hoverX == null ? null : tooltipTitle(hoverX)}
                 rows={atHover.map(({ item, point }) => ({
                   key: item.id, label: item.label, value: formatValue(point.y), color: item.color
                 }))}/>}>
        <Box component={'span'} aria-hidden sx={{
          position: 'absolute', width: '1px', height: '1px', pointerEvents: 'none',
          left: hoverX == null ? 0 : px(hoverX),
          top: atHover.length ? Math.min(...atHover.map(({ point }) => py(point.y))) : 0
        }}/>
      </Tooltip>
    </Box>
  </ClickAwayListener>;
};

export default LineChart;

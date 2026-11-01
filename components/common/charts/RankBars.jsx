import { Box, useTheme } from '@mui/material';
import Tooltip from '@components/Tooltip';
import { chartLines, seriesColors } from '@utility/chartTheme';
import { focusRing } from '../../../styles/theme/darkTheme';
import { ChartTooltipContent } from './ChartTooltip';
import useMarkFocus from './useMarkFocus';

// The room the tip value keeps past the longest bar.
const TIP_ROOM = 64;

// Rank a list, or a share past six parts (Charts board, "Form by job"; a donut is for six parts or fewer, and no
// chart has that few today): sorted bars in one color (slot 1, an Other row in grey), the value at the tip and no
// axis. 18 px bars about 10 px apart, square where they start on the 23% edge and 4 px round at the end; the
// hovered row lightens. From sm the names share one column, so every bar starts at the same x; on a phone each
// name sits above its bar. rows: [{ key, name, tag, value, tip, detail, other }], sorted and folded by the
// caller; tip is the short value at the bar's end, detail the exact one in the tooltip. A bar is at least 2 px,
// so a row far below the first still shows a mark (Decision 4).
const RankBars = ({ label, rows }) => {
  const theme = useTheme();
  const color = seriesColors(theme.palette.mode)[0];
  const { edge } = chartLines(theme);
  const max = Math.max(0, ...rows.map((row) => row.value));
  const { open, markProps } = useMarkFocus(rows.length);

  return <Box component={'ol'} aria-label={label} sx={{
    m: 0, p: 0, listStyle: 'none', display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'fit-content(40%) minmax(0, 1fr)' }
  }}>
    {rows.map((row, index) => <Tooltip
      key={row.key}
      placement={'top'}
      open={open === index}
      describeChild
      disableHoverListener
      disableFocusListener
      disableTouchListener
      disableInteractive
      title={<ChartTooltipContent rows={[{ label: row.name, value: row.detail }]}/>}
    >
      <Box component={'li'} {...markProps(index)} sx={{
        display: 'grid',
        gridColumn: '1 / -1',
        gridTemplateColumns: { xs: '1fr', sm: 'subgrid' },
        alignItems: 'center',
        columnGap: 1.5,
        rowGap: 0.25,
        py: '5px',
        borderRadius: '4px',
        '&:hover .bar, &:focus-visible .bar': { filter: 'brightness(1.25)' },
        '&:focus-visible': focusRing(theme, 0)
      }}>
        <Box sx={{ typography: 'body2', color: 'text.secondary', minWidth: 0, overflowWrap: 'anywhere' }}>
          {row.name}
          {row.tag ? <Box component={'span'} sx={{ typography: 'caption', color: 'text.muted', ml: 0.75 }}>{row.tag}</Box> : null}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, borderLeft: `1px solid ${edge}` }}>
          <Box className={'bar'} sx={{
            height: 18,
            minWidth: 2,
            flexShrink: 0,
            width: `calc((100% - ${TIP_ROOM}px) * ${max ? row.value / max : 0})`,
            bgcolor: row.other ? 'text.muted' : color,
            borderRadius: '0 4px 4px 0'
          }}/>
          <Box sx={{ typography: 'caption', fontWeight: 500, color: 'text.secondary', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {row.tip}
          </Box>
        </Box>
      </Box>
    </Tooltip>)}
  </Box>;
};

export default RankBars;

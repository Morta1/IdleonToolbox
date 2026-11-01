import { Box, Stack } from '@mui/material';

// A chart's tooltip (Charts board, "Hover and the table"; Overlays board, "Tooltips"): an optional title in
// text.secondary, then a row per value: the series key, its name in text.secondary, the value in text.primary.
// Charts are the one place a tooltip opens off something that is not an i, because it only repeats what the
// chart's table holds.
export const ChartTooltipContent = ({ title, rows = [] }) => <Box sx={{ fontSize: 12, lineHeight: '18px', minWidth: 120 }}>
  {title ? <Box sx={{ color: 'text.secondary' }}>{title}</Box> : null}
  {rows.map(({ key, label, value, color }) => <Stack key={key ?? label} direction={'row'} alignItems={'center'} gap={0.75}>
    {color ? <Box component={'span'} aria-hidden sx={{ width: 10, height: 2, borderRadius: '1px', bgcolor: color, flexShrink: 0 }}/> : null}
    <Box component={'span'} sx={{ color: 'text.secondary', mr: 'auto' }}>{label}</Box>
    <Box component={'span'} sx={{ color: 'text.primary', fontWeight: 500, fontVariantNumeric: 'tabular-nums', pl: 1.5 }}>{value}</Box>
  </Stack>)}
</Box>;

// Every chart puts this inside the project Tooltip (@components/Tooltip), which draws the Overlays surface.

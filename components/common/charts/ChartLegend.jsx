import { Box, Stack, Typography } from '@mui/material';

// A legend for two or more series (Charts board): the key mirrors the mark (a square for bars, a short line for
// lines) and carries the color; the label stays in text.secondary.
const ChartLegend = ({ items }) => <Stack component={'ul'} direction={'row'} flexWrap={'wrap'} columnGap={2} rowGap={0.5}
                                         sx={{ m: 0, p: 0, listStyle: 'none' }}>
  {items.map(({ label, color, mark = 'rect' }) => <Stack component={'li'} key={label} direction={'row'} alignItems={'center'} gap={0.75}>
    <Box component={'span'} aria-hidden sx={mark === 'line'
      ? { width: 12, height: 2, borderRadius: '1px', bgcolor: color }
      : { width: 10, height: 10, borderRadius: '2px', bgcolor: color }}/>
    <Typography variant={'caption'} color={'text.secondary'} sx={{ fontWeight: 500 }}>{label}</Typography>
  </Stack>)}
</Stack>;

export default ChartLegend;

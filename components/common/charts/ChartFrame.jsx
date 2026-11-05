import { useId, useRef, useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import DataTable from '@components/common/DataTable';
import { SCROLL_TARGET_MARGIN } from '@hooks/usePageTop';
import ChartLegend from './ChartLegend';

// Every chart has a table twin (Charts board, rule "A table behind every chart"): the same rows through
// DataTable, so no value waits on a hover. The host draws the title and the unit; this draws the legend (two or
// more series), the chart or its table, and the switch. table: DataTable's props. In a host that hands it spare height
// (a Panel as tall as its neighbour on Statistics) the chart keeps its height and the switch closes the panel.
const ChartFrame = ({ legend, table, children }) => {
  const [asTable, setAsTable] = useState(false);
  const frame = useRef(null);
  const bodyId = useId();
  const toggle = () => {
    setAsTable(!asTable);
    if (!asTable) return;
    // "Show as chart" sits under a long table: once the short chart is back, the player may be far below it.
    requestAnimationFrame(() => {
      if (frame.current && frame.current.getBoundingClientRect().top < 0) frame.current.scrollIntoView({ block: 'nearest' });
    });
  };
  return <Stack ref={frame} gap={1.5} sx={{ flexGrow: 1, scrollMarginTop: `${SCROLL_TARGET_MARGIN}px` }}>
    {!asTable && legend?.length > 1 ? <ChartLegend items={legend}/> : null}
    <Box id={bodyId} sx={{ flexGrow: 1 }}>{asTable ? <DataTable {...table}/> : children}</Box>
    <Stack direction={'row'} justifyContent={'flex-end'} sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
      <Button size={'small'} aria-controls={bodyId} onClick={toggle} sx={{ fontSize: 13 }}>
        {asTable ? 'Show as chart' : 'Show as table'}
      </Button>
    </Stack>
  </Stack>;
};

export default ChartFrame;

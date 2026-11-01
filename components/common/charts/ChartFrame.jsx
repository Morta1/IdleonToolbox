import { useId, useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import DataTable from '@components/common/DataTable';
import ChartLegend from './ChartLegend';

// Every chart has a table twin (Charts board, rule "A table behind every chart"): the same rows through
// DataTable, so no value waits on a hover. The host draws the title and the unit; this draws the legend (two or
// more series), the chart or its table, and the switch. table: DataTable's props.
const ChartFrame = ({ legend, table, children }) => {
  const [asTable, setAsTable] = useState(false);
  const bodyId = useId();
  return <Stack gap={1.5}>
    {!asTable && legend?.length > 1 ? <ChartLegend items={legend}/> : null}
    <Box id={bodyId}>{asTable ? <DataTable {...table}/> : children}</Box>
    <Box>
      <Button size={'small'} aria-controls={bodyId} onClick={() => setAsTable(!asTable)}>
        {asTable ? 'Show as chart' : 'Show as table'}
      </Button>
    </Box>
  </Stack>;
};

export default ChartFrame;

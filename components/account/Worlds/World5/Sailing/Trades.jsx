import { Card, CardContent, Stack } from '@mui/material';
import React from 'react';
import Trade from './Trade';

const Trades = ({ trades }) => {
  return <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
    {trades?.map((trade, index) => {
      const { rawName } = trade;
      return <Card key={rawName + index} sx={{ width: 250 }}>
        <CardContent>
          <Trade {...trade}/>
        </CardContent>
      </Card>
    })}
  </Stack>
};

export default Trades;

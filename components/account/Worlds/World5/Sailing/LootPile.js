import React from 'react';
import { Card, CardContent, Stack, Typography } from "@mui/material";
import { kFormatter, prefix } from "../../../../../utility/helpers";

const LootPile = ({ lootPile }) => {
  return <Stack gap={2} direction={'row'} flexWrap={'wrap'}>
    {lootPile?.map(({ rawName, amount }) => {
      return <Card key={rawName}>
        <CardContent>
          <Stack direction={'row'} gap={1} sx={{ width: 100 }}>
            <img src={`${prefix}data/${rawName}.png`} alt=""/>
            <Typography>{kFormatter(amount)}</Typography>
          </Stack>
        </CardContent>
      </Card>
    })}
  </Stack>
};

export default LootPile;

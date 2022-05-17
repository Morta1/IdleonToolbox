import React from 'react';
import styled from "@emotion/styled";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import ItemDisplay from "../common/ItemDisplay";
import { prefix } from "utility/helpers";
import Tooltip from "../Tooltip";

const Equipment = ({ equipment, tools, food }) => {
  return <Stack>
    <Typography variant={'h5'}>Equipment</Typography>
    <Stack mt={2} direction={'row'} gap={1} flexWrap={'wrap'} justifyContent={'center'}>
      <EquipmentPage items={equipment}/>
      <EquipmentPage items={tools}/>
      <EquipmentPage items={food}/>
    </Stack>
  </Stack>
};

const EquipmentPage = ({ items }) => {
  return <Box
    sx={{
      display: 'grid',
      justifyContent: 'center',
      gridTemplateColumns: 'repeat(2, 60px)',
    }}>
    {items.map((item, itemIndex) => {
      const { rawName, displayName, amount } = item;
      return displayName && displayName !== 'ERROR' ?
        <Card sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              variant={'outlined'} key={`${rawName}-${itemIndex}`}>
          <CardContent sx={{ '&:last-child': { padding: 0 } }}>
            <Stack alignItems={'center'} justifyContent={'center'}>
              <Tooltip title={<ItemDisplay {...item}/>}>
                <ItemIcon src={`${prefix}data/${rawName}.png`}/>
              </Tooltip>
              {amount}
            </Stack>
          </CardContent>
        </Card> : null;
    })}
  </Box>
}

const ItemIcon = styled.img`
  width: 50px;
  height: 50px;
  object-fit: contain;
`
export default Equipment;

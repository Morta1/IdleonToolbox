import React from 'react';
import styled from '@emotion/styled';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import ItemDisplay from '../common/ItemDisplay';
import { notateNumber, prefix } from 'utility/helpers';
import Tooltip from '../Tooltip';

const Equipment = ({ equipment, tools, food, account, character }) => {
  return <Stack>
    <Typography variant={'h5'}>Equipment</Typography>
    <Stack mt={2} direction={'row'} gap={1} flexWrap={'wrap'} justifyContent={'center'}>
      <EquipmentPage items={equipment?.slice(0, 8)} character={character} account={account}/>
      <EquipmentPage items={equipment?.slice(8)} character={character} account={account}/>
      <EquipmentPage items={tools} character={character} account={account}/>
      <EquipmentPage items={food} character={character} account={account}/>
    </Stack>
  </Stack>
};

const EquipmentPage = ({ items, character, account }) => {
  return <Box
    sx={{
      display: 'grid',
      justifyContent: 'center',
      gridTemplateColumns: 'repeat(2, 60px)'
    }}>
    {items?.map((item, itemIndex) => {
      const { rawName, displayName, amount } = item;
      return itemIndex < 8 ?
        <Card sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 76 }}
              variant={'outlined'} key={`${rawName}-${itemIndex}`}>
          <CardContent sx={{ '&:last-child': { padding: 0 } }}>
            <Stack alignItems={'center'} justifyContent={'center'}>
            <Tooltip
              title={displayName && displayName !== 'ERROR' ? <ItemDisplay {...item} character={character}
                                                                           account={account}/> : ''}>
              <ItemIcon src={`${prefix}data/${rawName}.png`} alt={rawName}/>
            </Tooltip>
            {displayName !== 'ERROR' && rawName !== 'Blank' ? amount >= 1e5 ? notateNumber(amount) : amount : ' '}
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

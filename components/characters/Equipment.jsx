import React from 'react';
import styled from '@emotion/styled';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import ItemDisplay from '../common/ItemDisplay';
import { prefix } from 'utility/helpers';
import Tooltip from '../Tooltip';

const Equipment = ({ equipment, tools, food, account, character }) => {
  return <Stack>
    <Typography variant={'h5'}>Equipment</Typography>
    <Stack mt={2} direction={'row'} gap={1} flexWrap={'wrap'} justifyContent={'center'}>
      <EquipmentPage items={equipment?.slice(0, 8)} character={character} account={account} blank={0}/>
      <EquipmentPage items={equipment?.slice(8)} character={character} account={account} blank={100}/>
      <EquipmentPage items={tools} character={character} account={account} blank={8}/>
      <EquipmentPage items={food} character={character} account={account} blank={17}/>
    </Stack>
  </Stack>
};

const EquipmentPage = ({ items, character, account, blank }) => {
  return <Box
    sx={{
      display: 'grid',
      justifyContent: 'center',
      gridTemplateColumns: 'repeat(2, 60px)',
    }}>
    {items?.map((item, itemIndex) => {
      const { rawName, displayName, amount } = item;
      var name = rawName;
      if(blank == 17)
      {
        name = rawName == 'Blank' ? 'EquipmentTransparent' + 17 : rawName;
      }
      else
      {
        name = rawName == 'Blank' ? 'EquipmentTransparent' + (blank + itemIndex + 1) : rawName;
      }
      return itemIndex < 8 ?
        <Card sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 76 }}
              variant={'outlined'} key={`${rawName}-${itemIndex}`}>
          <CardContent sx={{ '&:last-child': { padding: 0 } }}>
            <Stack alignItems={'center'} justifyContent={'center'}>
              <Tooltip
                title={displayName && displayName !== 'ERROR' ? <ItemDisplay {...item} character={character}
                                                                             account={account}/> : ''}>
                <ItemIcon src={`${prefix}data/${name}.png`} alt={name}/>
              </Tooltip>
              {displayName !== 'ERROR' ? amount : ' '}
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

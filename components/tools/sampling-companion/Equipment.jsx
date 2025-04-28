import React from 'react';
import styled from '@emotion/styled';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import ItemDisplay from '../../common/ItemDisplay';
import { prefix } from 'utility/helpers';
import Tooltip from '../../Tooltip';
import { talentPagesMap } from '@parsers/talents';
import { items as itemsList } from '../../../data/website-data';

const Equipment = ({ equipment, tools, food, account, character, weaponByClass, hideEmpty }) => {
  return <Stack>
    <Typography variant={'h5'}>Equipment</Typography>
    <Stack mt={2} direction={'row'} gap={1} flexWrap={'wrap'} justifyContent={'center'}>
      <EquipmentPage weaponByClass={weaponByClass} windowName={'equipment'} hideEmpty={hideEmpty}
                     items={equipment?.slice(0, 8)} character={character}
                     account={account}/>
      <EquipmentPage windowName={'equipment'} hideEmpty={hideEmpty} items={equipment?.slice(8)} character={character}
                     account={account}/>
      <EquipmentPage windowName={'tools'} hideEmpty={hideEmpty} items={tools} character={character} account={account}/>
      <EquipmentPage windowName={'food'} hideEmpty={hideEmpty} items={food} character={character} account={account}/>
    </Stack>
  </Stack>
};

const EquipmentPage = ({ items, character, account, hideEmpty, windowName, weaponByClass }) => {
  const classes = ['Warrior', 'Mage', 'Archer'];
  const baseClass = classes.find(cls => talentPagesMap?.[character?.class]?.includes(cls)) || 'Beginner';
  const actualItem = itemsList?.[weaponByClass?.[baseClass]];

  return (
    <Box
      sx={{
        display: 'grid',
        justifyContent: 'center',
        gridTemplateColumns: 'repeat(2, 60px)',
      }}
    >
      {items?.slice(0, 8).map((item, itemIndex) => {
        const { rawName, displayName, amount } = (itemIndex === 1 && actualItem ? actualItem : item) || {};
        if (hideEmpty && rawName === 'Blank') return null;

        const isEquipped = character?.[windowName]?.some(({ rawName: rName }) => rName === rawName);

        return (
          <Card
            key={`${rawName}-${itemIndex}`}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 76,
            }}
            variant="outlined"
          >
            <CardContent sx={{ '&:last-child': { padding: 0 } }}>
              <Stack alignItems="center" justifyContent="center" sx={{ opacity: isEquipped ? 1 : 0.5 }}>
                <Tooltip
                  title={
                    displayName && displayName !== 'ERROR'
                      ? <ItemDisplay {...item} character={character} account={account} />
                      : ''
                  }
                >
                  <ItemIcon src={`${prefix}data/${rawName}.png`} alt={rawName} />
                </Tooltip>
                {displayName !== 'ERROR' && rawName !== 'Blank' ? amount : ' '}
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

const ItemIcon = styled.img`
  width: 50px;
  height: 50px;
  object-fit: contain;
`
export default Equipment;

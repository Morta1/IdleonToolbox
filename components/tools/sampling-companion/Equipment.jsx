import React from 'react';
import styled from '@emotion/styled';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import ItemDisplay from '../../common/ItemDisplay';
import { prefix } from 'utility/helpers';
import Tooltip from '../../Tooltip';
import { CLASSES, talentPagesMap } from '@parsers/talents';
import { items as itemsList } from '../../../data/website-data';

const Equipment = ({ equipment, tools, food, account, character, weaponByClass, hideEmpty, allAccountItems }) => {
  return <Stack>
    <Typography variant={'h5'}>Equipment</Typography>
    <Stack mt={2} direction={'row'} gap={1} flexWrap={'wrap'} justifyContent={'center'}>
      <EquipmentPage allAccountItems={allAccountItems} weaponByClass={weaponByClass} windowName={'equipment'}
                     hideEmpty={hideEmpty}
                     items={equipment?.slice(0, 8)} character={character}
                     account={account}/>
      <EquipmentPage allAccountItems={allAccountItems} windowName={'equipment'} hideEmpty={hideEmpty}
                     items={equipment?.slice(8)} character={character}
                     account={account}/>
      <EquipmentPage allAccountItems={allAccountItems} windowName={'tools'} hideEmpty={hideEmpty} items={tools}
                     character={character} account={account}/>
      <EquipmentPage allAccountItems={allAccountItems} windowName={'food'} hideEmpty={hideEmpty} items={food}
                     character={character} account={account}/>
    </Stack>
  </Stack>
};

const EquipmentPage = ({ allAccountItems, items, character, account, hideEmpty, windowName, weaponByClass }) => {
  const classes = [CLASSES.Warrior, CLASSES.Mage, CLASSES.Archer];
  const baseClass = classes.find(cls => talentPagesMap?.[character?.class]?.includes(cls)) || CLASSES.Beginner;
  const actualItem = itemsList?.[weaponByClass?.[baseClass]];

  return (
    <Box
      sx={{
        display: 'grid',
        justifyContent: 'center',
        gridTemplateColumns: 'repeat(2, 60px)'
      }}
    >
      {items?.slice(0, 8).map((item, itemIndex) => {
        const { rawName, displayName, amount } = (itemIndex === 1 && actualItem ? actualItem : item) || {};
        if (hideEmpty && rawName === 'Blank') return null;

        const isEquipped = character?.[windowName]?.some(({ rawName: rName }) => rName === rawName);
        let owners
        if (!isEquipped) {
          owners = allAccountItems.filter(({ rawName: rName }) => rName === rawName).map(({ owner }) => owner);
        }

        return (
          <Card
            key={`${rawName}-${itemIndex}`}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 76
            }}
            variant="outlined"
          >
            <CardContent sx={{ '&:last-child': { padding: 0 } }}>
              <Stack alignItems="center" justifyContent="center" sx={{ opacity: isEquipped ? 1 : 0.5 }}>
                <Tooltip
                  title={
                    displayName && displayName !== 'ERROR'
                      ? <ItemDisplay {...actualItem} character={character} account={account} owners={owners}/>
                      : ''
                  }
                >
                  <ItemIcon src={`${prefix}data/${rawName}.png`} alt={rawName}/>
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

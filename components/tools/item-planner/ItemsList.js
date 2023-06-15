import React, { useMemo } from 'react';
import { cleanUnderscore, notateNumber, numberWithCommas, pascalCase, prefix } from 'utility/helpers';
import { findQuantityOwned, flattenCraftObject } from 'parsers/items';
import styled from '@emotion/styled';
import Tooltip from 'components/Tooltip';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { crafts } from '../../../data/website-data';

const ItemsList = ({
                     account,
                     inventoryItems,
                     itemsList = [],
                     copies = 1,
                     itemDisplay
                   }) => {

  const mapItems = (items, itemDisplay) => {
    return items?.reduce((res, item) => {
      let quantityOwned, owner;
      if (item?.itemName === 'Dungeon_Credits_Flurbo_Edition') {
        quantityOwned = account?.dungeons?.flurbos ?? 0;
        owner = ['account'];
      } else {
        const res = findQuantityOwned(inventoryItems, item?.itemName);
        quantityOwned = res?.amount;
        owner = res?.owner;
      }
      if (itemDisplay === '0') {
        const remaining = item?.itemQuantity - quantityOwned;
        if (item?.type === 'Equip' && remaining !== item?.itemQuantity) {
          const removableItems = flattenCraftObject(crafts[item?.itemName])?.map((i) => {
            const { amount: quantityOwned, owner } = findQuantityOwned(inventoryItems, i?.itemName);
            return {
              ...i,
              baseQuantity: i?.itemQuantity,
              itemQuantity: i?.itemQuantity * remaining,
              quantityOwned,
              owner
            }
          });
          removableItems.forEach((removableItem) => {
            const existingItem = res?.[removableItem?.subType]?.find((i) => i?.itemName === removableItem?.itemName);
            let allItems = res?.[removableItem?.subType]?.filter((i) => i?.itemName !== removableItem?.itemName);
            if (existingItem && remaining > 0 && (existingItem?.itemQuantity - quantityOwned) > existingItem?.quantityOwned) {
              allItems = [...(allItems || []),
                { ...existingItem, itemQuantity: existingItem?.itemQuantity - quantityOwned }];
            }
            res = {
              ...res,
              [removableItem?.subType]: allItems
            }
          })
          if (remaining > 0) {
            res = {
              ...res,
              [item?.subType]: [
                ...(res?.[item?.subType] || []),
                { ...item, quantityOwned: 0, owner, itemQuantity: remaining }
              ]
            }
          }
          return res;
        } else {
          if (quantityOwned >= item?.itemQuantity) {
            return res;
          }
          return {
            ...res,
            [item?.subType]: [
              ...(res?.[item?.subType] || []),
              { ...item, owner, quantityOwned }
            ]
          };
        }
      }
      if (itemDisplay !== '1') return res;
      return {
        ...res,
        [item?.subType]: [...(res?.[item?.subType] || []), { ...item, quantityOwned, owner }]
      };
    }, {});
  };

  const categorize = useMemo(() => mapItems(itemsList, itemDisplay), [itemsList, itemDisplay, inventoryItems, account]);

  return (
    <Stack flexWrap={'wrap'} direction={'row'} gap={4}>
      {Object.entries(categorize)?.map(([categoryName, items], index) => {
        const anythingToShow = itemDisplay === '0' ? items?.length > 0 : true;
        return anythingToShow ? <Card key={categoryName + '' + index} variant={'outlined'}>
          <CardContent>
            <span className={'title'}>{cleanUnderscore(pascalCase(categoryName))}</span>
            <Stack flexWrap={'wrap'} direction={'row'} gap={3}>
              {items?.map(({ itemName, itemQuantity, rawName, type, quantityOwned, owner }, innerIndex) => {
                return <Stack gap={1} alignItems={'center'} key={itemName + '' + innerIndex}>
                  <Tooltip title={<OwnerTooltip itemName={itemName} owners={owner}/>}>
                    <ItemIcon
                      src={`${prefix}data/${rawName}.png`}
                      alt=''
                    />
                  </Tooltip>
                  <Stack direction={'row'}>
                    <Tooltip title={quantityOwned >= 1e3 ? numberWithCommas(quantityOwned) : ''}>
                      <Typography
                        color={quantityOwned >= (itemDisplay === '0' ? parseInt(itemQuantity) : parseInt(itemQuantity) * copies) ? "success.light" : ""}>
                        {notateNumber(quantityOwned)}
                      </Typography>
                    </Tooltip>
                    <Tooltip title={itemQuantity >= 1e3 ? numberWithCommas(itemQuantity) : ''}>
                      <Typography
                        color={quantityOwned >= (itemDisplay === '0' ? parseInt(itemQuantity) : parseInt(itemQuantity) * copies) ? "success.light" : ""}>
                        /{itemDisplay === '0' ? notateNumber(parseInt(itemQuantity)) : notateNumber(parseInt(itemQuantity) * copies, 2)}
                      </Typography>
                    </Tooltip>
                  </Stack>
                </Stack>;
              })}
            </Stack>
          </CardContent>
        </Card> : null
      })}
    </Stack>
  );
};

const ItemIcon = styled.img`
  width: 40px;
`;

const OwnerTooltip = ({ itemName, owners }) => {
  return <>
    <Typography fontWeight={'bold'} variant={'h5'}>{cleanUnderscore(itemName)}</Typography>
    <Stack>
      <Stack direction={'row'}>
        {owners?.length > 0 ? owners?.map((owner, index) => {
          return <div key={index + '' + owner}>
            <Typography>{owner}&nbsp;</Typography>
          </div>
        }) : <Typography>None</Typography>}
      </Stack>
    </Stack>
  </>
}

export default ItemsList;

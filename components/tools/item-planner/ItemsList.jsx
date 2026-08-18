import React from 'react';
import { cleanUnderscore, notateNumber, numberWithCommas, pascalCase, prefix } from 'utility/helpers';
import { findQuantityOwned, flattenCraftObject } from 'parsers/items';
import styled from '@emotion/styled';
import Tooltip from 'components/Tooltip';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { crafts } from '@website-data';

// Every copy of a craftable equip you already own is a copy you no longer have to build, so the
// materials that copy would have consumed drop out of the requirement. Credits are keyed by item
// name and gathered up front so the result doesn't depend on where the equip sits in the list.
//
// Equips on one upgrade chain are walked outermost-first, because an owned outer equip already
// accounts for every tier below it: crediting an inner one again would double-count the materials
// they share and hide a row that is still short. An ancestor's flattened recipe is a superset of
// its descendants', so recipe size orders the chain; unrelated chains never overlap.
export const getOwnedEquipCredits = (itemsList, inventoryItems) => {
  const equips = (itemsList ?? [])
    .filter((item) => item?.type === 'Equip')
    .map((item) => ({ item, recipe: flattenCraftObject(crafts[item?.itemName]) ?? [] }))
    .sort((a, b) => b.recipe.length - a.recipe.length);

  return equips.reduce((credits, { item, recipe }) => {
    const { amount } = findQuantityOwned(inventoryItems, item?.itemName);
    const stillToBuild = Math.max(0, (item?.itemQuantity ?? 0) - (credits[item?.itemName] ?? 0));
    const covered = Math.min(amount ?? 0, stillToBuild);
    if (covered <= 0) return credits;
    recipe.forEach(({ itemName, itemQuantity }) => {
      credits[itemName] = (credits[itemName] ?? 0) + (itemQuantity ?? 0) * covered;
    });
    return credits;
  }, {});
};

export const mapItems = (items, itemDisplay, inventoryItems, account) => {
  const equipCredits = itemDisplay === '0' ? getOwnedEquipCredits(items, inventoryItems) : {};
  return (items ?? []).reduce((res, item) => {
    let quantityOwned, owner;
    if (item?.itemName === 'Dungeon_Credits_Flurbo_Edition') {
      quantityOwned = account?.dungeons?.flurbos ?? 0;
      owner = ['account'];
    } else {
      const found = findQuantityOwned(inventoryItems, item?.itemName);
      quantityOwned = found?.amount;
      owner = found?.owner;
    }
    if (itemDisplay === '0') {
      const required = Math.max(0, (item?.itemQuantity ?? 0) - (equipCredits?.[item?.itemName] ?? 0));
      if (required <= 0 || quantityOwned >= required) return res;
      return {
        ...res,
        [item?.subType]: [
          ...(res?.[item?.subType] || []),
          { ...item, itemQuantity: required, owner, quantityOwned }
        ]
      };
    }
    if (itemDisplay !== '1') return res;
    return {
      ...res,
      [item?.subType]: [...(res?.[item?.subType] || []), { ...item, quantityOwned, owner }]
    };
  }, {});
};

const ItemsList = ({
                     account,
                     inventoryItems,
                     itemsList = [],
                     copies = 1,
                     itemDisplay
                   }) => {

  const categorize = mapItems(itemsList, itemDisplay, inventoryItems, account);

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
                      alt=""
                    />
                  </Tooltip>
                  <Stack direction={'row'}>
                    <Tooltip title={quantityOwned >= 1e3 ? numberWithCommas(quantityOwned) : ''}>
                      <Typography
                        color={quantityOwned >= (itemDisplay === '0'
                          ? parseInt(itemQuantity)
                          : parseInt(itemQuantity) * copies) ? 'success.light' : ''}>
                        {notateNumber(quantityOwned)}
                      </Typography>
                    </Tooltip>
                    <Tooltip title={itemQuantity >= 1e3 ? numberWithCommas(itemQuantity) : ''}>
                      <Typography
                        color={quantityOwned >= (itemDisplay === '0'
                          ? parseInt(itemQuantity)
                          : parseInt(itemQuantity) * copies) ? 'success.light' : ''}>
                        /{itemDisplay === '0'
                        ? notateNumber(parseInt(itemQuantity))
                        : notateNumber(parseInt(itemQuantity) * copies, 2)}
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

import React, { useMemo } from "react";
import { cleanUnderscore, kFormatter, pascalCase, prefix } from "utility/helpers";
import { findQuantityOwned, flattenCraftObject } from "parsers/items";
import styled from "@emotion/styled";
import Tooltip from "components/Tooltip";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import { crafts } from "../../../data/website-data";

const ItemsList = ({
                     inventoryItems,
                     itemsList = [],
                     copies = 1,
                     itemDisplay
                   }) => {

  const mapItems = (items, itemDisplay) => {
    return items?.reduce((res, item) => {
      const { amount: quantityOwned, owner } = findQuantityOwned(inventoryItems, item?.itemName);
      if (itemDisplay === '0') {
        const remaining = item?.itemQuantity - quantityOwned;
        if (item?.type === 'Equip') {
          const removableItems = flattenCraftObject(crafts[item?.itemName])?.map((i) => {
            const { amount: quantityOwned, owner } = findQuantityOwned(inventoryItems, i?.itemName);
            return {
              ...i,
              itemQuantity: i?.itemQuantity * remaining,
              quantityOwned,
              owner
            }
          });
          removableItems.forEach((removableItem) => {
            let allItems = res?.[removableItem?.subType]?.filter((i) => i?.itemName !== removableItem?.itemName);
            if (removableItem?.itemQuantity > 0) {
              allItems = [...(allItems || []), removableItem];
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

  const categorize = useMemo(() => mapItems(itemsList, itemDisplay), [itemsList, itemDisplay, inventoryItems]);

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
                  <Typography
                    color={quantityOwned >= (itemDisplay === '0' ? parseInt(itemQuantity) : parseInt(itemQuantity) * copies) ? "success.light" : ""}>
                    {kFormatter(quantityOwned, 2)}/{itemDisplay === '0' ? kFormatter(parseInt(itemQuantity)) : kFormatter(parseInt(itemQuantity) * copies, 2)}
                  </Typography>
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

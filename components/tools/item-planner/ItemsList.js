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
          const test = flattenCraftObject(crafts[item?.itemName])?.map((i) => {
            const { amount: quantityOwned, owner } = findQuantityOwned(inventoryItems, i?.itemName);
            return {
              ...i,
              itemQuantity: i?.itemQuantity * remaining,
              quantityOwned,
              owner
            }
          });
          test.forEach((missingItem) => {
            let allItems = res?.[missingItem?.subType]?.filter((i) => i?.itemName !== missingItem?.itemName);
            allItems = [...(allItems || []), missingItem];
            res = {
              ...res,
              [missingItem?.subType]: allItems
            }
          })
          res = {
            ...res,
            [item?.subType]: [
              ...(res?.[item?.subType] || []),
              { ...item, quantityOwned: 0, owner, itemQuantity: remaining }
            ]
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
        return <Card key={categoryName + '' + index} variant={'outlined'}>
          <CardContent>
            <span className={'title'}>{cleanUnderscore(pascalCase(categoryName))}</span>
            <Stack flexWrap={'wrap'} direction={'row'} gap={3}>
              {items?.map(({ itemName, itemQuantity, rawName, type, quantityOwned, owner }, innerIndex) => {
                // if (itemDisplay !== '1' && quantityOwned >= itemQuantity) return null;
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
        </Card>
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

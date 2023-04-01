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
                     showFinishedItems = true,

                   }) => {

  const mapItems = (items, showFinishedItems) => {
    // const test = items?.reduce((res, item) => {
    //   const { amount: quantityOwned, owner } = findQuantityOwned(inventoryItems, item?.itemName);
    //   let allMaterials = flattenCraftObject(crafts?.[item?.itemName]);
    //   if (allMaterials?.length > 0) {
    //     allMaterials = allMaterials?.map((item) => {
    //       const { amount: quantityOwned, owner } = findQuantityOwned(inventoryItems, item?.itemName);
    //       return { ...item, quantityOwned, owner }
    //     })
    //   }
    //   return [
    //     ...res,
    //     { ...item, quantityOwned, owner, allMaterials }
    //   ];
    // }, []);
    return items?.reduce((res, item) => {
      const { amount: quantityOwned, owner } = findQuantityOwned(inventoryItems, item?.itemName);
      let finishedItems = {};
      if (item?.type === 'Equip' && quantityOwned > 0) {
        const finishedMats = crafts[item?.itemName]?.materials;
        if (finishedMats) {
          finishedItems = finishedMats?.reduce((res, item) => {
            return [...res, item, ...flattenCraftObject(item)];
          }, []);
        } else {
          finishedItems = [item];
        }
      }
      console.log(`##### ${item?.itemName} ####`, finishedItems);
      if (!showFinishedItems && finishedItems?.length > 0) {
        console.log(`Need ${item?.itemQuantity - quantityOwned} more`);
        const remaining = item?.itemQuantity - quantityOwned;
        const test = flattenCraftObject(crafts[item?.itemName])?.map((i) => ({
          ...i,
          itemQuantity: remaining * i?.itemQuantity
        }));
        console.log('Remaining:', test);
        return finishedItems?.reduce((resp, finishedItem) => {
          const { subType, itemName, itemQuantity } = finishedItem;
          const realItem = res?.[subType]?.find((i) => i?.itemName === itemName);
          const { amount: itemQuantityOwned, owner } = findQuantityOwned(inventoryItems, realItem?.itemName);
          console.log(itemName, itemQuantity, itemQuantityOwned)
          if (realItem) {
            let finalQuantity;
            if (copies > 1) {
              finalQuantity = itemQuantityOwned - itemQuantity;
              if (finalQuantity > 0) {
                resp = {
                  ...resp, [subType]: [
                    ...resp?.subType,
                    { ...finishedItem, itemQuantity: finalQuantity, quantityOwned: itemQuantityOwned, owner }
                  ]
                }
              }
            } else {
              const updatedList = resp?.[subType]?.filter((i) => i?.itemName !== itemName);
              if (!updatedList || updatedList?.length === 0) {
                delete resp?.[subType];
                return resp;
              }
              return { ...resp, [subType]: updatedList };
            }
          }
          return resp;
        }, res);
      }
      if (!showFinishedItems && quantityOwned >= item?.itemQuantity) return res;
      return {
        ...res,
        [item?.subType]: [...(res?.[item?.subType] || []), { ...item, quantityOwned, owner }]
      };
    }, {});
  };

  const categorize = useMemo(() => mapItems(itemsList, showFinishedItems), [itemsList, showFinishedItems,
    inventoryItems]);

  return (
    <Stack flexWrap={'wrap'} direction={'row'} gap={4}>
      {Object.entries(categorize)?.map(([categoryName, items], index) => {
        return <Card key={categoryName + '' + index}>
          <CardContent>
            <span className={'title'}>{cleanUnderscore(pascalCase(categoryName))}</span>
            <Stack flexWrap={'wrap'} direction={'row'} gap={3}>
              {items?.map(({ itemName, itemQuantity, rawName, type }, innerIndex) => {
                // if (!showEquips && type === 'Equip') return null;
                const { amount: quantityOwned, owner } = findQuantityOwned(inventoryItems, itemName);
                if (!showFinishedItems && quantityOwned >= itemQuantity) return null;
                return <Stack gap={1} alignItems={'center'} key={itemName + '' + innerIndex}>
                  <Tooltip title={<OwnerTooltip itemName={itemName} owners={owner}/>}>
                    <ItemIcon
                      src={`${prefix}data/${rawName}.png`}
                      alt=''
                    />
                  </Tooltip>
                  <Typography color={quantityOwned >= (parseInt(itemQuantity) * copies) ? "success.light" : ""}>
                    {kFormatter(quantityOwned, 2)}/{kFormatter(parseInt(itemQuantity) * copies, 2)}
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

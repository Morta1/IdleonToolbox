import React, { useMemo } from "react";
import { cleanUnderscore, kFormatter, pascalCase, prefix } from "utility/helpers";
import { findQuantityOwned } from "parsers/items";
import styled from "@emotion/styled";
import Tooltip from "components/Tooltip";
import { Card, CardContent, Stack, Typography } from "@mui/material";

const ItemsList = ({
                     inventoryItems,
                     itemsList = [],
                     copies = 1,
                     showEquips = true,
                     showFinishedItems = true
                   }) => {

  const mapItems = (items, showEquips, showFinishedItems) => {
    return items?.reduce((res, item) => {
      if (!showEquips && item?.type === 'Equip') return res;
      const { amount: quantityOwned, owner } = findQuantityOwned(inventoryItems, item?.itemName);
      if (!showFinishedItems && quantityOwned >= item?.itemQuantity) return res;
      return {
        ...res,
        [item?.subType]: [...(res?.[item?.subType] || []), { ...item, quantityOwned, owner }]
      };
    }, {})
  };

  const categorize = useMemo(() => mapItems(itemsList, showEquips, showFinishedItems), [itemsList, showEquips, showFinishedItems]);

  return (
    <Stack flexWrap={'wrap'} direction={'row'} gap={4}>
      {Object.entries(categorize)?.map(([categoryName, items], index) => {
        return <Card key={categoryName + '' + index}>
          <CardContent>
            <span className={'title'}>{cleanUnderscore(pascalCase(categoryName))}</span>
            <Stack flexWrap={'wrap'} direction={'row'} gap={3}>
              {items?.map(({ itemName, itemQuantity, rawName, type }, innerIndex) => {
                if (!showEquips && type === 'Equip') return null;
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
            <Typography>{owner}</Typography>
          </div>
        }) : <Typography>None</Typography>}
      </Stack>
    </Stack>
  </>
}

export default ItemsList;

import { cleanUnderscore, findItemInInventory, kFormatter, prefix } from "../../../Utilities";
import crafts from "../../../data/crafts.json";
import React from "react";
import styled from 'styled-components';

const RequiredItems = ({ item, materials, inventoryItems, showNestedCrafts, copies }) => {
  const { itemName, itemQuantity, rawName } = item || {};
  let quantityOwned;

  const inventoryItem = findItemInInventory(inventoryItems, item?.itemName);
  quantityOwned = Object.values(inventoryItem)?.reduce((res, { amount }) => {
    return res + amount;
  }, 0);

  return (
    <RequiredItemsStyle className={'materials'}>
      {item?.itemQuantity ? <div className='item'>
        <img
          title={cleanUnderscore(itemName)}
          src={`${prefix}data/${rawName}.png`}
          alt=''
        />
        <span className={quantityOwned >= (parseInt(itemQuantity) * copies) ? "material-value-done" : ""}>
            {kFormatter(quantityOwned, 2)}/{kFormatter(parseInt(itemQuantity) * copies, 2)}
        </span>
      </div> : null}

      {materials?.map((innerItem, index) => {
        let materials = crafts?.[innerItem?.itemName]?.materials;
        if (innerItem?.itemQuantity && materials) {
          materials = materials?.map((temp) => ({
            ...temp,
            itemQuantity: temp?.itemQuantity * innerItem?.itemQuantity
          }))
        }
        return (
          <RequiredItems
            copies={copies}
            key={innerItem?.rawName + index}
            item={innerItem}
            inventoryItems={inventoryItems}
            showNestedCrafts={showNestedCrafts}
            materials={showNestedCrafts ? materials : []}
          />
        );
      })}
    </RequiredItemsStyle>
  );
};

const RequiredItemsStyle = styled.div`
  .materials .materials {
    display: flex;
    flex-basis: 100%;
    flex-wrap: wrap;
    margin-left: 35px;
    border-left: 1px solid white;
  }

  .item {
    align-items: center;
    display: flex;
  }

  .material-value-done {
    color: #35d435;
    font-weight: bold;
    font-size: 18px;
  }
`

export default RequiredItems;

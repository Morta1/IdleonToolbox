import { cleanUnderscore, findQuantityOwned, kFormatter, prefix } from "../../../Utilities";
import React from "react";
import styled from 'styled-components';

const RequiredItems = ({
                         itemName,
                         itemQuantity,
                         rawName,
                         materials,
                         inventoryItems,
                         showNestedCrafts,
                         copies,
                         display
                       }) => {
  let quantityOwned;

  if (itemName) {
    quantityOwned = findQuantityOwned(inventoryItems, itemName);
  }

  return (
    <RequiredItemsStyle className={'materials'} display={display}>
      {itemQuantity ? <div className='item' title={rawName}>
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
        return (
          <RequiredItems
            display={display}
            copies={copies}
            key={innerItem?.rawName + index}
            {...innerItem}
            inventoryItems={inventoryItems}
            showNestedCrafts={showNestedCrafts}
            materials={showNestedCrafts ? innerItem?.materials : []}
          />
        );
      })}
    </RequiredItemsStyle>
  );
};

const RequiredItemsStyle = styled.div`
  margin-top: 15px;
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

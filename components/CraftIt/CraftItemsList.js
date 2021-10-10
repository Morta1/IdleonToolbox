import styled from 'styled-components'
import { cleanUnderscore, findQuantityOwned, kFormatter, prefix } from "../../Utilities";
import React from "react";

const CraftItemsList = ({ inventoryItems, itemsList = [], copies }) => {
  return (
    <CraftItemsListStyle>
      {itemsList?.map(({ itemName, itemQuantity, rawName }, index) => {
        const quantityOwned = findQuantityOwned(inventoryItems, itemName);
        return <div key={itemName + index} className='item' title={rawName}>
          <img
            title={cleanUnderscore(itemName)}
            src={`${prefix}data/${rawName}.png`}
            alt=''
          />
          <span className={quantityOwned >= (parseInt(itemQuantity) * copies) ? "material-value-done" : ""}>
            {kFormatter(quantityOwned, 2)}/{kFormatter(parseInt(itemQuantity) * copies, 2)}
        </span>
        </div>;
      })}
    </CraftItemsListStyle>
  );
};

const CraftItemsListStyle = styled.div`
  margin-top: 15px;

  display: grid;
  gap: 5px;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));

  .item {
    display: flex;
    align-items: center;
  }

  .material-value-done {
    color: #35d435;
    font-weight: bold;
    font-size: 18px;
  }
`;

export default CraftItemsList;

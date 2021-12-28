import styled from 'styled-components'
import { cleanUnderscore, findQuantityOwned, kFormatter, pascalCase, prefix } from "../../Utilities";
import React, { useMemo } from "react";

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
      const quantityOwned = findQuantityOwned(inventoryItems, item?.itemName);
      if (!showFinishedItems && quantityOwned >= item?.itemQuantity) return res;
      return {
        ...res,
        [item?.subType]: [...(res?.[item?.subType] || []), { ...item, quantityOwned }]
      };
    }, {})
  };

  const categorize = useMemo(() => mapItems(itemsList, showEquips, showFinishedItems), [itemsList, showEquips, showFinishedItems]);


  return (
    <ItemsListStyle>
      {Object.entries(categorize)?.map(([categoryName, items], index) => {
        return <div key={categoryName + '' + index}>
          <span className={'title'}>{cleanUnderscore(pascalCase(categoryName))}</span>
          <div className={'category-items'}>
            {items?.map(({ itemName, itemQuantity, rawName, type }, innerIndex) => {
              if (!showEquips && type === 'Equip') return null;
              const quantityOwned = findQuantityOwned(inventoryItems, itemName);
              if (!showFinishedItems && quantityOwned >= itemQuantity) return null;
              return <div key={itemName + '' + innerIndex} className='item' title={rawName}>
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
          </div>
        </div>
      })}
    </ItemsListStyle>
  );
};

const ItemsListStyle = styled.div`
  margin-top: 15px;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, auto);

  .category-items {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    max-width: 500px;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .material-value-done {
    color: #35d435;
    font-weight: bold;
    font-size: 18px;
  }

  .title {
    font-size: 20px;
    font-weight: bold;
    display: inline-block;
    margin-bottom: 10px;
  }

`;

export default ItemsList;

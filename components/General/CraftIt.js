import React, { useState, useEffect } from "react";
import styled from "styled-components";
import crafts from "../../data/crafts.json";
import { TextField, FormControlLabel, Checkbox } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { createFilterOptions } from "@material-ui/lab/Autocomplete";
import {
  cleanUnderscore,
  findItemInInventory,
  prefix,
  kFormatter,
} from "../../Utilities";

const filterOptions = createFilterOptions({
  trim: true,
});

const CraftIt = ({ userData }) => {
  const [labels] = useState(Object.keys(crafts));
  const [value, setValue] = useState("");
  const [selectedItem, setSelectedItem] = useState({});
  const [showNestedCrafts, setShowNestedCrafts] = useState(false);
  const [myItems, setMyItems] = useState();
  const [copies, setCopies] = useState(1);

  useEffect(() => {
    const charItems = userData?.characters.reduce(
      (res, { inventory }) => [...res, ...inventory],
      []
    );
    const totalItems = [...charItems, ...userData?.account?.inventory];
    setMyItems(totalItems);
  }, []);

  return (
    <CraftItStyled>
      <div className='controls'>
        <Autocomplete
          id='item-locator'
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
            setSelectedItem(crafts[newValue]);
          }}
          autoComplete
          options={[value, ...labels]}
          filterSelectedOptions
          filterOptions={filterOptions}
          getOptionLabel={(option) => {
            return option ? option?.replace(/_/g, " ") : "";
          }}
          getOptionSelected={(option, value) => option === value}
          renderOption={(option) => {
            return option ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                <img
                  width={24}
                  height={24}
                  src={`${prefix}data/${crafts?.[option]?.rawName}.png`}
                  alt=''
                />
                {option?.replace(/_/g, " ")}
              </div>
            ) : (
              <></>
            );
          }}
          style={{ width: 300 }}
          renderInput={(params) => (
            <StyledTextField {...params} label='Item Name' variant='outlined' />
          )}
        />
        <StyledTextField
          label='Copies'
          type='number'
          variant='outlined'
          value={copies}
          inputProps={{ min: 1 }}
          onChange={({ target }) => setCopies(target?.value)}
        />
        <FormControlLabel
          control={
            <StyledCheckbox
              checked={showNestedCrafts}
              onChange={() => setShowNestedCrafts(!showNestedCrafts)}
              name='nestedCrafts'
              color='default'
            />
          }
          label='Show Nested Crafts'
        />
      </div>
      {myItems && selectedItem?.rawName ? (
        <MaterialComponent
          main={true}
          copies={copies}
          key={selectedItem?.rawName}
          item={selectedItem}
          inventoryItems={myItems}
          materials={selectedItem?.materials}
          showNestedCrafts={showNestedCrafts}
        />
      ) : null}
    </CraftItStyled>
  );
};

const MaterialComponent = ({
  main,
  item,
  materials,
  inventoryItems,
  showNestedCrafts,
  className,
  copies,
}) => {
  let quantityOwned = 0;

  if (!main) {
    const inventoryItem = findItemInInventory(inventoryItems, item?.itemName);
    quantityOwned = Object.values(inventoryItem)?.reduce((res, { amount }) => {
      return res + amount;
    }, 0);
  }

  const { itemName, itemQuantity, rawName } = item || {};
  return (
    <div className={className}>
      <div className='item'>
        <img
          title={cleanUnderscore(itemName)}
          src={`${prefix}data/${rawName}.png`}
          alt=''
        />
        {!main ? (
          <span
            className={
              quantityOwned >= parseInt(itemQuantity * copies)
                ? "material-value-done"
                : ""
            }>
            {kFormatter(quantityOwned)}/{kFormatter(itemQuantity * copies)}
          </span>
        ) : (
          ""
        )}
      </div>
      {materials?.map((innerItem, index) => {
        const materials = crafts?.[innerItem?.itemName]?.materials;
        console.log(copies);
        return (
          <MaterialComponent
            copies={copies}
            className='materials'
            key={innerItem?.rawName + index}
            item={innerItem}
            inventoryItems={inventoryItems}
            showNestedCrafts={showNestedCrafts}
            materials={showNestedCrafts ? materials : []}
          />
        );
      })}
    </div>
  );
};

const CraftItStyled = styled.div`
  margin-top: 15px;

  .controls {
    display: flex;
    gap: 10px;
  }

  .materials .materials {
    display: flex;
    flex-basis: 100%;
    flex-wrap: wrap;
    margin-left: 50px;
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
`;

const StyledCheckbox = styled(Checkbox)`
  && {
    color: white;
  }
`;

const StyledTextField = styled(TextField)`
  && label.Mui-focused {
    color: rgba(255, 255, 255, 0.7);
  }
`;

export default CraftIt;

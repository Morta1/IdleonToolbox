import React, { useEffect, useState } from "react";
import styled from "styled-components";
import crafts from "../../../data/crafts.json";
import { Checkbox, FormControlLabel, TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { createFilterOptions } from "@material-ui/lab/Autocomplete";
import { prefix, } from "../../../Utilities";
import RequiredItems from "./RequiredItems";

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

  const onItemChange = (newValue) => {
    setValue(newValue);
    setSelectedItem(crafts[newValue]);
  }

  return (
    <CraftItStyled>
      <div className='controls'>
        <Autocomplete
          id='item-locator'
          value={value}
          onChange={(event, newValue) => onItemChange(newValue)}
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
            <StyledTextField {...params} label='Item Name' variant='outlined'/>
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
        <div className={'crafts-container'}>
          <img
            src={`${prefix}data/${selectedItem?.rawName}.png`}
            alt=''
          />
          <RequiredItems
            copies={copies}
            inventoryItems={myItems}
            materials={selectedItem?.materials}
            showNestedCrafts={showNestedCrafts}
          />
        </div>
      ) : null}
    </CraftItStyled>
  );
};

const CraftItStyled = styled.div`
  margin-top: 15px;
  margin-bottom: 25px;

  .controls {
    display: flex;
    gap: 10px;
  }

  .crafts-container {
    margin-top: 10px;
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

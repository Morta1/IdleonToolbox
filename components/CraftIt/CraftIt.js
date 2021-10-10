import React, { useEffect, useState } from "react";
import styled from "styled-components";
import crafts from "../../data/crafts.json";
import { Checkbox, FormControlLabel, MenuItem, TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { createFilterOptions } from "@material-ui/lab/Autocomplete";
import { flattenCraftObject, prefix } from "../../Utilities";
import RequiredItems from "./RequiredItems";
import CraftItemsList from "./CraftItemsList";

const filterOptions = createFilterOptions({
  trim: true,
});

const CraftIt = ({ userData }) => {
  const [labels] = useState(Object.keys(crafts));
  const [value, setValue] = useState("");
  const [selectedTreeItem, setSelectedTreeItem] = useState({});
  const [selectedListItem, setSelectedListItem] = useState({});
  const [showNestedCrafts, setShowNestedCrafts] = useState(false);
  const [myItems, setMyItems] = useState();
  const [copies, setCopies] = useState(1);
  const [display, setDisplay] = useState('tree');

  useEffect(() => {
    const charItems = userData?.characters.reduce((res, { inventory }) => [...res, ...inventory], []);
    const totalItems = [...charItems, ...userData?.account?.inventory];
    setMyItems(totalItems);
  }, []);

  useEffect(() => {
    if (display === 'list') {
      const result = Array.isArray(selectedListItem) ? selectedListItem : flattenCraftObject(selectedListItem);
      setSelectedListItem(result);
    } else {
      setSelectedTreeItem(selectedTreeItem)
    }
  }, [display])

  useEffect(() => {
    if (selectedListItem) {
      const result = Array.isArray(selectedListItem) ? selectedListItem : flattenCraftObject(selectedListItem);
      setSelectedListItem(result);
    }
  }, [selectedListItem]);

  const onItemChange = (newValue) => {
    setValue(newValue);
    setSelectedListItem(crafts[newValue]);
    setSelectedTreeItem(crafts[newValue]);
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
            ) : <></>;
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
        <StyledTextField
          select
          variant={'outlined'}
          id="demo-simple-select-outlined"
          value={display}
          onChange={(e) => setDisplay(e?.target?.value)}
          label="Display"
        >
          <MenuItem value={'tree'}>Tree</MenuItem>
          <MenuItem value={'list'}>List</MenuItem>
        </StyledTextField>
        {display === 'tree' ? <FormControlLabel
          control={
            <StyledCheckbox
              checked={showNestedCrafts}
              onChange={() => setShowNestedCrafts(!showNestedCrafts)}
              name='nestedCrafts'
              color='default'
            />
          }
          label='Show Nested Crafts'
        /> : null}
      </div>
      {myItems && selectedTreeItem?.rawName && display === 'tree' ? (
        <div className={'crafts-container'}>
          <img
            src={`${prefix}data/${selectedTreeItem?.rawName}.png`}
            alt=''
          />
          <RequiredItems
            displa={display}
            copies={copies}
            inventoryItems={myItems}
            materials={selectedTreeItem?.materials}
            showNestedCrafts={showNestedCrafts}
          />
        </div>
      ) : null}
      {myItems && selectedListItem?.length && display === 'list' ?
        <div className={'crafts-container'}>
          <img
            src={`${prefix}data/${selectedTreeItem?.rawName}.png`}
            alt=''
          />
          <CraftItemsList itemsList={selectedListItem} copies={copies} inventoryItems={myItems}/>
        </div>
        : null}
    </CraftItStyled>
  );
};

const CraftItStyled = styled.div`
  padding: 10px;
  margin-top: 15px;
  margin-bottom: 25px;

  .controls {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    @media (max-width: 800px) {
      padding: 10px;
    }
  }

  .crafts-container {
    margin-top: 15px;
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

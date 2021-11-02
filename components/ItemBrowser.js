import styled from "styled-components";
import { TextField } from "@material-ui/core";
import { useEffect, useState } from "react";
import { Autocomplete } from "@material-ui/lab";
import { findItemInInventory, kFormatter, prefix } from "../Utilities";
import { createFilterOptions } from "@material-ui/lab/Autocomplete";
import ItemDisplay from "./Common/ItemDisplay";
import allItems from '../data/items-array.json';

const filterOptions = createFilterOptions({
  trim: true,
  limit: 250
});

const ItemBrowser = ({ userData }) => {
  const [value, setValue] = useState("");
  const [items, setItems] = useState();
  const [labels, setLabels] = useState();
  const [result, setResult] = useState();

  useEffect(() => {
    const charItems = userData?.characters.reduce((res, { inventory }) => [...res, ...inventory], []);
    const totalItems = [...charItems, ...userData?.account?.inventory];
    setLabels(allItems);
    setItems(totalItems);
  }, []);

  useEffect(() => {
    if (value) {
      const findings = findItemInInventory(items, value?.displayName);
      setResult(findings);
    } else {
      setResult([]);
    }
  }, [value]);

  return (
    <ItemBrowserStyle>
      <div className={'main-header'}>Browse all items in the game!</div>
      <div className={'sub-header'}>The amount of items you own will be displayed below the item&apos;s display</div>
      {labels?.length > 0 ? (
        <Autocomplete
          id='item-locator'
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
          }}
          autoComplete
          options={[value, ...labels]}
          filterSelectedOptions
          filterOptions={filterOptions}
          getOptionLabel={(option) => {
            return option?.displayName ? option?.displayName?.replace(/_/g, " ") : "";
          }}
          getOptionSelected={(option, value) => option.displayName === value.displayName}
          renderOption={(option) =>
            option ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                <img
                  width={24}
                  height={24}
                  src={`${prefix}data/${option?.rawName}.png`}
                  alt=''
                />
                {option?.displayName?.replace(/_/g, " ")}
              </div>
            ) : (
              <></>
            )
          }
          style={{ width: 300 }}
          renderInput={(params) => (
            <StyledTextField {...params} label='Item Name' variant='outlined'
                             helperText={'Start to write to narrow down the results (max of 250 items)'}/>
          )}
        />
      ) : null}
      {value ? <ItemDisplay style={{ marginTop: 15 }} {...value}/> : null}
      {result && Object.keys(result)?.length > 0 ? (
        <div className={"results"}>

          {Object.keys(result)?.map((ownerName, index) => (
            <div key={ownerName + index}>
              <span className={"owner-name"}>{ownerName}</span>
              {result?.[ownerName]?.amount ? (
                <span className={"amount"}>
                  ({kFormatter(result?.[ownerName]?.amount)})
                </span>
              ) : (
                ""
              )}
            </div>
          ))}
        </div>
      ) : null}
    </ItemBrowserStyle>
  );
};

const ItemBrowserStyle = styled.div`
  padding-left: 10px;
  margin-top: 25px;

  .main-header {
    font-size: 22px;
    font-weight: bold;
  }

  .sub-header {
    margin-top: 15px;
    margin-bottom: 2em;
  }

  .results {
    margin-top: 15px;
    padding-left: 15px;
    display: grid;
    grid-template-columns: repeat(2, 250px);

    & .owner-name {
      display: inline-block;
      width: 150px;
    }

    & .amount {
      color: #54c34d;
    }
  }
`;

const StyledTextField = styled(TextField)`
  && label.Mui-focused {
    color: rgba(255, 255, 255, 0.7);
  }
`;

export default ItemBrowser;

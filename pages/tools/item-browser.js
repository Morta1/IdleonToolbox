import { useContext, useEffect, useState } from "react";
import { itemsArray } from "data/website-data";
import { findItemInInventory } from "parsers/items";
import { Autocomplete, Card, CardContent, createFilterOptions, Stack, TextField, Typography } from "@mui/material";
import { kFormatter, prefix } from "utility/helpers";
import styled from "@emotion/styled";
import ItemDisplay from "components/common/ItemDisplay";
import { AppContext } from "components/common/context/AppProvider";

const filterOptions = createFilterOptions({
  trim: true,
  limit: 250
});

const ItemBrowser = ({}) => {
  const { state } = useContext(AppContext);
  const [value, setValue] = useState("");
  const [items, setItems] = useState();
  const [labels, setLabels] = useState();
  const [result, setResult] = useState();

  useEffect(() => {
    const charItems = state?.characters.reduce((res, { inventory }) => [...res, ...inventory], []);
    const totalItems = [...charItems, ...state?.account?.storage];
    setLabels(itemsArray);
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
      <Typography my={2} variant={'h2'}>Item Browser</Typography>
      <Typography variant={'subtitle1'}>Browse all items in your account!</Typography>
      <Typography mb={4} variant={'subtitle1'}>The amount of items you own will be displayed below the item&apos;s
        display</Typography>
      {labels?.length > 0 ? (
        <Autocomplete
          id='item-browser'
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
          renderOption={(props, option) => {
            return <Stack {...props} key={props.id} gap={2} direction={'row'}>
              <img
                key={`img-${props.id}`}
                width={24}
                height={24}
                src={`${prefix}data/${option?.rawName}.png`}
                alt=''
              />
              <Typography key={`text-${props.id}`}>{option?.displayName?.replace(/_/g, " ")}</Typography>
            </Stack>
          }}
          style={{ width: 300 }}
          renderInput={(params) => (
            <StyledTextField {...params} label='Item Name' variant='outlined'
                             helperText={'Start to write to narrow down the results (max of 250 items)'}/>
          )}
        />
      ) : null}
      {value ? <Card sx={{ my: 2, width: 'fit-content' }}>
        <CardContent>
          <ItemDisplay style={{ marginTop: 15 }} {...value}/>
        </CardContent>
      </Card> : null}
      {result && Object.keys(result)?.length > 0 ? (
        <Card sx={{ my: 2, width: 'fit-content' }}>
          <CardContent>
            {Object.keys(result)?.map((ownerName, index) => (
              <Stack direction={'row'} gap={2} key={ownerName + index}>
                <span className={"owner-name"}>{ownerName}</span>
                {result?.[ownerName]?.amount ? (
                  <Typography color={'success.light'} className={"amount"}>
                    ({kFormatter(result?.[ownerName]?.amount)})
                  </Typography>
                ) : (
                  ""
                )}
              </Stack>
            ))}
          </CardContent>
        </Card>
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

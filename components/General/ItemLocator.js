import styled from 'styled-components'
import { TextField } from "@material-ui/core";
import { useEffect, useState } from "react";
import { Autocomplete } from "@material-ui/lab";
import { kFormatter, prefix } from "../../Utilities";
import { createFilterOptions } from '@material-ui/lab/Autocomplete';

const filterOptions = createFilterOptions({
  limit: 15
});

const ItemLocator = ({ userData }) => {
  const [value, setValue] = useState('');
  const [items, setItems] = useState();
  const [labels, setLabels] = useState();
  const [result, setResult] = useState();

  useEffect(() => {
    const charItems = userData?.characters.reduce((res, { inventory }) => ([...res, ...inventory]), []);
    const totalItems = [...charItems, ...userData?.account?.inventory];
    const labelsObj = totalItems.reduce((res, item) => (res[item?.name] ? res : { ...res, [item?.name]: item }), {})
    const tempLabels = Object.keys(labelsObj).reduce((res, item) => ([...res, labelsObj[item]]), []);
    const sorted = tempLabels.sort((a, b) => {
      const nameA = a?.['name']?.replace(/_/g, ' ').toUpperCase() || ''; // ignore upper and lowercase
      const nameB = b?.['name']?.replace(/_/g, ' ').toUpperCase() || ''; // ignore upper and lowercase
      return nameB.localeCompare(nameA);
    })
    setLabels(sorted);
    setItems(totalItems);
  }, []);


  useEffect(() => {
    if (value) {
      const findings = findItem(items);
      setResult(findings);
    } else {
      setResult([]);
    }
  }, [value]);

  const findItem = (arr) => {
    return arr.reduce((res, { name, owner, amount }) => {
      if (name.includes(value?.name)) {
        if (res?.[owner]) {
          return { ...res, [owner]: { amount: res?.[owner]?.amount + 1 } }
        } else {
          return { ...res, [owner]: { amount } }
        }
      }
      return res;
    }, {});
  }

  return (
    <ItemLocatorStyle>
      <h3>Find an item somewhere in your account!</h3>
      {labels?.length > 0 ? <Autocomplete
        id="item-locator"
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
        autoComplete
        options={[value, ...labels]}
        filterSelectedOptions
        filterOptions={filterOptions}
        getOptionLabel={(option) => {
          return option?.name ? option?.name?.replace(/_/g, " ") : '';
        }}
        getOptionSelected={(option, value) => option.name === value.name}
        renderOption={(option) => option ?
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img width={24} height={24} src={`${prefix}data/${option?.rawName}.png`} alt=""/>
            {option?.name?.replace(/_/g, " ")}
          </div> : <></>}
        style={{ width: 300 }}
        renderInput={(params) => <StyledTextField {...params} label="Item Name" variant="outlined"/>}
      /> : null}
      {result && Object.keys(result)?.length > 0 ? <div className={'results'}>
        {Object.keys(result)?.map((ownerName, index) => <div key={ownerName + index}>
          <span className={'owner-name'}>{ownerName}</span>
          {result?.[ownerName]?.amount ?
            <span className={'amount'}>({kFormatter(result?.[ownerName]?.amount)})</span> : ''}
        </div>)}
      </div> : null}
    </ItemLocatorStyle>
  );
};

const ItemLocatorStyle = styled.div`
  padding-left: 10px;
  margin-top: 25px;

  > h3 {
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

export default ItemLocator;

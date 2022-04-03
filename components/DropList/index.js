import styled from 'styled-components'
import { Container, TextField, Typography } from "@material-ui/core";
import { cleanUnderscore, kFormatter, prefix } from "../../Utilities";
import NumberTooltip from "../Common/Tooltips/NumberTooltip";
import { Autocomplete } from "@material-ui/lab";
import { useEffect, useMemo, useState } from "react";

const DropList = ({ dropList }) => {
  const [value, setValue] = useState('');
  const [itemValue, setItemValue] = useState('');
  const [results, setResults] = useState({});
  const getMonstersLabels = (drops) => Object.keys(drops);
  const getItemsLabels = (drops) => {
    const uniqueItems = {};
    return Object.entries(drops)?.reduce((res, [monsterName, drops]) => {
      drops.forEach((item) => {
        if (!uniqueItems?.[item?.displayName]) {
          res = [...res, item?.displayName];
          uniqueItems[item?.displayName] = true;
        }
      });
      return res;
    }, []);
  }
  const findItem = (drops, itemValue) => {
    return Object.entries(drops)?.reduce((res, [monsterName, drops]) => {
      const foundItem = drops?.find(({ displayName }) => itemValue === displayName);
      return foundItem ? { ...res, [monsterName]: drops } : res;
    }, {});
  }
  const labels = useMemo(() => getMonstersLabels(dropList), [dropList]);
  const itemsLabels = useMemo(() => getItemsLabels(dropList), [dropList]);
  const monstersWithItem = useMemo(() => findItem(dropList, itemValue), [itemValue]);

  useEffect(() => {
    if (!value) return setResults({});
    setResults({ [value]: dropList?.[value] })
  }, [value]);

  useEffect(() => {
    if (!itemValue) return setResults({});
    setResults(monstersWithItem);
  }, [itemValue]);

  return (
    <DropListStyle>
      <Container className={'autocomplete'}>
        <Autocomplete
          id='item-locator'
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
          }}
          autoComplete
          options={[value, ...labels]}
          filterSelectedOptions
          getOptionLabel={(option) => cleanUnderscore(option)}
          getOptionSelected={(option, value) => option === value}
          style={{ width: 300 }}
          renderInput={(params) => (
            <StyledTextField {...params} label='Monster Name' variant='outlined' helperText={'Filter by monster name'}/>
          )}
        />
        <Autocomplete
          id='item-locator'
          value={itemValue}
          onChange={(event, newValue) => {
            setItemValue(newValue);
          }}
          autoComplete
          options={[itemValue, ...itemsLabels]}
          filterSelectedOptions
          getOptionLabel={(option) => cleanUnderscore(option)}
          getOptionSelected={(option, value) => option === value}
          style={{ width: 300 }}
          renderInput={(params) => (
            <StyledTextField {...params} label='Item Name' variant='outlined' helperText={'Filter by item name'}/>
          )}
        />
      </Container>
      <Container className={'list'}>
        {Object.entries(results)?.map(([monsterName, dropList], index) => {
          return <div className={'monster'} key={`${monsterName}-${index}`}>
            <Typography variant={'h4'}>{cleanUnderscore(monsterName)}</Typography>
            <div className={'drops'}>
              {dropList?.map((drop, dropIndex) => {
                const { rawName, displayName, quantity, chance, questLink } = drop;
                return chance > 0 ? <div className={'drop-box'} key={dropIndex}>
                  <div>
                    {rawName === 'COIN' ? <img src={`${prefix}data/Coins4.png`} alt=""/> :
                      <NumberTooltip title={cleanUnderscore(displayName)}>
                        <img className={'item'}
                             src={`${prefix}data/${rawName}.png`}
                             alt=""/></NumberTooltip>}
                  </div>
                  <div>
                    <div>Q: {kFormatter(quantity)}</div>
                    <div>C: {chance}%</div>
                  </div>
                </div> : null;
              })}
            </div>
          </div>
        })}
      </Container>

    </DropListStyle>
  );
};

const StyledTextField = styled(TextField)`
  && label.Mui-focused {
    color: rgba(255, 255, 255, 0.7);
  }
`;

const DropListStyle = styled.div`
  position: relative;

  .autocomplete {
    display: flex;
    gap: 20px;
    margin-top: 20px;
    background-color: #222831;
  }

  .list {
    padding-top: 30px;
  }

  .monster {
    margin-top: 20px;
  }

  .drops {
    margin-top: 20px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;

    .drop-box {
      border: 1px solid #595959;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 175px;
      height: 80px;

      .item {
        //object-fit: contain;
        height: auto;
        max-height: 50px;
      }
    }
  }
`;

export default DropList;

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { itemsArray } from 'data/website-data';
import {
  addEquippedItems,
  findItemByDescriptionInInventory,
  findItemInInventory,
  getAllItems,
  mergeItemsByOwner
} from 'parsers/items';
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Checkbox,
  createFilterOptions,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { kFormatter, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import ItemDisplay from 'components/common/ItemDisplay';
import { AppContext } from 'components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import debounce from 'lodash.debounce';
import HtmlTooltip from '../../components/Tooltip';

const filterOptions = createFilterOptions({
  trim: true,
  limit: 250
});

const ItemBrowser = ({}) => {
  const { state } = useContext(AppContext);
  const [value, setValue] = useState('');
  const [items, setItems] = useState();
  const [labels, setLabels] = useState();
  const [result, setResult] = useState();
  const [searchBy, setSearchBy] = useState('name');
  const [includeEquippedItems, setIncludeEquippedItems] = useState(false);
  const equippedItems = useMemo(() => addEquippedItems(state?.characters, includeEquippedItems), [includeEquippedItems]);
  const totalItems = useMemo(() => getAllItems(state?.characters, state?.account), [state?.characters, state?.account])
  const totalAmount = Object.values(result || {}).reduce((res, { amount }) => res + amount, 0);

  useEffect(() => {
    setLabels(itemsArray);
    if (!state?.characters && !state?.account) {
      setItems(itemsArray);
    } else {
      setItems(includeEquippedItems ? mergeItemsByOwner([...(totalItems || []), ...(equippedItems || [])]) : mergeItemsByOwner(totalItems));
    }
  }, [state, includeEquippedItems]);

  useEffect(() => {
    if (value && searchBy === 'name') {
      const findings = findItemInInventory(items, value?.displayName);
      setResult(findings);
    } else if (value && searchBy === 'description') {
      const findings = findItemByDescriptionInInventory(items, value);
      setResult(findings);
    } else {
      setResult([]);
    }
  }, [value, includeEquippedItems, items]);

  useEffect(() => {
    setValue('')
  }, [searchBy]);

  const handleValueChange = debounce((e) => {
    setValue(e.target.value);
  }, 100)
  return (
    (<ItemBrowserStyle>
      <NextSeo
        title="Item Browser | Idleon Toolbox"
        description="Browse all of your existing items with a handy search"
      />
      <Typography my={2} variant={'h2'}>Item Browser</Typography>
      <Typography variant={'subtitle1'}>Browse all items in your account!</Typography>
      <Typography mb={4} variant={'subtitle1'}>The amount of items you own will be displayed below the item&apos;s
        display</Typography>
      <Stack>
        <FormControl>
          <FormLabel id="demo-radio-buttons-group-label">Search by</FormLabel>
          <RadioGroup
            row
            aria-labelledby="demo-radio-buttons-group-label"
            defaultValue="name"
            name="radio-buttons-group"
            onChange={(e) => setSearchBy(e.target.value)}
          >
            <FormControlLabel value="name" control={<Radio/>} label="Item Name"/>
            <FormControlLabel value="description" control={<Radio/>} label="Item Description"/>
          </RadioGroup>
        </FormControl>
      </Stack>
      <Stack direction={'row'} alignItems={'center'} gap={2}>
        {searchBy === 'name' && labels?.length > 0 ? (
          <Autocomplete
            id="item-browser"
            value={value}
            onChange={(event, newValue) => {
              setValue(newValue);
            }}
            autoComplete
            options={[value, ...labels]}
            filterSelectedOptions
            filterOptions={filterOptions}
            getOptionLabel={(option) => {
              return option?.displayName ? option?.displayName?.replace(/_/g, ' ') : '';
            }}
            renderOption={(props, option) => {
              return (
                (<Stack {...props} key={props.id} gap={2} direction={'row'}>
                  <img
                    key={`img-${props.id}`}
                    width={24}
                    height={24}
                    src={`${prefix}data/${option?.rawName}.png`}
                    alt="item-icon"
                  />
                  <Typography key={`text-${props.id}`}>{option?.displayName?.replace(/_/g, ' ')}</Typography>
                </Stack>)
              );
            }}
            style={{ width: 300 }}
            renderInput={(params) => (
              <StyledTextField   {...params} label="Item Name" variant="outlined"
              />
            )}
          />
        ) : null}
        {searchBy === 'description' ?
          <TextField sx={{ mt: 1 }} placeholder={'Type anything'}
                     onChange={(e) => handleValueChange(e)}
                     InputProps={{
                       endAdornment: <InputAdornment position="end">
                         <IconButton>
                           <SearchIcon/>
                         </IconButton>
                       </InputAdornment>
                     }}/> : null}
        <FormControlLabel
          control={
            <StyledCheckbox
              checked={includeEquippedItems}
              onChange={() => setIncludeEquippedItems(!includeEquippedItems)}
              name="Include Equipped Items"
              color="default"
            />
          }
          label={'Include Equipped Items'}
        />
      </Stack>
      {searchBy === 'name' ?
        <Typography component={'div'} variant={'caption'} sx={{ width: 300, mt: 1 }}>Start to write to narrow down the
          results (max of 250
          items)</Typography> : null}
      {value && searchBy === 'name' ? <Card sx={{ my: 2, width: 'fit-content' }}>
        <CardContent>
          <ItemDisplay style={{ marginTop: 15 }} {...value}/>
        </CardContent>
      </Card> : null}
      {value && searchBy === 'description' ?
        <Stack direction={'row'} gap={3} flexWrap={'wrap'} flexShrink={0} flexGrow={0}>
          {Array.isArray(result) && result?.map((item, index) => {
            return <Box key={item?.rawName + index} sx={{ width: 200, height: 'fit-content' }}>
              <HtmlTooltip title={item?.owners?.join(', ')}>
                <Card sx={{ my: 2 }}>
                  <CardContent>
                    <ItemDisplay style={{ marginTop: 15 }} {...item}/>
                  </CardContent>
                </Card>
              </HtmlTooltip>
            </Box>
          })}
        </Stack>
        : null}
      {searchBy === 'name' && result && Object.keys(result)?.length > 0 ? (
        <Card sx={{ my: 2, width: 'fit-content' }}>
          <CardContent>
            {Object.keys(result)?.map((ownerName, index) => (
              <Stack direction={'row'} gap={2} key={ownerName + index}>
                <span className={'owner-name'}>{ownerName}</span>
                {result?.[ownerName]?.amount ? (
                  <Typography color={'success.light'} className={'amount'}>
                    ({kFormatter(result?.[ownerName]?.amount)})
                  </Typography>
                ) : (
                  ''
                )}
              </Stack>
            ))}
            {Object.keys(result).length > 1 ? <Typography>
              Total:
              <Typography component={'span'} color={'success.light'} mt={1}> {kFormatter(totalAmount)}</Typography>
            </Typography> : null}
          </CardContent>
        </Card>
      ) : null}
    </ItemBrowserStyle>)
  );
};

const ItemBrowserStyle = styled.div`

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
const StyledCheckbox = styled(Checkbox)`
  && {
    color: white;
  }
`;

export default ItemBrowser;

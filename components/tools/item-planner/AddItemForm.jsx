import React, { useState } from 'react';
import { Autocomplete, Box, Button, createFilterOptions, InputAdornment, Stack, TextField } from '@mui/material';
import { IconSearch } from '@tabler/icons-react';
import { crafts } from '@website-data';
import { cleanUnderscore, prefix } from 'utility/helpers';
import QuantityStepper from './QuantityStepper';

const craftNames = Object.keys(crafts);
const filterOptions = createFilterOptions({ trim: true, limit: 100 });

const AddItemForm = ({ onAdd, submitLabel = 'Add', withCount = true }) => {
  const [itemName, setItemName] = useState(null);
  const [count, setCount] = useState(1);
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!itemName) return;
    onAdd(itemName, count);
    setItemName(null);
    setCount(1);
  };

  return <Box component={'form'} onSubmit={(event) => {
    event.preventDefault();
    submit();
  }} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
    <Autocomplete
      sx={{ flex: '1 1 220px', minWidth: 0 }}
      size={'small'}
      value={itemName}
      onChange={(_, value) => setItemName(value)}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={craftNames}
      filterOptions={filterOptions}
      getOptionLabel={(option) => cleanUnderscore(option)}
      onKeyDown={(event) => {
        // Enter on a picked item adds it; while the list is open, Enter picks the highlighted option
        if (event.key === 'Enter' && !open && itemName) {
          event.defaultMuiPrevented = true;
          event.preventDefault();
          submit();
        }
      }}
      renderOption={({ key, ...props }, option) => <Stack component={'li'} key={key} {...props} direction={'row'}
                                                          gap={1.5}>
        <img width={24} height={24} style={{ objectFit: 'contain' }} src={`${prefix}data/${crafts[option]?.rawName}.png`}
             alt=""/>
        {cleanUnderscore(option)}
      </Stack>}
      renderInput={(params) => <TextField
        {...params}
        placeholder={'Search craftable items'}
        inputProps={{ ...params.inputProps, 'aria-label': 'Item to craft' }}
        InputProps={{
          ...params.InputProps,
          sx: { minHeight: { xs: 44, sm: 40 } },
          startAdornment: <InputAdornment position={'start'} sx={{ color: 'text.disabled' }}>
            {itemName
              ? <img width={24} height={24} style={{ objectFit: 'contain' }}
                     src={`${prefix}data/${crafts[itemName]?.rawName}.png`} alt=""/>
              : <IconSearch size={18}/>}
          </InputAdornment>
        }}
      />}
    />
    {withCount ? <QuantityStepper value={count} onChange={setCount}/> : null}
    <Button type={'submit'} variant={'contained'} disabled={!itemName}
            sx={{ minHeight: { xs: 44, sm: 36 }, flex: { xs: withCount ? '1 1 auto' : '0 0 auto', sm: '0 0 auto' } }}>
      {submitLabel}
    </Button>
  </Box>;
};

export default AddItemForm;

import React, { useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { itemsArray } from '@website-data';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { filterItemsForQuery } from '@utility/builds/itemRefs';

// Searchable item picker modal. Drives the "Insert item" button inside the
// rich text editor. Calls `onSelect(rawName)` once the user picks; the caller
// is responsible for inserting the reference into the underlying doc/text.
//
// Filtering deliberately matches on displayName + rawName so users can search
// by either; sorted so the shortest matches (typically the base-tier name)
// surface first.
const ItemPicker = ({ open, onClose, onSelect }) => {
  const [query, setQuery] = useState('');

  const options = useMemo(() => {
    if (!itemsArray) return [];
    return itemsArray.filter((it) => it?.rawName && it?.displayName && it.displayName !== 'Blank');
  }, []);

  const handleChange = (_e, value) => {
    if (value?.rawName) {
      onSelect(value.rawName);
      setQuery('');
    }
  };

  return (
    <Dialog open={!!open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Insert item</DialogTitle>
      <DialogContent>
        <Stack gap={1}>
          <Autocomplete
            autoFocus
            openOnFocus
            options={options}
            value={null}
            inputValue={query}
            onInputChange={(_e, v) => setQuery(v)}
            onChange={handleChange}
            getOptionLabel={(opt) => opt?.displayName ? cleanUnderscore(opt.displayName) : ''}
            isOptionEqualToValue={(a, b) => a?.rawName === b?.rawName}
            filterOptions={(opts, state) =>
              filterItemsForQuery(opts, state.inputValue).slice(0, 100)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search by name or rawName…"
                autoFocus
              />
            )}
            renderOption={(props, opt) => (
              <Box component="li" {...props} key={opt.rawName}>
                <Stack direction="row" alignItems="center" gap={1} sx={{ width: '100%' }}>
                  <img
                    src={`${prefix}data/${opt.rawName}.png`}
                    alt=""
                    width={24}
                    height={24}
                    style={{ objectFit: 'contain', flexShrink: 0 }}
                    onError={(e) => {
                      e.currentTarget.style.visibility = 'hidden';
                    }}
                  />
                  <Typography sx={{ flexGrow: 1 }}>
                    {cleanUnderscore(opt.displayName)}
                  </Typography>
                  {opt.Type && (
                    <Typography variant="caption" color="text.secondary">
                      {cleanUnderscore(opt.Type.toLowerCase()).replace(/_/g, ' ')}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
          />
          <Typography variant="caption" color="text.secondary">
            The chosen item gets inserted at your cursor as <code>[[rawName]]</code>.
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default ItemPicker;

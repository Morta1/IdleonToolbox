import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Autocomplete, Chip, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { searchEntities } from '@utility/wiki/search';
import { sessionQuery } from '@utility/nav-query';
import { EntityIcon, KIND_LABELS } from './EntityPanel';

// Loaded lazily and shaped by scripts/entity-graph/build.mjs: the slim index, not the full graph,
// so every wiki page affords search without paying for edges it never reads.
const defaultLoadEntries = () => import('../../data/wiki-search-index.json')
  .then((mod) => mod.default || mod);

// The wiki-wide search bar: mounted by WikiRail at the top of every wiki page.
// loadEntries is injectable for tests (vi.mock is unreliable under vitest isolate:false).
const WikiSearchBar = ({ loadEntries = defaultLoadEntries }) => {
  const router = useRouter();
  const [entries, setEntries] = useState(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    let alive = true;
    loadEntries().then((loaded) => {
      if (alive) setEntries(loaded);
    });
    return () => {
      alive = false;
    };
  }, []);

  const options = entries ? searchEntities(entries, inputValue) : [];

  return <Autocomplete
    sx={{ maxWidth: 800 }}
    // The bar holds no selection of its own: the URL does. Without this, picking the entity
    // you are already looking at would fire no change event at all.
    value={null}
    inputValue={inputValue}
    options={options}
    // searchEntities already ranked and capped the list; MUI must not filter it again.
    filterOptions={(allOptions) => allOptions}
    getOptionLabel={(option) => option.label}
    getOptionKey={(option) => option.id}
    loading={!entries}
    blurOnSelect
    onInputChange={(event, value) => setInputValue(value)}
    onChange={(event, option) => {
      if (option) {
        router.push({ pathname: `/wiki/${option.kind}/${option.slug}`, query: sessionQuery(router.query) });
      }
    }}
    renderOption={(props, option) => {
      const { key, ...optionProps } = props;
      return <Stack key={key} {...optionProps} direction={'row'} gap={1.5} alignItems={'center'}>
        <EntityIcon node={option} size={24}/>
        <Typography sx={{ flexGrow: 1 }}>{option.label}</Typography>
        <Chip size={'small'} variant={'outlined'} label={KIND_LABELS[option.kind] || option.kind}/>
      </Stack>;
    }}
    noOptionsText={inputValue ? 'No matches' : 'Start typing to search'}
    renderInput={(params) => <TextField
      {...params}
      label={'Search the wiki'}
      slotProps={{
        input: {
          ...params.InputProps,
          endAdornment: <>
            {!entries ? <CircularProgress size={18}/> : null}
            {params.InputProps.endAdornment}
          </>
        }
      }}
    />}
  />;
};

export default WikiSearchBar;

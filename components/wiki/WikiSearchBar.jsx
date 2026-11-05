import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Autocomplete, CircularProgress, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { IconSearch, IconX } from '@tabler/icons-react';
import TagLine from '@components/common/TagLine';
import { searchEntities } from '@utility/wiki/search';
import { sessionQuery } from '@utility/nav-query';
import EntityIcon from './EntityIcon';
import { KIND_LABELS } from '@utility/wiki/kind-labels.mjs';
import { entityHref } from '@utility/wiki/page-graph';
import { shownName } from '@utility/wiki/game-glyphs.mjs';

// Loaded lazily and shaped by scripts/entity-graph/build.mjs: the slim index, not the full graph,
// so every wiki page affords search without paying for edges it never reads.
const defaultLoadEntries = () => import('../../data/wiki-search-index.json')
  .then((mod) => mod.default || mod);

// The wiki-wide search bar: mounted by WikiRail at the top of every wiki page.
// loadEntries is injectable for tests (vi.mock is unreliable under vitest isolate:false).
const WikiSearchBar = ({ loadEntries = defaultLoadEntries }) => {
  const router = useRouter();
  const [entries, setEntries] = useState(null);
  const [failed, setFailed] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    let alive = true;
    loadEntries().then((loaded) => {
      if (alive) setEntries(loaded);
    }).catch(() => {
      if (alive) setFailed(true);
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
    getOptionLabel={(option) => shownName(option.label)}
    getOptionKey={(option) => option.id}
    loading={!entries && !failed}
    blurOnSelect
    forcePopupIcon={false}
    onInputChange={(event, value) => setInputValue(value)}
    onChange={(event, option) => {
      if (option) {
        router.push({ pathname: entityHref(option), query: sessionQuery(router.query) });
      }
    }}
    renderOption={(props, option) => {
      const { key, ...optionProps } = props;
      return <Stack key={key} {...optionProps} direction={'row'} gap={1.5} alignItems={'center'}>
        <EntityIcon node={option} size={24}/>
        <Typography variant={'body2'} sx={{ flexGrow: 1 }}>
          {shownName(option.label)}
          {/* Tells a same-name option apart; the label alone is still what the input matches and shows. */}
          {option.disambig ? <>
            {' '}
            <Typography component={'span'} variant={'body2'} color={'text.secondary'}>{option.disambig}</Typography>
          </> : null}
        </Typography>
        <TagLine tags={[KIND_LABELS[option.kind] || option.kind]}/>
      </Stack>;
    }}
    noOptionsText={failed ? 'Search didn\'t load. Reload the page to try again.' : inputValue ? 'No matches' : 'Start typing to search'}
    renderInput={(params) => <TextField
      {...params}
      label={'Search the wiki'}
      placeholder={'Search any item, monster or NPC'}
      slotProps={{
        input: {
          ...params.InputProps,
          startAdornment: <InputAdornment position={'start'} sx={{ color: 'text.secondary' }}><IconSearch size={16}/></InputAdornment>,
          endAdornment: <>
            {!entries && !failed ? <CircularProgress size={18}/> : null}
            {/* value stays null, so the Autocomplete never draws its own clear button. */}
            {inputValue ? <InputAdornment position={'end'}>
              <IconButton size={'small'} aria-label={'Clear search'} onClick={() => setInputValue('')} sx={{ mr: -0.5, color: 'text.secondary' }}>
                <IconX size={16}/>
              </IconButton>
            </InputAdornment> : null}
            {params.InputProps.endAdornment}
          </>
        }
      }}
    />}
  />;
};

export default WikiSearchBar;

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Autocomplete, Box, Chip, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import { indexGraph } from '@utility/wiki/graph';
import { searchEntities } from '@utility/wiki/search';
import { sessionQuery } from '@utility/nav-query';
import { EntityIcon, KIND_LABELS, KIND_PLURALS } from '@components/wiki/EntityPanel';
import CategoryTiles from '@components/wiki/CategoryTiles';
import { hasListing } from '@utility/wiki/kinds.mjs';
import SimpleLoader from '@components/common/SimpleLoader';

const Wiki = () => {
  const router = useRouter();
  const [index, setIndex] = useState(null);
  const [inputValue, setInputValue] = useState('');
  // Every entity has had its own page since routing landed. ?e= is what the wiki used before that,
  // and links to it are already out in the world, so it forwards rather than 404s.
  const legacyId = typeof router.query.e === 'string' ? router.query.e : null;

  // Loaded on demand and only here: this page owns the search box, and search is the one thing
  // that genuinely needs every entity. An entity page ships its own neighbourhood instead.
  useEffect(() => {
    let alive = true;
    import('../data/entity-graph.json').then((mod) => {
      if (alive) setIndex(indexGraph(mod.default || mod));
    });
    return () => {
      alive = false;
    };
  }, []);

  const go = (href) => router.push({ pathname: href, query: sessionQuery(router.query) });

  const entityHref = (id) => {
    const node = index?.byId?.[id];
    return node?.slug ? `/wiki/${node.kind}/${node.slug}` : null;
  };

  useEffect(() => {
    if (!index || !legacyId) return;
    const href = entityHref(legacyId);
    // replace, not push: a forwarded link should not leave the old URL in history behind it.
    if (href) router.replace({ pathname: href, query: sessionQuery(router.query) });
  }, [index, legacyId]);

  const options = index ? searchEntities(index.searchList, inputValue) : [];

  // Kept above the loader below, or the page has no title while the graph is still downloading.
  const seo = <NextSeo
    title="Wiki | Idleon Toolbox"
    description="Search every Legends of Idleon item, monster, NPC and quest to see what drops it, what it crafts, and which quests use it"
  />;

  return <Box sx={{ maxWidth: 1200 }}>
    {seo}
    {/* No heading of its own: the NavBar's PageTitle already renders the page's h1. */}
    <Typography mb={3} color={'text.secondary'}>
      Search any item, monster, NPC or quest to see how it connects to the rest of the game.
    </Typography>
    <Autocomplete
      sx={{ maxWidth: 800 }}
      // The search box holds no selection of its own: the URL does. Without this, picking the
      // entity you are already looking at would fire no change event at all.
      value={null}
      inputValue={inputValue}
      options={options}
      // searchEntities already ranked and capped the list; MUI must not filter it again.
      filterOptions={(allOptions) => allOptions}
      getOptionLabel={(option) => option.label}
      getOptionKey={(option) => option.id}
      loading={!index}
      blurOnSelect
      onInputChange={(event, value) => setInputValue(value)}
      onChange={(event, option) => {
        const href = option && entityHref(option.id);
        if (href) go(href);
      }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return <Stack key={key} {...optionProps} direction={'row'} gap={1.5} alignItems={'center'}>
          <EntityIcon node={index.byId[option.id]} size={24}/>
          <Typography sx={{ flexGrow: 1 }}>{option.label}</Typography>
          <Chip size={'small'} variant={'outlined'} label={KIND_LABELS[option.kind] || option.kind}/>
        </Stack>;
      }}
      noOptionsText={inputValue ? 'No matches' : 'Start typing to search'}
      renderInput={(params) => <TextField
        {...params}
        label={'Search items, monsters, NPCs and quests'}
        slotProps={{
          input: {
            ...params.InputProps,
            endAdornment: <>
              {!index ? <CircularProgress size={18}/> : null}
              {params.InputProps.endAdornment}
            </>
          }
        }}
      />}
    />
    <Box sx={{ mt: 3 }}>
      {!index || legacyId ? <SimpleLoader message={'Loading wiki data...'}/> : <Stack gap={2}>
        <Typography color={'text.secondary'}>
          Search above, or pick a category to browse.
        </Typography>
        <CategoryTiles searchList={index.searchList} onSelect={(kind) => go(`/wiki/${kind}`)}/>
      </Stack>}
    </Box>
  </Box>;
};

export const getStaticProps = async () => {
  const { staticGraph } = await import('@utility/wiki/static-graph.mjs');
  const { graph } = staticGraph();
  const kinds = [...new Set(Object.values(graph.nodes).filter((n) => n.navigable !== false).map((n) => n.kind))]
    .filter(hasListing);
  return {
    props: {
      // The category pages, so a crawler landing on /wiki has somewhere to go. Each of those then
      // lists its whole category, which is how the entity pages are reached.
      // The label, not the bare kind: this is the anchor text a crawler reads for the links that
      // lead to every entity page.
      crawlLinks: kinds.map((kind) => ({ h: `/wiki/${kind}`, t: KIND_PLURALS[kind] || kind })),
      crawlHeading: 'Wiki categories'
    }
  };
};

export default Wiki;

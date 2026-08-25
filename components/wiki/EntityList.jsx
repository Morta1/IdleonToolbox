import React, { useState } from 'react';
import { Box, Chip, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { EntityIcon, KIND_PLURALS } from './EntityPanel';
import CategoryHeader from './CategoryHeader';
import { SECTION_ORDER, chooseGrouping, groupEntries } from '@utility/wiki/grouping';
import { cleanUnderscore } from '@utility/helpers';

// A facet is only offered as a FILTER when the data has one worth offering. Maps divide into seven
// worlds and monsters into five kinds, so those become chips. Items have 112 distinct categories,
// which is a select, not a chip row.
// Matched to FACET_MAX: anything that earns a band earns a chip. The bestiary is eleven sections,
// seven worlds plus Bosses, Events, Dungeon and The Rift, and a select would hide all of them.
const CHIP_LIMIT = 12;

// Bands replace paging. A band is a page: the whole category renders, but broken into runs a
// reader can place themselves in, which is what the flat 100-per-page list never gave them.
// Items is 2,431 rows, so a band past this size collapses until asked for rather than putting
// every image on the page at once.
const BAND_PREVIEW = 60;

// Theme colours, cycled, so a facet band is identifiable before it is read. Not a new palette:
// these are the MUI dark palette's own, which is what the rest of the wiki already uses.
const BAND_COLOURS = ['primary.main', 'warning.light', 'info.light', 'success.light', 'secondary.light', 'error.light'];

const Band = ({ band, colour, index, onNavigate }) => {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? band.entries : band.entries.slice(0, BAND_PREVIEW);
  const hidden = band.entries.length - rows.length;

  return <Stack gap={1}>
    {/* A single unlabelled band is the whole list, and the count beside the filter already says how
        many, so a header here would just be an empty bar. */}
    {band.label ? <Stack
      direction={'row'} gap={1.5} alignItems={'baseline'} flexWrap={'wrap'}
      sx={{
        px: 1.5,
        py: 0.75,
        borderRadius: 1,
        borderLeft: '3px solid',
        borderColor: colour,
        bgcolor: 'action.hover'
      }}
    >
      <Typography variant={'body2'} fontWeight={600}>{cleanUnderscore(band.label)}</Typography>
      <Typography variant={'caption'} color={'text.disabled'} sx={{ ml: 'auto' }}>
        {band.entries.length.toLocaleString('en-US')}
      </Typography>
    </Stack> : null}

    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
      columnGap: 2
    }}>
      {rows.map((entry) => <Stack key={entry.id} direction={'row'} gap={1} alignItems={'center'} sx={{ py: 0.4 }}>
        <EntityIcon node={entry.node} size={32}/>
        <Link
          component={'button'}
          type={'button'}
          variant={'body2'}
          underline={'hover'}
          textAlign={'left'}
          onClick={() => onNavigate(entry.id)}
        >
          {entry.label}
        </Link>
      </Stack>)}
    </Box>

    {hidden > 0 ? <Link
      component={'button'}
      type={'button'}
      variant={'body2'}
      underline={'hover'}
      sx={{ alignSelf: 'flex-start' }}
      onClick={() => setExpanded(true)}
    >
      Show {hidden.toLocaleString('en-US')} more in {cleanUnderscore(band.label)}
    </Link> : null}
  </Stack>;
};

const EntityList = ({ index, kind, onNavigate, onBack }) => {
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState('');

  const all = index.searchList
    .filter((entry) => entry.kind === kind)
    .map((entry) => ({
      ...entry,
      node: index.byId[entry.id],
      category: index.byId[entry.id]?.category || null,
      world: index.byId[entry.id]?.world ?? null,
      section: index.byId[entry.id]?.section ?? null,
      order: index.byId[entry.id]?.order ?? null
    }));

  // Where a kind carries a world, that is the axis a reader browses it on: an NPC's category is
  // nothing and a monster's is mostly the word "Monster", while "World 3" is the thing someone is
  // actually looking under. Monsters are the deliberate rough edge here. Only 116 of 405 have a
  // world at all, because only a map's AFK target gets a location, so the Other band is the biggest
  // one on the page. Grouping past the automatic ceiling is a choice, so it is made explicitly.
  const byWorld = all.some((entry) => entry.section != null || entry.world != null);
  const facetOf = (entry) => {
    if (!byWorld) return entry.category;
    // A monster carries its bestiary section outright; an NPC only has a world.
    return entry.section ?? (entry.world != null ? `World ${entry.world}` : null);
  };

  // Alphabetical is the right axis for a catalogue and the wrong one for a sequence. Where the
  // game lays its own entities out in an order, the listing keeps that order.
  const ordered = all.length > 0 && all.every((entry) => entry.order != null);
  all.sort((a, b) => (ordered ? a.order - b.order : a.label.localeCompare(b.label)));

  // Same order as the bands: the worlds, then Bosses, Events, Dungeon, The Rift.
  const rankOf = (name) => (/^World \d+$/.test(name) ? -1 : SECTION_ORDER.indexOf(name));
  const categories = [...new Set(all.map(facetOf).filter(Boolean))].sort((a, b) => (
    rankOf(a) !== rankOf(b) ? rankOf(a) - rankOf(b) : a.localeCompare(b, 'en', { numeric: true })
  ));

  const needle = filter.trim().toLowerCase();
  const matches = all.filter((entry) => {
    if (needle && !entry.label.toLowerCase().includes(needle)) return false;
    if (category && facetOf(entry) !== category) return false;
    return true;
  });

  // Decided from the whole category, not the filtered view, so the page does not silently change
  // shape as you type. Filtering to one category would otherwise always collapse to a single band.
  const chosen = chooseGrouping(all.map(facetOf), byWorld ? { missingMax: 1 } : undefined);
  const mode = chosen;
  // Filtering to one facet already answers "which ones", so cutting that answer into A to Z adds a
  // dozen headers and no information: the reader picked World 3, not the letter B.
  const bands = groupEntries(matches, category ? 'none' : mode, facetOf);

  return <Stack gap={2}>
    <CategoryHeader kind={kind} count={all.length} onBack={onBack}/>

    <Stack direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'}>
      <TextField
        size={'small'}
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        label={`Filter ${(KIND_PLURALS[kind] || kind).toLowerCase()}`}
        sx={{ width: 260 }}
      />
      {categories.length > 1 && categories.length > CHIP_LIMIT ? <TextField
        size={'small'}
        select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        label={'Category'}
        sx={{ width: 220 }}
      >
        <MenuItem value={''}>All</MenuItem>
        {categories.map((name) => <MenuItem key={name} value={name}>{cleanUnderscore(name)}</MenuItem>)}
      </TextField> : null}
      {categories.length > 1 && categories.length <= CHIP_LIMIT ? <>
        <Chip
          size={'small'}
          label={'All'}
          variant={category ? 'outlined' : 'filled'}
          onClick={() => setCategory('')}
        />
        {categories.map((name) => <Chip
          key={name}
          size={'small'}
          label={cleanUnderscore(name)}
          variant={category === name ? 'filled' : 'outlined'}
          onClick={() => setCategory(category === name ? '' : name)}
        />)}
      </> : null}
      {matches.length !== all.length ? <Typography variant={'caption'} color={'text.secondary'}>
        {matches.length.toLocaleString('en-US')} of {all.length.toLocaleString('en-US')}
      </Typography> : null}
    </Stack>

    {matches.length === 0 ? <Typography color={'text.secondary'}>No matches</Typography> : null}

    {bands.map((band, bandIndex) => <Band
      key={band.key}
      band={band}
      index={bandIndex}
      colour={mode === 'facet' && !category ? BAND_COLOURS[bandIndex % BAND_COLOURS.length] : 'divider'}
      onNavigate={onNavigate}
    />)}
  </Stack>;
};

export default EntityList;

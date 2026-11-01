import React, { useState } from 'react';
import { Box, Link, Stack, Typography } from '@mui/material';
import EntityIcon from './EntityIcon';
import GemCount from './GemCount';
import ListingTable, { Disambig } from './ListingTable';
import { firstOrder, visibleRows } from '@components/common/DataTable/layout';
import Toolbar from '@components/common/Toolbar';
import { KIND_PLURALS } from '@utility/wiki/kind-labels.mjs';
import CategoryHeader from './CategoryHeader';
import { linkProps, navigateOnPlainClick } from './links';
import { SECTION_ORDER, chooseGrouping, facetReader, groupEntries } from '@utility/wiki/grouping';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { categoryLabel } from '@utility/wiki/categories.mjs';
import { NAME_COLUMN, isNumericColumn, sortColumn, sortEntries } from '@utility/wiki/listing-sort.mjs';

// A listing's toolbar starts full every visit: a reader from a search engine sees the whole list.
const TOOLBAR_DEFAULTS = { search: '', show: '', sort: null };

// A Pet Mart pack has no banner: the game keeps its record in data instead of drawing it into art.
// So the card draws what the banner beside it would have shown - the pet, what it is called, the
// price and both currencies - rather than leaving a sprite alone in a banner-sized box.
const PetMartCard = ({ entry }) => <Stack direction={'row'} gap={1.5} alignItems={'center'}>
  <Box
    component={'img'}
    src={entry.node.icon}
    alt={''}
    sx={{ height: 84, width: 84, objectFit: 'contain', flexShrink: 0 }}
  />
  <Stack gap={0.25} sx={{ minWidth: 0 }}>
    <Typography variant={'body2'} fontWeight={600}>{entry.label}<Disambig entry={entry}/></Typography>
    {entry.node.petName ? <Typography variant={'caption'} color={'text.secondary'}>
      {cleanUnderscore(entry.node.petName)}
    </Typography> : null}
    <Stack direction={'row'} gap={1.5} alignItems={'center'} flexWrap={'wrap'} sx={{ mt: 0.25 }}>
      {entry.node.price > 0
        ? <Typography variant={'caption'} fontWeight={600}>{formatNum(entry.node.price, 'price')}</Typography>
        : null}
      {entry.node.gems > 0 ? <GemCount amount={entry.node.gems} size={14} caption/> : null}
      {entry.node.petCrystals > 0 ? <GemCount amount={entry.node.petCrystals} isCrystal size={14} caption/> : null}
    </Stack>
  </Stack>
</Stack>;

// Theme colours, cycled, so a facet band is identifiable before it is read. Not a new palette:
// these are the MUI dark palette's own, which is what the rest of the wiki already uses.
// The kinds whose art is a banner rather than an icon, and so are laid out two to a row.
const BANNER_KINDS = new Set(['bundle', 'world']);

const BAND_COLOURS = ['primary.main', 'warning.light', 'info.light', 'success.light', 'secondary.light', 'error.light'];

const Band = ({ band, colour, index, onNavigate, hrefFor, banner, labelOf }) => {
  const [expanded, setExpanded] = useState(false);
  const rows = visibleRows(band.entries, expanded);
  const hidden = band.entries.length - rows.length;
  const heading = band.label ? labelOf(band.label) : null;

  return <Stack gap={1}>
    {/* A single unlabelled band is the whole list, and the category header already says how many, so a
        header here would just be an empty bar. */}
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
      <Typography variant={'body2'} fontWeight={600}>{heading}</Typography>
      <Typography variant={'caption'} color={'text.muted'} sx={{ ml: 'auto' }}>
        {formatNum(band.entries.length, 'amount')}
      </Typography>
    </Stack> : null}

    {/* A bundle's art is a 711x120 shop banner carrying its name, its price and its contents, and
        a world's is the 811x433 island map carrying its name. In the five-column grid every other
        category uses both arrive unreadable, so they get wide cards instead: the art IS the row. */}
    <Box sx={banner ? {
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
      gap: 1.5
    } : {
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
      columnGap: 2
    }}>
      {rows.map((entry) => (banner ? <Stack
        key={entry.id}
        component={hrefFor?.(entry.id) ? 'a' : 'button'}
        {...(hrefFor?.(entry.id) ? { href: hrefFor(entry.id) } : { type: 'button' })}
        onClick={navigateOnPlainClick(onNavigate, entry.id, Boolean(hrefFor?.(entry.id)))}
        gap={0.75}
        sx={{
          p: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'transparent',
          // A native button does not inherit the theme's text colour, it takes the browser's own
          // black, which on this background is invisible.
          color: 'text.primary',
          cursor: 'pointer',
          textAlign: 'left',
          textDecoration: 'none',
          '&:hover': { borderColor: 'text.muted' }
        }}
      >
        {entry.node.petMart || entry.node.starterOffer ? <PetMartCard entry={entry}/> : <>
          <Box
            component={'img'}
            src={entry.node.icon}
            alt={''}
            sx={{ width: '100%', height: 'auto', borderRadius: 0.5 }}
          />
          <Typography variant={'body2'} fontWeight={600}>{entry.label}<Disambig entry={entry} band={heading}/></Typography>
        </>}
      </Stack> : <Stack key={entry.id} direction={'row'} gap={1} alignItems={'center'} sx={{ py: 0.4 }}>
        <EntityIcon node={entry.node} size={32}/>
        <Link
          {...linkProps(hrefFor, entry.id)}
          variant={'body2'}
          underline={'hover'}
          textAlign={'left'}
          onClick={navigateOnPlainClick(onNavigate, entry.id, Boolean(hrefFor?.(entry.id)))}
        >
          {entry.label}<Disambig entry={entry} band={heading}/>
        </Link>
      </Stack>))}
    </Box>

    {/* The rows a collapsed band hides are only reachable to a crawler through here. Text-only
        anchors, or a 2,400-row category requests 2,400 images for a block nobody sees. */}
    {hidden > 0 ? <Box component={'nav'} aria-hidden sx={{ display: 'none' }}>
      {band.entries.slice(rows.length).map((entry) => {
        const href = hrefFor?.(entry.id);
        return href ? <a key={entry.id} href={href}>{entry.label}</a> : null;
      })}
    </Box> : null}

    {hidden > 0 ? <Link
      component={'button'}
      type={'button'}
      variant={'body2'}
      underline={'hover'}
      sx={{ alignSelf: 'flex-start' }}
      onClick={() => setExpanded(true)}
    >
      Show {formatNum(hidden, 'amount')} more{heading ? ` in ${heading}` : ''}
    </Link> : null}
  </Stack>;
};

// A facet sorts in band order, and a cost by its currency in the order the default list meets them, so a sort
// never reads like an alphabet of category names or ranks Stardust against another dust by amount.
const sortRanks = (all, categories, columns) => {
  const costAt = columns.findIndex((column) => column.type === 'cost');
  const currencyRank = {};
  if (costAt >= 0) {
    for (const entry of all) {
      const key = entry.cells?.[costAt]?.[0]?.currencyKey;
      if (key != null && !(key in currencyRank)) currencyRank[key] = Object.keys(currencyRank).length;
    }
  }
  return { facetRank: Object.fromEntries(categories.map((name, rank) => [name, rank])), currencyRank };
};

const EntityList = ({ index, kind, onNavigate, hrefFor, columns = [], sort = null, onSortChange }) => {
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState('');
  // Where the toolbar ends on screen, for the table header to stick under.
  const [toolbarBottom, setToolbarBottom] = useState(null);

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

  // Grouping past the automatic ceiling is a choice, so it is made explicitly (missingMax below).
  const { byWorld, facetOf } = facetReader(all);

  // Alphabetical is the right axis for a catalogue and the wrong one for a sequence. Where the
  // game lays its own entities out in an order, the listing keeps that order.
  const ordered = all.length > 0 && all.every((entry) => entry.order != null);
  all.sort((a, b) => (ordered ? a.order - b.order : a.label.localeCompare(b.label)));

  // An item's category is the game's raw type (PREMIUM_HELMET), which it never draws as text. Every other
  // facet (a world, a section, a class) already reads as words, which categoryLabel leaves as written.
  const labelOf = categoryLabel;

  // Same order as the bands: the worlds, then Bosses, Events, Dungeon, The Rift.
  const rankOf = (name) => (/^World \d+$/.test(name) ? -1 : SECTION_ORDER.indexOf(name));
  const named = [...new Set(all.map(facetOf).filter(Boolean))];
  // Where the entries carry the game's own order the bands follow it, so the picker has to as
  // well: `all` is already sorted by it, which makes first-appearance the right sequence. Sorting
  // these alphabetically would open the talent picker on Arcane Cultist and bury Beginner.
  const categories = ordered ? named : named.sort((a, b) => (
    // By the words the picker shows, not the raw value behind them.
    rankOf(a) !== rankOf(b) ? rankOf(a) - rankOf(b) : labelOf(a).localeCompare(labelOf(b), 'en', { numeric: true })
  ));

  const needle = filter.trim().toLowerCase();
  const matches = all.filter((entry) => {
    if (needle && !entry.label.toLowerCase().includes(needle)) return false;
    if (category && facetOf(entry) !== category) return false;
    return true;
  });

  // Decided from the whole category, not the filtered view, so the page does not silently change
  // shape as you type. Filtering to one category would otherwise always collapse to a single band.
  //
  // Talents raise the band ceiling because their facet is the game's own tab structure: 27 classes
  // of about fifteen talents each is how a player already thinks of them, and a flat A-Z of 376
  // names is the thing that would be unreadable.
  //
  // Bundles raise the dominance ceiling for a different reason: the gem shop packs outnumber the
  // Pet Mart ones three to one, which reads as an uneven tail to the ratio, but they are two
  // separate shops selling two different things and a reader browsing one is not browsing the other.
  const mode = chooseGrouping(all.map(facetOf), {
    ...(byWorld ? { missingMax: 1 } : {}),
    ...(kind === 'talent' ? { facetMax: 40 } : {}),
    ...(kind === 'bundle' ? { dominance: 1 } : {})
  });
  const sortBy = sort ? sortColumn(columns, sort.key) : null;
  const sorted = Boolean(sortBy?.sortable);
  // Sorted, the list is one unlabelled run: today's bands would cut the order the reader asked for. It shares the
  // unbanded list's key, so a list the reader expanded stays expanded when they sort it.
  const bands = sorted
    ? [{ key: 'all', label: '', entries: sortEntries(matches, sortBy, sort.order, sortRanks(all, categories, columns)) }]
      .filter((band) => band.entries.length)
    // Filtering to one facet already answers "which ones", so cutting that answer into A to Z adds a
    // dozen headers and no information: the reader picked World 3, not the letter B.
    : groupEntries(matches, category ? 'none' : mode, facetOf);
  const colourOf = (bandIndex) => (mode === 'facet' && !category ? BAND_COLOURS[bandIndex % BAND_COLOURS.length] : 'divider');

  // A banner is the row itself, and a table cell would shrink it to nothing, so the banner kinds keep their cards.
  const table = columns.length > 0 && !BANNER_KINDS.has(kind);

  // The toolbar's state is this listing's own: filter and category stay in useState (nothing is remembered),
  // and the sort stays in the URL through onSortChange.
  const plural = (KIND_PLURALS[kind] || kind).toLowerCase();
  const counts = {};
  for (const entry of all) {
    const facet = facetOf(entry);
    if (facet) counts[facet] = (counts[facet] ?? 0) + 1;
  }
  const toolbar = { search: filter, show: category, sort: sorted ? sort : null };
  const onToolbarChange = (patch) => {
    if ('search' in patch) setFilter(patch.search);
    if ('show' in patch) setCategory(patch.show);
    if ('sort' in patch) onSortChange?.(patch.sort);
  };
  const sortOptions = [NAME_COLUMN, ...columns.filter((column) => column.sortable)]
    .map((column) => [column.key, column.label, firstOrder({ numeric: isNumericColumn(column) })]);

  return <Stack gap={2}>
    <CategoryHeader kind={kind} count={all.length}/>

    <Toolbar state={toolbar} defaults={TOOLBAR_DEFAULTS} onChange={onToolbarChange} onReset={() => onToolbarChange(TOOLBAR_DEFAULTS)}
             total={all.length} shown={matches.length} noun={plural} onStickyBottom={setToolbarBottom}>
      <Toolbar.Search placeholder={`Search ${plural}`}/>
      {categories.length > 1 ? <Toolbar.Show options={[
        ['', `All ${plural}`, all.length],
        ...categories.map((name) => [name, labelOf(name), counts[name]])
      ]}/> : null}
      {/* Headers sort a table from md; below it, and on cards, the select is the only sort. */}
      {columns.length > 0 ? <Toolbar.Sort options={sortOptions} sx={table ? { display: { md: 'none' } } : undefined}/> : null}
    </Toolbar>

    {table ? <ListingTable
      columns={columns}
      bands={bands}
      sorted={sorted}
      sort={sorted ? sort : null}
      onSortChange={onSortChange}
      hrefFor={hrefFor}
      onNavigate={onNavigate}
      labelOf={labelOf}
      colourOf={colourOf}
      stickyTop={toolbarBottom}
    /> : bands.map((band, bandIndex) => <Band
      key={band.key}
      band={band}
      index={bandIndex}
      colour={colourOf(bandIndex)}
      onNavigate={onNavigate}
      hrefFor={hrefFor}
      banner={BANNER_KINDS.has(kind)}
      labelOf={labelOf}
    />)}
  </Stack>;
};

export default EntityList;

import React, { useState } from 'react';
import { Box, Link, Stack, Typography } from '@mui/material';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import EntityIcon from './EntityIcon';
import GemCount from './GemCount';
import ListingTable, { Disambig } from './ListingTable';
import { firstOrder, visibleRows } from '@components/common/DataTable/layout';
import Toolbar from '@components/common/Toolbar';
import { KIND_PLURALS } from '@utility/wiki/kind-labels.mjs';
import CategoryHeader, { pluralInSentence } from './CategoryHeader';
import { listingRooms } from './listingRoom';
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
const PetMartCard = ({ entry, ...link }) => <ItemCard
  {...link}
  icon={<Box component={'img'} src={entry.node.icon} alt={''} sx={{ height: 84, width: 84, objectFit: 'contain', flexShrink: 0 }}/>}
  title={<>{entry.label}<Disambig entry={entry}/></>}
  meta={entry.node.petName ? cleanUnderscore(entry.node.petName) : undefined}>
  <Stack direction={'row'} gap={1.5} alignItems={'center'} flexWrap={'wrap'}>
    {entry.node.price > 0 ? <Typography variant={'body2'} sx={{ fontWeight: 'fontWeightMedium' }}>{formatNum(entry.node.price, 'price')}</Typography> : null}
    {entry.node.gems > 0 ? <GemCount amount={entry.node.gems} caption/> : null}
    {entry.node.petCrystals > 0 ? <GemCount amount={entry.node.petCrystals} isCrystal caption/> : null}
  </Stack>
</ItemCard>;

// The kinds whose art is a banner rather than an icon, and so are laid out two to a row.
const BANNER_KINDS = new Set(['bundle', 'world']);

const Band = ({ band, onNavigate, hrefFor, banner, labelOf }) => {
  const [expanded, setExpanded] = useState(false);
  const rows = visibleRows(band.entries, expanded);
  const hidden = band.entries.length - rows.length;
  const heading = band.label ? labelOf(band.label) : null;

  return <Stack gap={1}>
    {/* A single unlabelled band is the whole list, and the category header already says how many, so a
        header here would just be an empty bar. */}
    {band.label ? <Stack
      direction={'row'} gap={1.5} alignItems={'baseline'} flexWrap={'wrap'}
      sx={{ pb: 0.5, borderBottom: 1, borderColor: 'divider' }}
    >
      <Typography variant={'groupLabel'} component={'h3'} color={'text.secondary'}>{heading}</Typography>
      <Typography variant={'caption'} color={'text.muted'} sx={{ ml: 'auto' }}>
        {formatNum(band.entries.length, 'amount')}
      </Typography>
    </Stack> : null}

    {/* A bundle's art is a 711x120 shop banner carrying its name, its price and its contents, and
        a world's is the 811x433 island map carrying its name. In the five-column grid every other
        category uses both arrive unreadable, so they get wide cards instead: the art IS the row. */}
    <CardGrid size={banner ? 'l' : 's'} sx={banner ? { gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))' } : { rowGap: 0.5 }}>
      {rows.map((entry) => {
        if (!banner) {
          return <Stack key={entry.id} direction={'row'} gap={1} alignItems={'center'} sx={{ py: 0.4 }}>
            <EntityIcon node={entry.node} size={32}/>
            <Link
              {...linkProps(hrefFor, entry.id)}
              variant={'body2'}
              textAlign={'left'}
              onClick={navigateOnPlainClick(onNavigate, entry.id, Boolean(hrefFor?.(entry.id)))}
            >
              {entry.label}<Disambig entry={entry} band={heading}/>
            </Link>
          </Stack>;
        }
        const link = { href: hrefFor?.(entry.id), onClick: navigateOnPlainClick(onNavigate, entry.id, true), prefetch: false };
        return entry.node.petMart || entry.node.starterOffer
          ? <PetMartCard key={entry.id} entry={entry} {...link}/>
          : <ItemCard key={entry.id} {...link} title={<>{entry.label}<Disambig entry={entry} band={heading}/></>}>
            <Box component={'img'} src={entry.node.icon} alt={''} sx={{ display: 'block', width: '100%', height: 'auto', borderRadius: 0.5 }}/>
          </ItemCard>;
      })}
    </CardGrid>

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
  // One locale, so the order is the same on the build machine and every visitor's.
  all.sort((a, b) => (ordered ? a.order - b.order : a.label.localeCompare(b.label, 'en')));

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
  // A banner is the row itself, and a table cell would shrink it to nothing, so the banner kinds keep their cards.
  const table = columns.length > 0 && !BANNER_KINDS.has(kind);
  // From the whole list, not the filtered view: the columns don't come and go as a reader types.
  const rooms = table ? listingRooms({ columns, entries: all, labelOf, sort: sorted ? sort : null }) : null;

  // The toolbar's state is this listing's own: filter and category stay in useState (nothing is remembered),
  // and the sort stays in the URL through onSortChange.
  const plural = pluralInSentence(KIND_PLURALS[kind] || kind);
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
    .map((column) => [column.key, column.label, firstOrder({ numeric: isNumericColumn(column) }), !isNumericColumn(column)]);

  // The container the table's columns and the Sort below read: the width beside the rail, not the window's.
  return <Stack gap={2} sx={table ? { containerType: 'inline-size' } : undefined}>
    <CategoryHeader kind={kind} count={all.length}/>

    <Toolbar state={toolbar} defaults={TOOLBAR_DEFAULTS} onChange={onToolbarChange} onReset={() => onToolbarChange(TOOLBAR_DEFAULTS)}
             total={all.length} shown={matches.length} noun={plural} onStickyBottom={setToolbarBottom}>
      <Toolbar.Search placeholder={`Search ${plural}`}/>
      {categories.length > 1 ? <Toolbar.Show options={[
        ['', `All ${plural}`, all.length],
        ...categories.map((name) => [name, labelOf(name), counts[name]])
      ]}/> : null}
      {/* Headers sort a table once they all show; before that, and on cards, the select is the only way to sort them all. */}
      {columns.length > 0 ? <Toolbar.Sort options={sortOptions} sx={table ? { [`@container (min-width:${rooms.everyColumn}px)`]: { display: 'none' } } : undefined}/> : null}
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
      stickyTop={toolbarBottom}
      rooms={rooms}
    /> : bands.map((band) => <Band
      key={band.key}
      band={band}
      onNavigate={onNavigate}
      hrefFor={hrefFor}
      banner={BANNER_KINDS.has(kind)}
      labelOf={labelOf}
    />)}
  </Stack>;
};

export default EntityList;

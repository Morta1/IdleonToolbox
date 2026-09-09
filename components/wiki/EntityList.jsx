import React, { useState } from 'react';
import { Box, Chip, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { EntityIcon, KIND_PLURALS } from './EntityPanel';
import CategoryHeader from './CategoryHeader';
import { SECTION_ORDER, chooseGrouping, groupEntries } from '@utility/wiki/grouping';
import { cleanUnderscore, prefix } from '@utility/helpers';

// A facet is only offered as a FILTER when the data has one worth offering. Maps divide into seven
// worlds and monsters into five kinds, so those become chips. Items have 112 distinct categories,
// which is a select, not a chip row.
// Matched to FACET_MAX: anything that earns a band earns a chip. The bestiary is eleven sections,
// seven worlds plus Bosses, Events, Dungeon and The Rift, and a select would hide all of them.
const CHIP_LIMIT = 12;

// A Pet Mart pack has no banner: the game keeps its record in data instead of drawing it into art.
// So the card draws what the banner beside it would have shown - the pet, what it is called, the
// price and both currencies - rather than leaving a sprite alone in a banner-sized box.
const Currency = ({ amount, isCrystal }) => <Stack direction={'row'} gap={0.5} alignItems={'center'}>
  <Box
    component={'img'}
    src={`${prefix}data/PremiumGem.png`}
    alt={''}
    sx={{ width: 14, height: 14, objectFit: 'contain', filter: isCrystal ? 'hue-rotate(280deg)' : 'none' }}
  />
  <Typography variant={'caption'} color={'text.secondary'}>{amount.toLocaleString('en-US')}</Typography>
</Stack>;

const PetMartCard = ({ entry }) => <Stack direction={'row'} gap={1.5} alignItems={'center'}>
  <Box
    component={'img'}
    src={entry.node.icon}
    alt={''}
    sx={{ height: 84, width: 84, objectFit: 'contain', flexShrink: 0 }}
  />
  <Stack gap={0.25} sx={{ minWidth: 0 }}>
    <Typography variant={'body2'} fontWeight={600}>{entry.label}</Typography>
    {entry.node.petName ? <Typography variant={'caption'} color={'text.secondary'}>
      {cleanUnderscore(entry.node.petName)}
    </Typography> : null}
    <Stack direction={'row'} gap={1.5} alignItems={'center'} flexWrap={'wrap'} sx={{ mt: 0.25 }}>
      {entry.node.price > 0
        ? <Typography variant={'caption'} fontWeight={600}>${entry.node.price.toFixed(2)}</Typography>
        : null}
      {entry.node.gems > 0 ? <Currency amount={entry.node.gems}/> : null}
      {entry.node.petCrystals > 0 ? <Currency amount={entry.node.petCrystals} isCrystal/> : null}
    </Stack>
  </Stack>
</Stack>;

// Bands replace paging. A band is a page: the whole category renders, but broken into runs a
// reader can place themselves in, which is what the flat 100-per-page list never gave them.
// Items is 2,431 rows, so a band past this size collapses until asked for rather than putting
// every image on the page at once.
const BAND_PREVIEW = 60;

// How far past the preview a band may run before collapsing is worth it. World 1's achievements are
// 63, which hid three of them behind a "Show 3 more" link: the link cost more attention than the
// three rows it saved. A band only collapses when doing so actually shortens the page.
const BAND_SLACK = 20;

// Theme colours, cycled, so a facet band is identifiable before it is read. Not a new palette:
// these are the MUI dark palette's own, which is what the rest of the wiki already uses.
// The kinds whose art is a banner rather than an icon, and so are laid out two to a row.
const BANNER_KINDS = new Set(['bundle', 'world']);

const BAND_COLOURS = ['primary.main', 'warning.light', 'info.light', 'success.light', 'secondary.light', 'error.light'];

// The rows are real anchors so the exported HTML carries every link, and so middle-click,
// copy-link and modified clicks all behave. A plain click still goes through the router, which
// keeps the session query (demo, profile) on the URL.
const linkProps = (hrefFor, id) => {
  const href = hrefFor?.(id);
  return href ? { href } : { component: 'button', type: 'button' };
};

const navigateOnPlainClick = (onNavigate, id) => (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  onNavigate(id);
};

const Band = ({ band, colour, index, onNavigate, hrefFor, banner }) => {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded || band.entries.length <= BAND_PREVIEW + BAND_SLACK
    ? band.entries
    : band.entries.slice(0, BAND_PREVIEW);
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
        onClick={navigateOnPlainClick(onNavigate, entry.id)}
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
          '&:hover': { borderColor: 'text.disabled' }
        }}
      >
        {entry.node.petMart ? <PetMartCard entry={entry}/> : <>
          <Box
            component={'img'}
            src={entry.node.icon}
            alt={''}
            sx={{ width: '100%', height: 'auto', borderRadius: 0.5 }}
          />
          <Typography variant={'body2'} fontWeight={600}>{entry.label}</Typography>
        </>}
      </Stack> : <Stack key={entry.id} direction={'row'} gap={1} alignItems={'center'} sx={{ py: 0.4 }}>
        <EntityIcon node={entry.node} size={32}/>
        <Link
          {...linkProps(hrefFor, entry.id)}
          variant={'body2'}
          underline={'hover'}
          textAlign={'left'}
          onClick={navigateOnPlainClick(onNavigate, entry.id)}
        >
          {entry.label}
        </Link>
      </Stack>))}
    </Box>

    {/* The rows a collapsed band hides still have to reach the export: this listing is the only
        path a crawler has to them. Text-only anchors, no icons, so a 2,400-row category does not
        request 2,400 images for a block nobody sees. Removed once the band expands. */}
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
      Show {hidden.toLocaleString('en-US')} more in {cleanUnderscore(band.label)}
    </Link> : null}
  </Stack>;
};

const EntityList = ({ index, kind, onNavigate, onBack, hrefFor }) => {
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
  const named = [...new Set(all.map(facetOf).filter(Boolean))];
  // Where the entries carry the game's own order the bands follow it, so the picker has to as
  // well: `all` is already sorted by it, which makes first-appearance the right sequence. Sorting
  // these alphabetically would open the talent picker on Arcane Cultist and bury Beginner.
  const categories = ordered ? named : named.sort((a, b) => (
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
  //
  // Talents raise the band ceiling because their facet is the game's own tab structure: 27 classes
  // of about fifteen talents each is how a player already thinks of them, and a flat A-Z of 376
  // names is the thing that would be unreadable.
  //
  // Bundles raise the dominance ceiling for a different reason: the gem shop packs outnumber the
  // Pet Mart ones three to one, which reads as an uneven tail to the ratio, but they are two
  // separate shops selling two different things and a reader browsing one is not browsing the other.
  const chosen = chooseGrouping(all.map(facetOf), {
    ...(byWorld ? { missingMax: 1 } : {}),
    ...(kind === 'talent' ? { facetMax: 40 } : {}),
    ...(kind === 'bundle' ? { dominance: 1 } : {})
  });
  const mode = chosen;
  // Filtering to one facet already answers "which ones", so cutting that answer into A to Z adds a
  // dozen headers and no information: the reader picked World 3, not the letter B.
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
      hrefFor={hrefFor}
      banner={BANNER_KINDS.has(kind)}
    />)}
  </Stack>;
};

export default EntityList;

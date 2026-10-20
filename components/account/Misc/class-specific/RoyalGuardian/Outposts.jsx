import React, { useDeferredValue, useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import {
  Box,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import { notateNumber, prefix } from '@utility/helpers';
import { monsterImage } from '@utility/spriteImages';
import { CardTitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import useCheckbox from '@components/common/useCheckbox';
import InfoIcon from '@mui/icons-material/Info';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import KingdomMap from './KingdomMap';
import { formatEta } from './formatEta';
import { OUTPOST_RANK_NAMES } from '@parsers/class-specific/royalGuardian';

const ALL_WORLDS = 'all';
const ALL_GLORIFIED = 'all';
// Rank sorts are keyed 'rank<type>', the index into each outpost's rankBars.
const RANK_SORT_PREFIX = 'rank';
const NO_RANK_FILTER = -1;
// Ranks are whole numbers from 0; an empty or unreadable Min/Max box leaves that side of the range open.
const parseRankBound = (text) => {
  const value = Number(text);
  return text === '' || !isFinite(value) ? null : Math.max(0, Math.round(value));
};
const formatRankRange = (min, max) => {
  if (min == null && max == null) return 'any';
  if (max == null) return `${min}+`;
  if (min == null) return `up to ${max}`;
  return min === max ? `${min}` : `${min} to ${max}`;
};

// Indexed by RoyalMaps[10]: Resource Depot, Support Camp, Savage Stronghold.
const MODE_COLOR = ['text.secondary', 'info.main', 'error.main'];
const OUTPOST_MODE_LABELS = ['Resource Depot', 'Support Camp', 'Savage Stronghold'];

// A slot holds a unit type index; anything below zero is the game's empty marker ('1', or a slot
// past the end of the packed string).
const isEmptySlot = (unit) => !(unit >= 0);

// A support camp stores the map index it feeds, not a name.
const mapNameOf = (outposts, mapIndex) =>
  outposts?.find((outpost) => outpost.mapIndex === mapIndex)?.name || `map ${mapIndex}`;

// The game has no per-unit image asset: it draws each unit as a glyph of bitmap font 784, so these
// were cut out of that atlas ('{' '}' '[' ']', in unit-type order) into public/etc, which holds
// the site's own assets: public/data is the untouched game dump.
const UnitIcon = ({ unit, height = 34 }) => (
  <img src={`${prefix}etc/RGunit${unit}.png`} alt="" height={height}
       style={{ height, width: 'auto' }}/>
);

// A map name alone is hard to place, its monster is not, so the card leads with the monster's
// portrait. Maps with nothing to idle on have no monster and keep the plain name.
const MapTitle = ({ name, mapIndex, monsterRawName, monsterName }) => (
  <Stack direction="row" gap={1} alignItems="center">
    {monsterRawName
      // The face icon is a tight crop; a static frame keeps the game's padding (Green Mushroom fills
      // a fifth of it). Nodes (ores, fish) have no face and fall back to their static frame.
      // The Rift's target has no sprite at all.
      ? <img src={monsterImage(monsterRawName, 'face')} alt={monsterName ?? ''}
             onError={(e) => { e.target.style.display = 'none'; }}
             style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }}/>
      : null}
    <Typography>{name || `Map ${mapIndex}`}</Typography>
  </Stack>
);

// The meta line names the monster, unless it only repeats the map name (The Rift).
const monsterLabel = (name, monsterName) => (monsterName && monsterName !== name ? monsterName : null);

// Typing keeps its text local and hands the page a settled value, so a keystroke re-renders this box
// instead of every outpost card.
const RankBoundField = ({ label, disabled, onSettled }) => {
  const [text, setText] = useState('');
  const [settled] = useDebouncedValue(text, 250);
  useEffect(() => onSettled(settled), [settled, onSettled]);
  return (
    <TextField size="small" label={label} type="number" value={text} disabled={disabled}
               onChange={(e) => setText(e.target.value)} sx={{ width: 80 }}
               slotProps={{ htmlInput: { min: 0, step: 1 } }}/>
  );
};

const ClearingCard = ({ clearingMap: {
  mapIndex, name, world: mapWorld, kills, killsRequired, progress, militiaUnits, militiaRate, hoursToClear,
  monsterRawName, monsterName
}, clearingHint }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <MapTitle name={name} mapIndex={mapIndex} monsterRawName={monsterRawName} monsterName={monsterName}/>
      <Stack direction="row" gap={0.5} alignItems="center">
        <Typography variant="caption" color="text.secondary">
          {`W${mapWorld} · `}
          {monsterLabel(name, monsterName) ? `${monsterLabel(name, monsterName)} · ` : ''}
          <Box component="span" sx={{ color: 'warning.main' }}>Clearing</Box>
        </Typography>
        <Tooltip title={clearingHint}>
          <InfoIcon sx={{ fontSize: 14, opacity: 0.7 }}/>
        </Tooltip>
      </Stack>

      <Divider sx={{ my: 1 }}/>

      <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
        <Typography variant="body2">
          {progress >= 1 ? 'Ready to claim' : `${Math.floor(100 * progress)}% cleared`}
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
          {notateNumber(kills, 'Big')} / {notateNumber(killsRequired, 'Big')}
        </Typography>
      </Stack>
      <LinearProgress variant="determinate" value={100 * Math.min(1, progress)}
                      color={progress >= 1 ? 'success' : 'primary'}
                      sx={{ height: 6, borderRadius: 3, mt: 0.5 }}/>
      <Typography variant="caption" sx={{ mt: 1 }}>
        {militiaUnits > 0
          ? `${militiaUnits} Clearing unit${militiaUnits > 1 ? 's' : ''} · ${notateNumber(militiaRate, 'Big')}/hr`
          : 'No Clearing units sent here'}
        {progress < 1 && hoursToClear != null
          ? hoursToClear <= 0 ? ' · ready once you open the map' : ` · clears in ${formatEta(hoursToClear)}`
          : ''}
      </Typography>
    </CardContent>
  </Card>
);

// A card re-renders only when its own props change, so a filter change does not redraw every card.
const OutpostCard = ({ outpost, outposts, outpostStats, highlightRank }) => {
  const unitNames = outpostStats?.unitNames ?? [];
  const {
    mapIndex, name, world: outpostWorld, resourceRate, range, ptsLeft, ptsTotal, mode, modeName,
    purified, boosted, isSupport, supportLinks, supports, rankBars, upgrades, unitSlots, passiveUnits,
    connectedNodes, monsterRawName, monsterName
  } = outpost;
  // Naming every linked outpost overflows the meta line, so only a single link is named.
  const boosting = [...new Set(supportLinks ?? [])];
  const supportText = isSupport && boosting.length > 0
    ? (boosting.length === 1
      ? `Boosting ${mapNameOf(outposts, boosting[0])}`
      : `Boosting ${boosting.length} outposts`)
    : supports > 0
      ? `Boosted by ${supports} support camp${supports > 1 ? 's' : ''}`
      : '';
  const modeHint = mode === 1
    ? 'Collects nothing itself. Boosts the collection rate and rank EXP of the outpost it is linked to.'
    : mode === 2
      ? `Banks nothing. Piles ${notateNumber(outpostStats?.savageMulti ?? 5, 'MultiplierInfo')}x what it collects into its own resource nodes instead.`
      : 'Collects its nodes straight into your resource storage.';

  return (
    // Glorified is the one outpost state worth spotting across a whole grid, so it gets a border
    // rather than another word in the meta line.
    <Card sx={{
      height: '100%',
      ...(boosted ? { border: '2px solid', borderColor: 'success.main' } : {})
    }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <MapTitle name={name} mapIndex={mapIndex} monsterRawName={monsterRawName} monsterName={monsterName}/>
        <Stack direction="row" gap={0.5} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {`W${outpostWorld}`}
            {monsterLabel(name, monsterName) ? ` · ${monsterLabel(name, monsterName)}` : ''}
            {' \u00b7 '}
            <Box component="span" sx={{ color: MODE_COLOR[mode] ?? MODE_COLOR[0] }}>{modeName}</Box>
            {supportText ? ` \u00b7 ${supportText}` : ''}
            {purified ? ' \u00b7 Purified' : ''}
            {boosted ? ' \u00b7 Glorified' : ''}
          </Typography>
          <Tooltip title={modeHint}>
            <InfoIcon sx={{ fontSize: 14, opacity: 0.7 }}/>
          </Tooltip>
        </Stack>

        <Divider sx={{ my: 1 }}/>

        <Stack direction="row" divider={<Divider orientation="vertical" flexItem/>}>
          {[
            { label: 'Rate', value: `${notateNumber(resourceRate, 'Big')}/hr` },
            { label: 'Range', value: `${range}px` },
            { label: 'PTS', value: `${ptsLeft} / ${ptsTotal}` }
          ].map(({ label, value }, statIndex) => (
            <Stack key={label} direction="column" sx={{ flex: 1, pl: statIndex === 0 ? 0 : 1.5 }}>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>{label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
            </Stack>
          ))}
        </Stack>

        <Divider sx={{ my: 1 }}/>

        <Stack direction="column" gap={0.5}>
          {rankBars?.map((bar) => {
            // The rank the filter is on stands out on every card, so its level reads at a glance.
            const isFilteredRank = bar.type === highlightRank;
            return (
            <Stack key={bar.type} direction="column" sx={{
              opacity: bar.unlocked ? 1 : 0.4,
              ...(isFilteredRank ? {
                color: 'primary.main',
                bgcolor: 'action.selected',
                borderRadius: 1,
                mx: -0.75,
                px: 0.75,
                py: 0.25,
                '& .MuiTypography-root': { fontWeight: 600 }
              } : {})
            }}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
                <Typography variant="body2">
                  {bar.name} rank {bar.rank}
                  {bar.expPerHour > 0
                    ? <Box component="span" sx={{ opacity: 0.7 }}>{` \u00b7 ${formatEta(bar.hoursToNextRank)}`}</Box>
                    : null}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                  {notateNumber(bar.exp, 'Big')} / {notateNumber(bar.required, 'Big')}
                </Typography>
              </Stack>
              <LinearProgress variant="determinate" value={100 * (bar.progress ?? 0)}
                              sx={{ height: 6, borderRadius: 3 }}/>
            </Stack>
            );
          })}
        </Stack>

        <Divider sx={{ my: 1 }}/>

        <Stack direction="column" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 0.75 }}>Units</Typography>
          <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="center">
            {unitSlots?.map((unit, slot) => (
              <Tooltip key={slot} title={isEmptySlot(unit) ? 'Empty slot' : (unitNames[unit] ?? `Type ${unit}`)}>
                <Stack alignItems="center" justifyContent="center" sx={{
                  width: 42,
                  height: 46,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderStyle: isEmptySlot(unit) ? 'dashed' : 'solid'
                }}>
                  {isEmptySlot(unit) ? null : <UnitIcon unit={unit}/>}
                </Stack>
              </Tooltip>
            ))}
          </Stack>
          {passiveUnits?.some((count) => count > 0)
            ? <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center" sx={{ mt: 1 }}>
              <Stack direction="row" gap={0.5} alignItems="center">
                <Typography variant="body2">Stationary</Typography>
                <Tooltip title="Stationary units granted by Command rank and Glorification. They take no slot.">
                  <InfoIcon sx={{ fontSize: 14, opacity: 0.7 }}/>
                </Tooltip>
              </Stack>
              {passiveUnits.map((count, type) => (count > 0
                ? <Stack key={type} direction="row" gap={0.5} alignItems="center">
                  <UnitIcon unit={type} height={26}/>
                  <Typography variant="body2">x{count}</Typography>
                </Stack>
                : null))}
            </Stack>
            : null}
        </Stack>

        <Divider sx={{ mb: 1, mt: 'auto' }}/>

        <Stack direction="column" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 0.75 }}>
            Connected resources
          </Typography>
          {connectedNodes?.length > 0
            ? <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" sx={{ minHeight: 38 }}>
              {connectedNodes.map((node) => (
                <Tooltip key={node.index}
                         title={node.exhausted
                           ? `Node ${node.index}: empty, it pays nothing until a restock refills it`
                           : `Node ${node.index}: ${notateNumber(node.collected, 'Big')} / ${notateNumber(node.maxQuantity, 'Big')} collected`}>
                  <Stack alignItems="center" justifyContent="center" sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: node.exhausted ? 'warning.main' : 'divider'
                  }}>
                    <img src={`${prefix}data/${node.rawName}.png`} alt="" width={26} height={26}/>
                  </Stack>
                </Tooltip>
              ))}
            </Stack>
            : <Stack justifyContent="center" sx={{ minHeight: 38 }}>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                This output is not connected to any resource
              </Typography>
            </Stack>}
        </Stack>

        <Divider sx={{ mb: 1 }}/>

        <Stack direction="column" gap={1.5}>
          {upgrades?.map((upgrade) => (
            <Stack key={upgrade.index} direction="column" gap={0.25}>
              <Stack direction="row" gap={1} alignItems="baseline" justifyContent="space-between">
                <Stack direction="row" gap={0.75} alignItems="baseline">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{upgrade.name}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>Lv{upgrade.level}</Typography>
                </Stack>
                <Typography variant="caption" sx={{ whiteSpace: 'nowrap', opacity: 0.7 }}>
                  {upgrade.unlocked ? `${upgrade.cost} PTS` : 'Locked'}
                </Typography>
              </Stack>
              <Stack direction="row" gap={1.5} flexWrap="wrap">
                {upgrade.effects?.map((effect) => (
                  <Typography key={effect.label} variant="caption">
                    <Box component="span" sx={{ fontWeight: 700 }}>{effect.value}</Box>
                    {` ${effect.label}`}
                  </Typography>
                ))}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

const Outposts = ({ outposts, outpostStats, resources, clearingMaps, activeKillClear }) => {
  const [sortBy, setSortBy] = useState('map');
  const [world, setWorld] = useState(ALL_WORLDS);
  const [searchText, setSearchText] = useState('');
  const [glorified, setGlorified] = useState(ALL_GLORIFIED);
  const [GroupEl, groupByWorld] = useCheckbox('Group by world');
  const [view, setView] = useState('cards');
  const [rankFilter, setRankFilter] = useState(NO_RANK_FILTER);
  const [rankMin, setRankMin] = useState('');
  const [rankMax, setRankMax] = useState('');
  // Clearing the rank also clears Min/Max: remounting the boxes drops their text, so old bounds
  // can't silently return when a rank is picked again.
  const [boundsKey, setBoundsKey] = useState(0);
  // The cards follow these a beat behind the controls, so the select and search box stay responsive.
  const deferredRankFilter = useDeferredValue(rankFilter);
  const deferredSearchText = useDeferredValue(searchText);
  const isRankFiltered = deferredRankFilter !== NO_RANK_FILTER;
  // Min above Max is read as the same range typed the other way round.
  const [minRank, maxRank] = [parseRankBound(rankMin), parseRankBound(rankMax)]
    .sort((a, b) => (a == null || b == null ? 0 : a - b));

  const changeRankFilter = (next) => {
    setRankFilter(next);
    if (next === NO_RANK_FILTER) {
      setRankMin('');
      setRankMax('');
      setBoundsKey((key) => key + 1);
    }
  };

  const list = outposts ?? [];
  const unitNames = outpostStats?.unitNames ?? [];
  // A map still being cleared has no outpost yet, only its kill counter, but it belongs next to the
  // outposts of its world: finishing the clear is what turns it into one.
  const clearing = (clearingMaps ?? []).map((clearingMap) => ({ ...clearingMap, isClearing: true }));
  const cards = [...list, ...clearing];
  const worlds = [...new Set(cards.map(({ world: outpostWorld }) => outpostWorld))].sort((a, b) => a - b);

  const query = deferredSearchText.toLowerCase().trim();
  const otherFiltered = cards.filter((outpost) => {
    if (world !== ALL_WORLDS && outpost.world !== world) return false;
    // A clearing map is not an outpost yet, so it is neither glorified nor unglorified.
    if (glorified !== ALL_GLORIFIED && (outpost.isClearing || outpost.boosted !== (glorified === 'yes'))) return false;
    if (!query) return true;
    return [outpost.name, outpost.monsterName].some((text) => text?.toLowerCase().includes(query));
  });
  // A clearing map has no ranks yet, so a rank filter hides it.
  const rankCandidates = isRankFiltered ? otherFiltered.filter(({ isClearing }) => !isClearing) : otherFiltered;
  const filtered = !isRankFiltered ? rankCandidates : rankCandidates.filter(({ rankBars }) => {
    const rank = rankBars?.[deferredRankFilter]?.rank ?? 0;
    return (minRank == null || rank >= minRank) && (maxRank == null || rank <= maxRank);
  });

  const sorted = [...filtered].sort((a, b) => {
    // None of the outpost stats exist on a clearing map, so those sorts push them to the end.
    if (sortBy !== 'map' && a.isClearing !== b.isClearing) return a.isClearing ? 1 : -1;
    if (sortBy === 'rate') return (b.resourceRate || 0) - (a.resourceRate || 0);
    if (sortBy === 'range') return (b.range || 0) - (a.range || 0);
    if (sortBy === 'pts') return (b.ptsLeft || 0) - (a.ptsLeft || 0);
    if (sortBy.startsWith(RANK_SORT_PREFIX)) {
      const type = Number(sortBy.slice(RANK_SORT_PREFIX.length));
      return (b.rankBars?.[type]?.rank || 0) - (a.rankBars?.[type]?.rank || 0) || a.mapIndex - b.mapIndex;
    }
    return a.mapIndex - b.mapIndex;
  });

  const groupedWorlds = [...new Set(sorted.map(({ world: outpostWorld }) => outpostWorld))]
    .sort((a, b) => a - b);

  const totalRate = list.reduce((sum, { resourceRate }) => sum + (resourceRate || 0), 0);
  const unspentPts = list.reduce((sum, { ptsLeft }) => sum + Math.max(0, ptsLeft || 0), 0);

  const clearingHint = activeKillClear > 0
    ? `The ETA counts your Clearing units only. Every kill your Royal Guardian lands here adds ${notateNumber(activeKillClear, 'Big')} more.`
    : 'The ETA counts your Clearing units only. Your own kills start counting once Solo Militia Status is bought in the armory.';

  const grid = (items) => (
    <Box sx={{
      display: 'grid',
      gap: 2,
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      alignItems: 'stretch'
    }}>
      {items.map((item) => (item.isClearing
        ? <ClearingCard key={item.mapIndex} clearingMap={item} clearingHint={clearingHint}/>
        : <OutpostCard key={item.mapIndex} outpost={item} outposts={outposts} outpostStats={outpostStats}
                       highlightRank={isRankFiltered ? deferredRankFilter : null}/>))}
    </Box>
  );

  return (
    <Stack direction="column" gap={4}>
      <Stack direction="row" gap={{ xs: 1, md: 3 }} flexWrap="wrap">
        <CardTitleAndValue title="Outposts Built" value={list.length}/>
        <CardTitleAndValue title="Total Collection Rate" value={`${notateNumber(totalRate, 'Big')}/hr`}/>
        <CardTitleAndValue title="Unspent PTS" value={unspentPts}/>
        <CardTitleAndValue title="Unit Types Unlocked"
                           value={`${outpostStats?.unitsUnlocked ?? 0} / ${unitNames.length}`}/>
        <CardTitleAndValue title="Worlds Unlocked" value={outpostStats?.worldsUnlocked ?? 0}/>
        {/* The game caps Support Camps and Savage Strongholds PER WORLD, so these stay the account's
            allowance: how many of them a given world spends is the world header's job, where the
            world is actually named. */}
        {[1, 2].map((modeIndex) => (
          <CardTitleAndValue key={modeIndex}
                             title={`${OUTPOST_MODE_LABELS[modeIndex]} / World`}
                             value={`${outpostStats?.typesAllowed?.[modeIndex] ?? 0} allowed`}/>
        ))}
      </Stack>

      <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
        {view === 'map' ? null : <>
        <FormControl size="small" sx={{ width: 200 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
            <MenuItem value="map">Map order</MenuItem>
            <MenuItem value="rate">Collection rate</MenuItem>
            <MenuItem value="range">Connection range</MenuItem>
            <MenuItem value="pts">Unspent PTS</MenuItem>
            {OUTPOST_RANK_NAMES.map((name, type) => <MenuItem key={name}
                                                              value={`${RANK_SORT_PREFIX}${type}`}>{name} rank</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 160 }}>
          <InputLabel>Glorified</InputLabel>
          <Select value={glorified} label="Glorified" onChange={(e) => setGlorified(e.target.value)}>
            <MenuItem value={ALL_GLORIFIED}>All</MenuItem>
            <MenuItem value="yes">Glorified</MenuItem>
            <MenuItem value="no">Unglorified</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 140 }}>
          <InputLabel>World</InputLabel>
          <Select value={world} label="World" onChange={(e) => setWorld(e.target.value)}>
            <MenuItem value={ALL_WORLDS}>All</MenuItem>
            {worlds.map((outpostWorld) => <MenuItem key={outpostWorld}
                                                    value={outpostWorld}>World {outpostWorld}</MenuItem>)}
          </Select>
        </FormControl>
        <Stack direction="row" gap={1}>
          <FormControl size="small" sx={{ width: 140 }}>
            <InputLabel>Rank</InputLabel>
            <Select value={rankFilter} label="Rank" onChange={(e) => changeRankFilter(e.target.value)}>
              <MenuItem value={NO_RANK_FILTER}>None</MenuItem>
              {OUTPOST_RANK_NAMES.map((name, type) => <MenuItem key={name} value={type}>{name}</MenuItem>)}
            </Select>
          </FormControl>
          <RankBoundField key={`min${boundsKey}`} label="Min" disabled={rankFilter === NO_RANK_FILTER}
                          onSettled={setRankMin}/>
          <RankBoundField key={`max${boundsKey}`} label="Max" disabled={rankFilter === NO_RANK_FILTER}
                          onSettled={setRankMax}/>
        </Stack>
        <TextField
          size="small"
          label="Search map or monster"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: 250 }}
        />
        <GroupEl/>
        </>}
        <ToggleButtonGroup exclusive size="small" value={view} sx={{ ml: 'auto' }}
                           onChange={(event, next) => next != null && setView(next)}>
          <ToggleButton value="cards">Cards</ToggleButton>
          <ToggleButton value="map">Map</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {view === 'map' ? <KingdomMap outposts={list} resources={resources}/> : null}

      {view === 'map' ? null : <>
      {isRankFiltered && rankCandidates.length > 0
        ? <Typography variant="body2" color="text.secondary" sx={{ mb: -2 }}>
          {`${sorted.length} of ${rankCandidates.length} outposts · ${OUTPOST_RANK_NAMES[deferredRankFilter]} rank ${formatRankRange(minRank, maxRank)}`}
        </Typography>
        : null}
      {sorted.length === 0
        ? <Typography>{cards.length === 0
          ? "No outposts built yet. Clear a map's kill requirement to claim it."
          : 'No outposts match these filters.'}</Typography>
        : null}

      {groupByWorld
        ? groupedWorlds.map((groupWorld) => {
          const inWorld = sorted.filter(({ world: outpostWorld }) => outpostWorld === groupWorld);
          const builtInWorld = inWorld.filter(({ isClearing }) => !isClearing).length;
          const usage = outpostStats?.typesUsedByWorld?.[groupWorld];
          // Every map of the world that can hold an outpost. A search or glorified filter makes the
          // numerator a subset, so the ratio is only honest while nothing is filtered out.
          const worldSlots = deferredSearchText || glorified !== ALL_GLORIFIED || isRankFiltered ? 0 : outpostStats?.slotsByWorld?.[groupWorld];
          return (
            <Stack key={groupWorld} direction="column" gap={1.5}>
              <Stack direction="row" gap={1.5} alignItems="baseline" flexWrap="wrap">
                <Typography variant="h6">World {groupWorld}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {builtInWorld}{worldSlots ? ` / ${worldSlots}` : ''} outpost{(worldSlots || builtInWorld) === 1 ? '' : 's'}
                  {usage
                    ? [1, 2].map((modeIndex) => ` \u00b7 ${OUTPOST_MODE_LABELS[modeIndex]} ${usage[modeIndex]} / ${outpostStats?.typesAllowed?.[modeIndex] ?? 0}`).join('')
                    : ''}
                </Typography>
              </Stack>
              <Divider/>
              {grid(inWorld)}
            </Stack>
          );
        })
        : grid(sorted)}
      </>}
    </Stack>
  );
};

export default Outposts;

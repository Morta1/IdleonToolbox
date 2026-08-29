import React, { useState } from 'react';
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
import { CardTitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import useCheckbox from '@components/common/useCheckbox';
import InfoIcon from '@mui/icons-material/Info';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import KingdomMap from './KingdomMap';

const ALL_WORLDS = 'all';

// Indexed by RoyalMaps[10]: Resource Depot, Support Camp, Savage Stronghold.
const MODE_COLOR = ['text.secondary', 'info.main', 'error.main'];
const OUTPOST_MODE_LABELS = ['Resource Depot', 'Support Camp', 'Savage Stronghold'];

// A slot holds a unit type index; anything below zero is the game's empty marker ('1', or a slot
// past the end of the packed string).
const isEmptySlot = (unit) => !(unit >= 0);

// Rank bars run from minutes to years apart, so a single unit reads badly across the whole range.
const formatEta = (hours) => {
  if (!(hours > 0)) return 'ready now';
  if (hours < 1) return `${Math.ceil(hours * 60)}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  const days = hours / 24;
  return days < 365 ? `${Math.round(days)}d` : `${Math.round(days / 365)}y`;
};

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

const Outposts = ({ outposts, outpostStats, resources }) => {
  const [sortBy, setSortBy] = useState('map');
  const [world, setWorld] = useState(ALL_WORLDS);
  const [searchText, setSearchText] = useState('');
  const [GroupEl, groupByWorld] = useCheckbox('Group by world');
  const [view, setView] = useState('cards');

  const list = outposts ?? [];
  const unitNames = outpostStats?.unitNames ?? [];
  const worlds = [...new Set(list.map(({ world: outpostWorld }) => outpostWorld))].sort((a, b) => a - b);

  const filtered = list.filter((outpost) => {
    if (world !== ALL_WORLDS && outpost.world !== world) return false;
    if (!searchText) return true;
    return outpost.name?.toLowerCase().includes(searchText.toLowerCase().trim());
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rate') return (b.resourceRate || 0) - (a.resourceRate || 0);
    if (sortBy === 'range') return (b.range || 0) - (a.range || 0);
    if (sortBy === 'pts') return (b.ptsLeft || 0) - (a.ptsLeft || 0);
    return a.mapIndex - b.mapIndex;
  });

  // The game caps Support Camps and Savage Strongholds PER WORLD, so a used/allowed pair only
  // means anything once a single world is picked.
  const worldUsage = world === ALL_WORLDS ? null : outpostStats?.typesUsedByWorld?.[world];

  const groupedWorlds = [...new Set(sorted.map(({ world: outpostWorld }) => outpostWorld))]
    .sort((a, b) => a - b);

  const totalRate = list.reduce((sum, { resourceRate }) => sum + (resourceRate || 0), 0);
  const unspentPts = list.reduce((sum, { ptsLeft }) => sum + Math.max(0, ptsLeft || 0), 0);

  // Shared by the flat list and the per-world groups.
  const renderOutpost = (outpost) => {
    const {
      mapIndex, name, world: outpostWorld, resourceRate, range, ptsLeft, ptsTotal, mode, modeName,
      purified, boosted, isSupport, supportLinks, supports, rankBars, upgrades, unitSlots, passiveUnits,
      connectedNodes
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
      <Card key={mapIndex} sx={{ height: '100%' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography>{name || `Map ${mapIndex}`}</Typography>
          <Stack direction="row" gap={0.5} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {`W${outpostWorld}`}
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
            {rankBars?.map((bar) => (
              <Stack key={bar.type} direction="column" sx={{ opacity: bar.unlocked ? 1 : 0.4 }}>
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
            ))}
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

  const grid = (items) => (
    <Box sx={{
      display: 'grid',
      gap: 2,
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      alignItems: 'stretch'
    }}>
      {items.map(renderOutpost)}
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
        {[1, 2].map((modeIndex) => (
          <CardTitleAndValue key={modeIndex}
                             title={`${OUTPOST_MODE_LABELS[modeIndex]} / World`}
                             value={worldUsage
                               ? `${worldUsage[modeIndex]} / ${outpostStats?.typesAllowed?.[modeIndex] ?? 0}`
                               : `${outpostStats?.typesAllowed?.[modeIndex] ?? 0} allowed`}/>
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
        <TextField
          size="small"
          label="Search by map name"
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
      {sorted.length === 0
        ? <Typography>No outposts built yet. Clear a map&apos;s kill requirement to claim it.</Typography>
        : null}

      {groupByWorld
        ? groupedWorlds.map((groupWorld) => {
          const inWorld = sorted.filter(({ world: outpostWorld }) => outpostWorld === groupWorld);
          const usage = outpostStats?.typesUsedByWorld?.[groupWorld];
          return (
            <Stack key={groupWorld} direction="column" gap={1.5}>
              <Stack direction="row" gap={1.5} alignItems="baseline" flexWrap="wrap">
                <Typography variant="h6">World {groupWorld}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {inWorld.length} outpost{inWorld.length === 1 ? '' : 's'}
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

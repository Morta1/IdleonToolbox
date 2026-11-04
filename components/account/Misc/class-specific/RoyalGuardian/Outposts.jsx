import React, { useContext, useDeferredValue, useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { Box, Stack, Typography } from '@mui/material';
import { formatDuration, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { monsterSprite } from '@utility/spriteImages';
import NumberField from '@components/common/NumberField';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import IconTile from '@components/common/cards/IconTile';
import StatTile from '@components/common/cards/StatTile';
import InfoButton from '@components/common/InfoButton';
import Notice from '@components/common/Notice';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { AppContext } from '@components/common/context/AppProvider';
import KingdomMap from './KingdomMap';
import { OUTPOST_RANK_NAMES } from '@parsers/class-specific/royalGuardian';

// A meta line's i keeps the line's last word beside it, so a wrapped meta never leaves the i alone on a line
const metaWithInfo = (text, info) => {
  const lastWordAt = text.lastIndexOf(' ') + 1;
  return <>{text.slice(0, lastWordAt)}<Box component={'span'} sx={{ whiteSpace: 'nowrap' }}>{text.slice(lastWordAt)}{info}</Box></>;
};

// Rank sorts are keyed 'rank<type>', the index into each outpost's rankBars.
const RANK_SORT_PREFIX = 'rank';
const NO_RANK = 'none';
// Map order unless a sort is picked. A saved checkbox from before resets once ("Group by world").
const OUTPOSTS_TOOLBAR = { search: '', sort: null, world: 'all', glorified: 'all', rank: NO_RANK, byWorld: false, view: 'cards' };
const SORT_VALUE = {
  rate: (outpost) => outpost.resourceRate || 0,
  range: (outpost) => outpost.range || 0,
  pts: (outpost) => outpost.ptsLeft || 0
};
// Ranks are whole numbers from 0; an empty or unreadable Min/Max box leaves that side of the range open.
const parseRankBound = (text) => {
  const value = Number(text);
  return text === '' || !isFinite(value) ? null : Math.max(0, Math.round(value));
};
const formatRankRange = (min, max) => {
  if (min == null && max == null) return 'any';
  if (max == null) return `${formatNum(min)}+`;
  if (min == null) return `up to ${formatNum(max)}`;
  return min === max ? formatNum(min) : `${formatNum(min)} to ${formatNum(max)}`;
};

const OUTPOST_MODE_LABELS = ['Resource Depot', 'Support Camp', 'Savage Stronghold'];

// A slot holds a unit type index; anything below zero is the game's empty marker ('1', or a slot
// past the end of the packed string).
const isEmptySlot = (unit) => !(unit >= 0);

// A support camp stores the map index it feeds, not a name.
const mapNameOf = (outposts, mapIndex) =>
  outposts?.find((outpost) => outpost.mapIndex === mapIndex)?.name || `map ${mapIndex}`;

// The meta line names the monster, unless it only repeats the map name (The Rift).
const monsterLabel = (name, monsterName) => (monsterName && monsterName !== name ? monsterName : null);

// A map name alone is hard to place, its monster is not, so the card leads with the monster's face. Maps with
// nothing to idle on have no monster and keep the plain name; the Rift's target has no art (GameIcon's box).
const faceOf = (monsterRawName) => (monsterRawName ? monsterSprite(monsterRawName, 'face') : undefined);

// Typing keeps its text local and hands the page a settled value, so a keystroke re-renders this box
// instead of every outpost card.
const RankBoundField = ({ label, onSettled }) => {
  const [value, setValue] = useState(null);
  const [settled] = useDebouncedValue(value, 250);
  useEffect(() => onSettled(settled == null ? '' : String(settled)), [settled, onSettled]);
  return <NumberField label={label} value={value} min={0} integer help={false} sx={{ width: 96 }} onChange={setValue}/>;
};

// The game has no per-unit image asset: it draws each unit as a glyph of bitmap font 784, so these
// were cut out of that atlas ('{' '}' '[' ']', in unit-type order) into public/etc, which holds
// the site's own assets: public/data is the untouched game dump.
const unitIcon = (unit) => `etc/RGunit${unit}.png`;

const clearingCard = ({ mapIndex, name, world, kills, killsRequired, progress, militiaUnits, militiaRate, hoursToClear,
  monsterRawName, monsterName }, clearingHint) => {
  const units = militiaUnits > 0
    ? `${formatNum(militiaUnits)} Clearing unit${militiaUnits > 1 ? 's' : ''} at ${formatGame(militiaRate ?? 0, 'RoyalG.OutpostKillsReq')}/hr`
    : 'No Clearing units sent here';
  const eta = progress < 1 && hoursToClear != null
    ? hoursToClear <= 0 ? ', ready once you open the map' : `, clears in ${formatDuration(hoursToClear * 3600)}`
    : '';
  return <ItemCard key={`clearing-${mapIndex}`} icon={faceOf(monsterRawName)} iconAlt={monsterName ?? ''}
                   title={name || `Map ${mapIndex}`}
                   meta={metaWithInfo([`World ${formatNum(world)}`, monsterLabel(name, monsterName), 'Clearing'].filter(Boolean).join(' · '),
                     <InfoButton label={'the clearing ETA'} sx={{ ml: 0.5 }}>{clearingHint}</InfoButton>)}>
    <ItemCard.Progress label={progress >= 1 ? 'Ready to claim' : `${formatNum(Math.floor(100 * progress))}% cleared`}
                       percent={100 * Math.min(1, progress ?? 0)}
                       value={formatGame(kills ?? 0, 'RoyalG.OutpostKillsReq', { whole: true })} max={formatGame(killsRequired ?? 0, 'RoyalG.OutpostKillsReq', { whole: true })}/>
    <Typography variant={'body2'} color={'text.secondary'}>{`${units}${eta}`}</Typography>
  </ItemCard>;
};

// sectionFailed: the section's note is the page's first element: no tile numbers, no Toolbar and no empty note here
const Outposts = ({ outposts, outpostStats, resources, clearingMaps, activeKillClear, sectionFailed }) => {
  const { state } = useContext(AppContext);
  const [view, setViewState, resetView] = useToolbarState('royal-armory-outposts', OUTPOSTS_TOOLBAR);
  const [rankMin, setRankMin] = useState('');
  const [rankMax, setRankMax] = useState('');
  // A rank change or a reset clears Min/Max (their boxes remount, keyed by the rank), so old bounds can't silently
  // return when a rank is picked again
  const setView = (patch) => {
    if (Object.hasOwn(patch, 'rank')) {
      setRankMin('');
      setRankMax('');
    }
    setViewState(patch);
  };
  const resetAll = () => {
    setRankMin('');
    setRankMax('');
    resetView();
  };
  // The cards follow these a beat behind the controls, so the select and search box stay responsive.
  const deferredRank = useDeferredValue(view?.rank ?? NO_RANK);
  const deferredSearchText = useDeferredValue(view?.search ?? '');
  const rankType = deferredRank === NO_RANK ? null : Number(deferredRank);
  const isRankFiltered = rankType != null;
  // Min above Max is read as the same range typed the other way round.
  const [minRank, maxRank] = [parseRankBound(rankMin), parseRankBound(rankMax)]
    .sort((a, b) => (a == null || b == null ? 0 : a - b));

  const list = outposts ?? [];
  const unitNames = outpostStats?.unitNames ?? [];
  // A map still being cleared has no outpost yet, only its kill counter, but it belongs next to the
  // outposts of its world: finishing the clear is what turns it into one.
  const clearing = (clearingMaps ?? []).map((clearingMap) => ({ ...clearingMap, isClearing: true }));
  const cards = [...list, ...clearing];
  const worlds = [...new Set(cards.map(({ world }) => world))].sort((a, b) => a - b);

  const query = deferredSearchText.toLowerCase().trim();
  const inWorld = (outpost) => view?.world === 'all' || `${outpost.world}` === view?.world;
  // A clearing map is not an outpost yet, so it is neither glorified nor unglorified.
  const inGlory = (outpost) => view?.glorified === 'all'
    || (!outpost.isClearing && Boolean(outpost.boosted) === (view?.glorified === 'yes'));
  const otherFiltered = cards.filter((outpost) => inWorld(outpost) && inGlory(outpost)
    && (!query || [outpost.name, outpost.monsterName].some((text) => text?.toLowerCase().includes(query))));
  // A clearing map has no ranks yet, so a rank filter hides it.
  const rankCandidates = isRankFiltered ? otherFiltered.filter(({ isClearing }) => !isClearing) : otherFiltered;
  const filtered = !isRankFiltered ? rankCandidates : rankCandidates.filter(({ rankBars }) => {
    const rank = rankBars?.[rankType]?.rank ?? 0;
    return (minRank == null || rank >= minRank) && (maxRank == null || rank <= maxRank);
  });

  const sortKey = view?.sort?.key;
  const direction = view?.sort?.order === 'asc' ? -1 : 1;
  const sorted = filtered.toSorted((a, b) => {
    // None of the outpost stats exist on a clearing map, so those sorts push them to the end.
    if (sortKey && a.isClearing !== b.isClearing) return a.isClearing ? 1 : -1;
    if (SORT_VALUE[sortKey]) return direction * (SORT_VALUE[sortKey](b) - SORT_VALUE[sortKey](a));
    if (sortKey?.startsWith(RANK_SORT_PREFIX)) {
      const type = Number(sortKey.slice(RANK_SORT_PREFIX.length));
      return direction * ((b.rankBars?.[type]?.rank || 0) - (a.rankBars?.[type]?.rank || 0)) || a.mapIndex - b.mapIndex;
    }
    return a.mapIndex - b.mapIndex;
  });

  const totalRate = list.reduce((sum, { resourceRate }) => sum + (resourceRate || 0), 0);
  const unspentPts = list.reduce((sum, { ptsLeft }) => sum + Math.max(0, ptsLeft || 0), 0);
  const shown = (value) => (sectionFailed ? '-' : value);

  const clearingHint = activeKillClear > 0
    ? `The ETA counts your Clearing units only. Every kill your Royal Guardian lands here adds ${formatGame(activeKillClear, 'RoyalG.OutpostKillsReq')} more.`
    : 'The ETA counts your Clearing units only. Your own kills start counting once Solo Militia Status is bought in the armory.';

  const outpostCard = (outpost) => {
    const {
      mapIndex, name, world, resourceRate, range, ptsLeft, ptsTotal, mode, modeName, purified, boosted, isSupport,
      supportLinks, supports, rankBars, upgrades, unitSlots, passiveUnits, connectedNodes, monsterRawName, monsterName
    } = outpost;
    // Naming every linked outpost overflows the meta line, so only a single link is named.
    const boosting = [...new Set(supportLinks ?? [])];
    const supportText = isSupport && boosting.length > 0
      ? (boosting.length === 1 ? `Boosting ${mapNameOf(outposts, boosting[0])}` : `Boosting ${formatNum(boosting.length)} outposts`)
      : supports > 0 ? `Boosted by ${formatNum(supports)} support camp${supports > 1 ? 's' : ''}` : '';
    const modeHint = mode === 1
      ? 'Collects nothing itself. Boosts the collection rate and rank EXP of the outpost it is linked to.'
      : mode === 2
        ? `Banks nothing. Piles ${formatNum(outpostStats?.savageMulti ?? 5, 'mult')} what it collects into its own resource nodes instead.`
        : 'Collects its nodes straight into your resource storage.';
    const meta = [`World ${formatNum(world)}`, monsterLabel(name, monsterName), modeName, supportText, purified ? 'Purified' : null]
      .filter(Boolean).join(' · ');
    return <ItemCard key={mapIndex} icon={faceOf(monsterRawName)} iconAlt={monsterName ?? ''} title={name || `Map ${mapIndex}`}
                     meta={metaWithInfo(meta, <InfoButton label={'this mode'} sx={{ ml: 0.5 }}>{modeHint}</InfoButton>)}
                     status={boosted ? 'active' : undefined} statusLabel={'Glorified'}>
      <ItemCard.Facts rows={[
        ['Collection rate', `${formatGame(resourceRate ?? 0, 'RoyalG.OutpostResourceRate')}/hr`],
        ['Range', `${formatGame(range ?? 0, 'RoyalG.OutpostRange')}px`],
        ['PTS', `${formatNum(ptsLeft ?? 0, 'whole')} / ${formatNum(ptsTotal ?? 0, 'whole')}`]
      ]}/>
      {(rankBars ?? []).map((bar) => {
        const time = !bar.unlocked ? ' · Locked' : bar.expPerHour > 0 ? ` · ${formatDuration((bar.hoursToNextRank ?? 0) * 3600)}` : '';
        // The rank a filter is on names its range in its label, so its level reads at a glance on every card
        const filteredRank = isRankFiltered && bar.type === rankType ? ` (filter: ${formatRankRange(minRank, maxRank)})` : '';
        return <ItemCard.Progress key={bar.type} label={`${bar.name} rank ${formatNum(bar.rank ?? 0)}${time}${filteredRank}`}
                                  percent={100 * (bar.progress ?? 0)}
                                  value={formatGame(bar.exp ?? 0, 'RoyalG.OutpostEXPreq', { whole: true })} max={formatGame(bar.required ?? 0, 'RoyalG.OutpostEXPreq', { whole: true })}/>;
      })}
      <ItemCard.Section label={'Units'}>
        <CardGrid size={'icon'}>
          {(unitSlots ?? []).map((unit, slot) => isEmptySlot(unit)
            ? <IconTile key={slot} status={'empty'} alt={'Empty slot'}/>
            : <IconTile key={slot} icon={unitIcon(unit)} alt={unitNames[unit] ?? `Type ${unit}`}
                        details={unitNames[unit] ?? `Type ${unit}`}/>)}
        </CardGrid>
        {passiveUnits?.some((count) => count > 0) ? <>
          <Stack direction={'row'} gap={0.5} alignItems={'center'}>
            <Typography variant={'body2'} color={'text.secondary'}>Stationary</Typography>
            <InfoButton label={'stationary units'}>Stationary units granted by Command rank and Glorification. They take no slot.</InfoButton>
          </Stack>
          <CardGrid size={'icon'}>
            {passiveUnits.map((count, type) => (count > 0
              ? <IconTile key={type} icon={unitIcon(type)} alt={unitNames[type] ?? `Type ${type}`} value={`x${formatNum(count)}`}
                          details={`${formatNum(count)} stationary ${unitNames[type] ?? `Type ${type}`}`}/>
              : null))}
          </CardGrid>
        </> : null}
      </ItemCard.Section>
      <ItemCard.Section label={'Connected resources'}>
        {connectedNodes?.length
          ? <CardGrid size={'icon'}>
            {connectedNodes.map((node) => <IconTile key={node.index} icon={`data/${node.rawName}.png`} alt={`Node ${node.index}`}
                                                    status={node.exhausted ? 'dim' : undefined}
                                                    details={node.exhausted
                                                      ? `Node ${node.index}: spent, it pays nothing until a restock refills it`
                                                      : `Node ${node.index}: ${formatGame(node.collected ?? 0, 'RoyalG.ArmoryUpgCost', { whole: true })} / ${formatGame(node.maxQuantity ?? 0, 'RoyalG.ArmoryUpgCost', { whole: true })} collected`}/>)}
          </CardGrid>
          : <Typography variant={'body2'} color={'text.secondary'}>Not connected to any resource</Typography>}
      </ItemCard.Section>
      {upgrades?.length ? <ItemCard.Section label={'Upgrades'}>
        {upgrades.map((upgrade) => <Stack key={upgrade.index} gap={0.25}>
          <ItemCard.Facts rows={[[`${upgrade.name} Lv ${formatNum(upgrade.level ?? 0)}`,
            upgrade.unlocked ? `${formatNum(upgrade.cost ?? 0, 'whole')} PTS` : 'Locked']]}/>
          {upgrade.effects?.length ? <Typography variant={'body2'} color={'text.secondary'}>
            {upgrade.effects.map((effect) => `${effect.value} ${effect.label}`).join(' · ')}
          </Typography> : null}
        </Stack>)}
      </ItemCard.Section> : null}
    </ItemCard>;
  };

  const grid = (items) => <CardGrid size={'m'}>
    {items.map((item) => (item.isClearing ? clearingCard(item, clearingHint) : outpostCard(item)))}
  </CardGrid>;
  const groupedWorlds = [...new Set(sorted.map(({ world }) => world))].sort((a, b) => a - b);
  const narrowed = Boolean(deferredSearchText) || view?.glorified !== 'all' || isRankFiltered;

  return (
    <Stack direction="column" gap={3}>
      <Stack direction="row" gap={2} flexWrap="wrap">
        {/* Outposts built is the page Summary's: one tile per number */}
        <StatTile label={'Collection rate'} value={shown(`${formatGame(totalRate, 'RoyalG.OutpostResourceRate')}/hr`)}/>
        <StatTile label={'Unspent PTS'} value={shown(formatNum(unspentPts, 'whole'))}/>
        <StatTile label={'Unit types unlocked'}
                  value={shown(`${formatNum(outpostStats?.unitsUnlocked ?? 0)} / ${formatNum(unitNames.length)}`)}/>
        <StatTile label={'Worlds unlocked'} value={shown(formatNum(outpostStats?.worldsUnlocked ?? 0))}/>
        {/* The game caps Support Camps and Savage Strongholds PER WORLD, so these stay the account's allowance: how many a
            given world spends is the world heading's job, where the world is named. */}
        {[1, 2].map((modeIndex) => <StatTile key={modeIndex} label={`${OUTPOST_MODE_LABELS[modeIndex]}s per world`}
                                             value={shown(`${formatNum(outpostStats?.typesAllowed?.[modeIndex] ?? 0)} allowed`)}/>)}
      </Stack>

      {sectionFailed ? null : cards.length === 0
        ? <Notice tone={state?.emptyAccount ? 'signin' : 'info'}>{state?.emptyAccount
          ? 'Your outposts show here once you sign in.'
          : 'No outposts built yet: clear a map\'s kill requirement to claim it.'}</Notice>
        : <Stack direction="column" gap={3}>
          <Toolbar state={view} defaults={OUTPOSTS_TOOLBAR} onChange={setView} onReset={resetAll}
                   total={cards.length} shown={sorted.length} noun={'outposts'}>
            {view?.view === 'map' ? null : <Toolbar.Search placeholder={'Search maps and monsters'}/>}
            {view?.view === 'map' ? null : <Toolbar.Sort options={[['rate', 'Collection rate', 'desc'], ['range', 'Connection range', 'desc'],
              ['pts', 'Unspent PTS', 'desc'], ...OUTPOST_RANK_NAMES.map((name, type) => [`${RANK_SORT_PREFIX}${type}`, `${name} rank`, 'desc'])]}/>}
            {view?.view === 'map' ? null : <Toolbar.Show name={'world'} label={'World'} options={[['all', 'All worlds', cards.length],
              ...worlds.map((world) => [`${world}`, `World ${world}`, cards.filter((outpost) => outpost.world === world).length])]}/>}
            {view?.view === 'map' ? null : <Toolbar.Show name={'glorified'} label={'Outpost'} options={[['all', 'All outposts', cards.length],
              ['yes', 'Glorified', list.filter(({ boosted }) => boosted).length], ['no', 'Not glorified', list.filter(({ boosted }) => !boosted).length]]}/>}
            {view?.view === 'map' ? null : <Toolbar.Show name={'rank'} label={'Rank'} options={[[NO_RANK, 'Any rank'],
              ...OUTPOST_RANK_NAMES.map((name, type) => [`${type}`, `${name} rank`])]}/>}
            {view?.view === 'map' ? null : <Toolbar.Filter name={'byWorld'} label={'By world'}/>}
            <Toolbar.View options={[['cards', 'Cards'], ['map', 'Map']]}/>
          </Toolbar>
          {view?.view !== 'map' && isRankFiltered ? <Stack direction={'row'} gap={2} alignItems={'flex-end'} flexWrap={'wrap'}>
            <Typography variant={'body2'} sx={{ minHeight: 40, display: 'flex', alignItems: 'center' }}>Rank range</Typography>
            <RankBoundField key={`min-${view?.rank}`} label={'Min'} onSettled={setRankMin}/>
            <RankBoundField key={`max-${view?.rank}`} label={'Max'} onSettled={setRankMax}/>
            {rankCandidates.length ? <Typography variant={'body2'} color={'text.secondary'} sx={{ minHeight: 40, display: 'flex', alignItems: 'center' }}>
              {`${formatNum(sorted.length)} of ${formatNum(rankCandidates.length)} outposts · ${OUTPOST_RANK_NAMES[rankType]} rank ${formatRankRange(minRank, maxRank)}`}
            </Typography> : null}
          </Stack> : null}
          {view?.view === 'map' ? <KingdomMap outposts={list} resources={resources}/>
            : view?.byWorld
              ? groupedWorlds.map((groupWorld) => {
                const ofWorld = sorted.filter(({ world }) => world === groupWorld);
                const builtInWorld = ofWorld.filter(({ isClearing }) => !isClearing).length;
                const usage = outpostStats?.typesUsedByWorld?.[groupWorld];
                // Every map of the world that can hold an outpost. A search or filter makes the numerator a subset, so
                // the ratio is only honest while nothing is filtered out.
                const worldSlots = narrowed ? 0 : outpostStats?.slotsByWorld?.[groupWorld];
                const count = `${formatNum(builtInWorld)}${worldSlots ? ` / ${formatNum(worldSlots)}` : ''} outpost${(worldSlots || builtInWorld) === 1 ? '' : 's'}`;
                return <Stack key={groupWorld} direction="column" gap={1.5}>
                  <Stack direction="row" columnGap={1.5} alignItems="baseline" flexWrap="wrap">
                    <Typography variant={'sectionTitle'} component={'h2'}>World {groupWorld}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {count}
                      {usage ? [1, 2].map((modeIndex) => ` · ${OUTPOST_MODE_LABELS[modeIndex]} ${formatNum(usage[modeIndex] ?? 0)} / ${formatNum(outpostStats?.typesAllowed?.[modeIndex] ?? 0)}`).join('') : ''}
                    </Typography>
                  </Stack>
                  {grid(ofWorld)}
                </Stack>;
              })
              : sorted.length ? grid(sorted) : null}
        </Stack>}
    </Stack>
  );
};

export default Outposts;

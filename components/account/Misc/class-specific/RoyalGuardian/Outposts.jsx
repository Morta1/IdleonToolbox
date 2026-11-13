import React, { useContext, useDeferredValue, useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { Box, Stack, Typography } from '@mui/material';
import GameIcon from '@components/common/GameIcon';
import { formatDuration, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { monsterSprite } from '@utility/spriteImages';
import NumberField from '@components/common/NumberField';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import IconTile from '@components/common/cards/IconTile';
import StatTile from '@components/common/cards/StatTile';
import InfoButton, { DottedValue, NoteTrigger } from '@components/common/InfoButton';
import WithLastWord from '@components/common/WithLastWord';
import Notice from '@components/common/Notice';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { AppContext } from '@components/common/context/AppProvider';
import KingdomMap from './KingdomMap';
import { OUTPOST_RANK_NAMES } from '@parsers/class-specific/royalGuardian';

// Rank sorts are keyed 'rank<type>', the index into each outpost's rankBars.
const RANK_SORT_PREFIX = 'rank';
const NO_RANK = 'none';
// Map order unless a sort is picked. A saved checkbox from before resets once ("Group by world").
const OUTPOSTS_TOOLBAR = { search: '', sort: null, world: 'all', glorified: 'all', rank: NO_RANK, byWorld: false, view: 'cards', details: false };
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

// A short amount with the game's exact one in a note, where the two differ (Meals' exactNote): the dotted underline says so
const exactOnTap = (short, exact) => (short === exact ? short : <DottedValue note={exact}>{short}</DottedValue>);
// The game prints a rate's every digit up to a billion ("330,759,269/hr"), which wrapped in a 300 px card's stat box
const rateValue = (rate) => exactOnTap(`${formatNum(rate ?? 0)}/hr`, `${formatGame(rate ?? 0, 'RoyalG.OutpostResourceRate')}/hr`);

// A unit slot: a 34 px box round its sprite, dashed when empty. Its name opens in a note on hover, a tap or Enter, as a
// tile's does: a title alone left a phone no way to read it
const SmallSlot = ({ sprite, name }) => <NoteTrigger note={name} label={name}>
  <Box sx={{
    width: 34, height: 34, borderRadius: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    border: 1, borderColor: 'divider', borderStyle: sprite ? 'solid' : 'dashed', bgcolor: 'background.default'
  }}>
    {sprite ? <GameIcon src={sprite} size={26} alt={''}/> : null}
  </Box>
</NoteTrigger>;

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
                   meta={<WithLastWord text={[`World ${formatNum(world)}`, monsterLabel(name, monsterName), 'Clearing'].filter(Boolean).join(' · ')}>
                     <InfoButton label={'the clearing ETA'} sx={{ ml: 0.5 }}>{clearingHint}</InfoButton>
                   </WithLastWord>}>
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
  // The rank a filter or a sort is on: a compact card keeps that one
  const focusedRank = isRankFiltered ? rankType : sortKey?.startsWith(RANK_SORT_PREFIX) ? Number(sortKey.slice(RANK_SORT_PREFIX.length)) : null;
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
      supportLinks, supports, rankBars, monsterRawName, monsterName
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
    // The time to the next rank in its two largest units, as every time left ("90d 8h": one unit misled), and the amounts
    // short with the exact ones on a tap, where the game's full digits ("1,489,106 / 2,811,100") ran onto a second line in a
    // 300 px card. A long time may still take the numbers under the label; the time is worth the line
    const rankBar = (bar) => {
      const time = !bar.unlocked ? ' · Locked' : bar.expPerHour > 0 ? ` · ${formatDuration((bar.hoursToNextRank ?? 0) * 3600)}` : '';
      // The rank a filter is on names its range in its label, so its level reads at a glance on every card
      const filteredRank = isRankFiltered && bar.type === rankType ? ` (filter: ${formatRankRange(minRank, maxRank)})` : '';
      return <ItemCard.Progress key={bar.type} label={`${bar.name} rank ${formatNum(bar.rank ?? 0)}${time}${filteredRank}`}
                                percent={100 * (bar.progress ?? 0)}
                                value={exactOnTap(formatNum(Math.floor(bar.exp ?? 0)), formatGame(bar.exp ?? 0, 'RoyalG.OutpostEXPreq', { ruleValue: bar.required ?? 0, whole: true }))}
                                max={exactOnTap(formatNum(Math.ceil(bar.required ?? 0)), formatGame(bar.required ?? 0, 'RoyalG.OutpostEXPreq', { whole: true }))}/>;
    };
    // A compact card keeps one rank: the one a filter or a sort is on, or else the next to rank up. The Details pill shows
    // all five in the game's order (Trade, Intel, Command, Military, Purity), so each sits where a player expects it on
    // every card, with range and points, units, connected resources and upgrades.
    const bars = rankBars ?? [];
    const keyBar = bars.find(({ type }) => type === focusedRank)
      ?? bars.filter((bar) => bar.unlocked && bar.expPerHour > 0).toSorted((a, b) => (a.hoursToNextRank ?? Infinity) - (b.hoursToNextRank ?? Infinity))[0]
      ?? bars[0];
    const details = Boolean(view?.details);
    return <ItemCard key={mapIndex} icon={faceOf(monsterRawName)} iconAlt={monsterName ?? ''} title={name || `Map ${mapIndex}`}
                     meta={<WithLastWord text={meta}><InfoButton label={'this mode'} sx={{ ml: 0.5 }}>{modeHint}</InfoButton></WithLastWord>}
                     status={boosted ? 'done' : undefined} statusLabel={'Glorified'}
                     more={outpostSections(outpost)}>
      {/* With Details, rate, range and points as one row of three, as the old card had them, not three fact rows */}
      {details ? <ItemCard.Stats cols={[
        ['Rate', rateValue(resourceRate)],
        ['Range', `${formatGame(range ?? 0, 'RoyalG.OutpostRange')}px`],
        ['PTS', `${formatNum(ptsLeft ?? 0, 'whole')} / ${formatNum(ptsTotal ?? 0, 'whole')}`]
      ]}/> : <ItemCard.Facts rows={[['Collection rate', rateValue(resourceRate)]]}/>}
      {details ? bars.map(rankBar) : keyBar ? rankBar(keyBar) : null}
    </ItemCard>;
  };

  // An outpost's units, connected resources and upgrades: the Details pill's part of its card
  const outpostSections = ({ upgrades, unitSlots, passiveUnits, connectedNodes }) => <>
      {/* The slots as small boxes in one row, and the stationary units as sprites with their counts on one line, as the old
          card had them: 72 px tiles took three rows for seven slots and another for the stationary ones (#16) */}
      <ItemCard.Section label={'Units'}>
        <Stack direction={'row'} gap={0.5} flexWrap={'wrap'}>
          {(unitSlots ?? []).map((unit, slot) => <SmallSlot key={slot} sprite={isEmptySlot(unit) ? null : unitIcon(unit)}
                                                            name={isEmptySlot(unit) ? 'Empty slot' : unitNames[unit] ?? `Type ${unit}`}/>)}
        </Stack>
        {passiveUnits?.some((count) => count > 0) ? <Stack direction={'row'} columnGap={1.5} rowGap={0.5} alignItems={'center'} flexWrap={'wrap'}>
          <Stack direction={'row'} gap={0.5} alignItems={'center'}>
            <Typography variant={'body2'} color={'text.secondary'}>Stationary</Typography>
            <InfoButton label={'stationary units'}>Stationary units granted by Command rank and Glorification. They take no slot.</InfoButton>
          </Stack>
          {passiveUnits.map((count, type) => (count > 0
            ? <NoteTrigger key={type} note={`${formatNum(count)} stationary ${unitNames[type] ?? `Type ${type}`}`}
                           label={`${formatNum(count)} stationary ${unitNames[type] ?? `Type ${type}`}`}>
              <Stack direction={'row'} gap={0.25} alignItems={'center'}>
                <GameIcon src={unitIcon(type)} size={24} alt={''}/>
                <Typography variant={'body2'} component={'span'}>x{formatNum(count)}</Typography>
              </Stack>
            </NoteTrigger>
            : null))}
        </Stack> : null}
      </ItemCard.Section>
      <ItemCard.Section label={'Connected resources'}>
        {connectedNodes?.length
          // Small tiles as the unit slots above, each keeping its note (collected / max) on a tap
          ? <CardGrid size={'icon'} fill={40}>
            {connectedNodes.map((node) => <IconTile key={node.index} icon={`data/${node.rawName}.png`} alt={`Node ${node.index}`}
                                                    height={40} iconSize={28}
                                                    status={node.exhausted ? 'dim' : undefined}
                                                    details={node.exhausted
                                                      ? `Node ${node.index}: spent, it pays nothing until a restock refills it`
                                                      : `Node ${node.index}: ${formatGame(node.collected ?? 0, 'RoyalG.ArmoryUpgCost', { whole: true })} / ${formatGame(node.maxQuantity ?? 0, 'RoyalG.ArmoryUpgCost', { whole: true })} collected`}/>)}
          </CardGrid>
          : <Typography variant={'body2'} color={'text.secondary'}>Not connected to any resource</Typography>}
      </ItemCard.Section>
      {upgrades?.length ? <ItemCard.Section label={'Upgrades'}>
        {/* As the old card: the name in bold with its level small beside it, the cost quiet at the right, and each effect's
            number in bold before its words, the effects side by side and wrapping whole */}
        {upgrades.map((upgrade) => <Stack key={upgrade.index} gap={0.25}>
          <Stack direction={'row'} justifyContent={'space-between'} alignItems={'baseline'} gap={1}>
            <Typography variant={'body2'} component={'div'} sx={{ fontWeight: 600 }}>
              {upgrade.name}{' '}
              <Typography variant={'caption'} component={'span'} color={'text.secondary'}>Lv{formatNum(upgrade.level ?? 0)}</Typography>
            </Typography>
            <Typography variant={'body2'} component={'div'} color={'text.secondary'} sx={{ whiteSpace: 'nowrap' }}>
              {upgrade.unlocked ? `${formatNum(upgrade.cost ?? 0, 'whole')} PTS` : 'Locked'}
            </Typography>
          </Stack>
          {upgrade.effects?.length ? <Stack direction={'row'} flexWrap={'wrap'} columnGap={1.5}>
            {upgrade.effects.map((effect, index) => <Typography key={index} variant={'body2'} component={'div'} color={'text.secondary'}>
              <Box component={'span'} sx={{ color: 'text.primary', fontWeight: 600 }}>{effect.value}</Box> {effect.label}
            </Typography>)}
          </Stack> : null}
        </Stack>)}
      </ItemCard.Section> : null}
    </>;

  // Every part of a card on its own grid row, level with the same part of the cards beside it, so rates and ranks read
  // across. Details: header, rate/range/PTS, a bar per rank, then units, connected resources and upgrades. Compact: header,
  // collection rate, one bar (a clearing map's three parts fit either)
  const alignRows = view?.details ? 2 + OUTPOST_RANK_NAMES.length + 3 : 3;
  const grid = (items) => <CardGrid size={'m'} details={view?.details} alignRows={alignRows}>
    {items.map((item) => (item.isClearing ? clearingCard(item, clearingHint) : outpostCard(item)))}
  </CardGrid>;
  const groupedWorlds = [...new Set(sorted.map(({ world }) => world))].sort((a, b) => a - b);
  const narrowed = Boolean(deferredSearchText) || view?.glorified !== 'all' || isRankFiltered;

  return (
    <Stack direction="column" gap={3}>
      <Stack direction="row" gap={1} flexWrap="wrap">
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
            {view?.view === 'map' ? null : <Toolbar.Filter name={'details'} label={'Details'} display/>}
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

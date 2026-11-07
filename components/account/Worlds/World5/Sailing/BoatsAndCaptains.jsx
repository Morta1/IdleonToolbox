import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import Timer from '../../../../common/Timer';
import Captain from './Captain';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { calcTotalBoatLevels } from '@parsers/world-5/sailing';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import Num from '@components/common/Num';
import InfoButton, { DottedValue } from '@components/common/InfoButton';
import StatusText from '@components/common/StatusText';
import Notice from '@components/common/Notice';
import { treasureIndex, treasureName } from './LootPile';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const BOATS_TOOLBAR = { details: false };

// A drawer headed with its trigger's own text
const withText = (breakdown, text) => (breakdown ? { ...breakdown, totalValue: text } : undefined);

// A chance as a percent, and "1 in N" only below 0.01%, never beside a 0%
const chanceText = (percent) => (percent <= 0 ? '0%' : percent >= 0.01 ? formatNum(percent, 'pct') : formatNum(percent / 100, 'odds'));

// The game draws chests, not names, so a tier is its sprite, named for a screen reader.
const ChestTiers = ({ tiers, noArtifactsLeft }) => <Stack gap={0.5}>
  <Typography variant={'groupLabel'} component={'div'}>Next chest from this boat</Typography>
  <DataTable
    fits
    rows={[...(tiers ?? [])].reverse()}
    rowKey={'tier'}
    columns={[
      { key: 'chest', label: 'Chest', render: ({ tier, rawName }) => <GameIcon src={`data/${rawName}.png`} alt={`Tier ${tier} chest`} size={24}/> },
      { key: 'odds', label: 'Odds', numeric: true, render: ({ chance }) => chanceText(100 * (chance ?? 0)) },
      { key: 'treasure', label: 'Treasure', numeric: true, render: ({ treasure }) => <Num value={treasure ?? 0} system={'Sailing'}/> },
      ...(noArtifactsLeft ? [] : [{ key: 'artifact', label: 'Artifact', numeric: true, render: ({ artifactChance }) => chanceText(artifactChance ?? 0) }])
    ]}
  />
</Stack>;

// Decision 5: the chest tiers open from the artifact chance on a click, a tap or Enter (a value with a dotted underline).
// The chance closes its section, so the note opens under the section and covers none of its values.
const nextChestSection = (chestOdds, artifactChance) => {
  const { tiers, expectedTreasure, expectedArtifactChance, noArtifactsLeft } = chestOdds ?? {};
  const chance = noArtifactsLeft ? 'None left' : chanceText(expectedArtifactChance ?? 0);
  const oddsText = `${formatGame(artifactChance?.rawValue ?? 1, 'Sailing.BoatArtiMulti')}x`;
  return <ItemCard.Section label={'Next chest'}>
    <ItemCard.Facts rows={[
      chestOdds ? ['Treasure', <Num key={'treasure'} value={expectedTreasure ?? 0} system={'Sailing'}/>] : null,
      ['Artifact odds', artifactChance?.breakdown
        ? <Breakdown key={'odds'} asValue title={'Artifact odds'} data={withText(artifactChance.breakdown, oddsText)}>{oddsText}</Breakdown>
        : oddsText],
      chestOdds ? ['Artifact chance', <DottedValue key={'tiers'} table note={<ChestTiers tiers={tiers} noArtifactsLeft={noArtifactsLeft}/>}
                                                   label={`${chance}, chest tiers`}>{chance}</DottedValue>] : null
    ]}/>
  </ItemCard.Section>;
};

const cloudClears = (cloud, lastUpdated) => {
  const { tripsLeft, timeLeft } = cloud ?? {};
  return tripsLeft > 0
    ? <Stack component={'span'} direction={'row'} gap={0.5} justifyContent={'flex-end'}>
      <Timer type={'countdown'} lastUpdated={lastUpdated} date={new Date().getTime() + (timeLeft ?? 0)}
             placeholder={<StatusText status={'ready'}>Ready to clear</StatusText>}/>
      <span>({formatNum(tripsLeft)} {tripsLeft === 1 ? 'trip' : 'trips'})</span>
    </Stack>
    : <StatusText status={'ready'}>Ready to clear</StatusText>;
};

const cloudSection = (cloud) => {
  const { progress, required } = cloud ?? {};
  return <ItemCard.Section label={'Cloud discovery'}>
    <ItemCard.Progress label={'Progress'} percent={required > 0 ? Math.min(100, 100 * (progress ?? 0) / required) : 100}
                       value={<Num value={progress ?? 0} system={'Sailing'}/>} max={<Num value={required ?? 0} system={'Sailing'}/>}/>
  </ItemCard.Section>;
};

// A boat upgrade's level and the next level's cost against the treasure owned, in the footer; its value next and its
// next bonus level with what reaching it costs, in the Details pill's rows. Two of each sit side by side (Cards board's
// L card).
const upgradeCost = (title, level, resource) => <Stack gap={0.75} sx={UPGRADE_SX}>
  <Typography variant={'groupLabel'} color={'text.secondary'}>{`${title} · Lv ${formatNum(level ?? 0)}`}</Typography>
  {resource ? <ItemCard.Cost icon={`data/${resource.rawName}.png`} iconAlt={treasureName(treasureIndex(resource.rawName))} needBelow
                             need={resource.required ?? 0} have={resource.amount ?? 0} game={'Sailing.BoatUpgCostQty'}/> : null}
</Stack>;
const upgradeNext = (title, level, step, value, next, key, breakpointResource) => {
  const breakpoint = (level ?? 0) + (step - ((level ?? 0) % step));
  const bonusCost = breakpointResource ? `: ${formatGame(breakpointResource?.required ?? 0, 'Sailing.BoatUpgCostQty', { whole: true })}` : '';
  return <Stack gap={0.75} sx={UPGRADE_SX}>
    <Typography variant={'groupLabel'} color={'text.secondary'}>{`${title} next level`}</Typography>
    <Typography variant={'body2'} component={'div'} sx={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
      {`${formatGame(value ?? 0, key)} → ${formatGame(next ?? 0, key)}`}
    </Typography>
    <Typography color={'text.secondary'} component={'div'} sx={{ fontSize: 13, lineHeight: '18px' }}>{`Bonus at Lv ${formatNum(breakpoint)}${bonusCost}`}</Typography>
  </Stack>;
};
// The footer draws its own line above its pair
const UPGRADE_ROW_SX = { display: 'flex', flexWrap: 'wrap', gap: 2 };
const UPGRADES_SX = { ...UPGRADE_ROW_SX, pt: 1, borderTop: 1, borderColor: 'divider' };
// A block is as wide as its longest line and no line breaks. Two that fit share the row in equal columns, two that
// don't stack, so a long value never splits on a phone.
const UPGRADE_SX = { flex: '1 1 0', minWidth: 'max-content', whiteSpace: 'nowrap' };

// Three columns, two on a phone. A column's first row draws no line: the Panel's header band sits over it.
const ISLANDS_SX = {
  display: 'grid',
  gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
  '& > *': { borderTop: 1, borderColor: 'divider' },
  '& > :nth-of-type(-n+2)': { borderTop: 0 },
  '& > :nth-of-type(3)': { borderTopWidth: { xs: 1, md: 0 } }
};
// A phone's column is 175 px: at 13 px the longest name and two captains share its line. Past that a name folds between
// its words, never inside one, and the captains fold at their commas.
const ISLAND_ROW_SX = {
  px: { xs: 1, md: 2 },
  gap: { xs: 1, md: 1.5 },
  '& .MuiTypography-root': { fontSize: { xs: 13, md: 14 } },
  '& > div:first-of-type': { minWidth: 'min-content' },
  '& > div:last-of-type': { flexShrink: 1, minWidth: 0 }
};

const BoatsAndCaptains = ({
                            boats,
                            captains,
                            lootPile,
                            captainsOnBoats,
                            shopCaptains,
                            minimumTravelTime,
                            minimumTravelTimeBreakdown,
                            lootMulti,
                            lastUpdated,
                            sectionFailed
                          }) => {
  const [view, setView, resetView] = useToolbarState('sailing-boats', BOATS_TOOLBAR);
  // In a failed section the page's note says why there are none
  if (!boats?.length && !captains?.length) {
    return sectionFailed ? null
      : <Notice tone={'locked'}>Boats and captains show here once your account builds its first boat.</Notice>;
  }
  const shipOverview = (boats ?? []).reduce((res, boat) => {
    const { island, islandIndex } = boat;
    const name = island?.name || 'Not assigned';
    return { ...res, [name]: { islandIndex, boats: [...(res?.[name]?.boats || []), boat] } };
  }, {});
  const lootText = `${formatGame(lootMulti?.value ?? 1, 'Sailing.LootMulti')}x`;
  const travelText = `${formatNum(minimumTravelTime ?? 0)} min`;

  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Total boat levels'} value={calcTotalBoatLevels(boats) ?? 0} kind={'amount'}/>
      {lootMulti ? <StatTile label={'Loot multi'} value={lootText} breakdownTitle={'Loot multi'}
                             breakdown={withText(lootMulti?.breakdown, lootText)}/> : null}
      {minimumTravelTime ? <StatTile label={'Min travel time'} value={travelText} breakdownTitle={'Min travel time'}
                                     breakdown={withText(minimumTravelTimeBreakdown, travelText)}/> : null}
    </Stack>
    {boats?.length ? <Box mb={3}>
      <Toolbar state={view} defaults={BOATS_TOOLBAR} onChange={setView} onReset={resetView}
               total={boats.length} shown={boats.length} noun={'boats'}>
        <Toolbar.Filter name={'details'} label={'Details'} display/>
      </Toolbar>
      <Typography mb={2} variant={'sectionTitle'} component={'h2'}>Boats</Typography>
      {/* A boat card keeps where it sails, when it lands and what its upgrades cost. Its travel range, next chest or
          cloud bar and each upgrade's next level show with the Details pill. */}
      <CardGrid size={'l'} details={view?.details}>
        {boats.map(({
                      rawName,
                      level,
                      artifactChance,
                      loot,
                      speed,
                      lootLevel,
                      speedLevel,
                      boatIndex,
                      captainMappedIndex,
                      island,
                      timeLeft,
                      distanceTraveled,
                      resources,
                      breakpointResources,
                      chestOdds,
                      cloud
                    }, index) => <ItemCard key={`${rawName}-${index}`} icon={`etc/${rawName}.png`} iconSize={40} title={`Boat ${boatIndex + 1}`}
                                           level={{ value: level ?? 0 }}
                                           meta={[captainMappedIndex ? `Captain ${captainMappedIndex}` : null, cleanUnderscore(island?.name ?? '')]
                                             .filter(Boolean).join(' · ')}
                                           more={<>
                                             <ItemCard.Facts rows={[
                                               [<Stack key={'label'} component={'span'} direction={'row'} gap={0.5} alignItems={'center'}>
                                                 Min travel distance
                                                 <InfoButton label={'Min travel distance'}>How far this boat sails in the minimum travel time
                                                   ({travelText}). Islands nearer than this still take that long.</InfoButton>
                                               </Stack>, <Num key={'min'} value={(speed?.raw ?? 0) * (minimumTravelTime ?? 0) / 60} system={'Sailing'}/>]
                                             ]}/>
                                             {cloud ? cloudSection(cloud) : nextChestSection(chestOdds, artifactChance)}
                                             <Box sx={UPGRADES_SX}>
                                               {upgradeNext('Loot', lootLevel, 8, loot?.value, loot?.nextLevelValue, 'Sailing.BoatValue', breakpointResources?.[0])}
                                               {upgradeNext('Speed', speedLevel, 7, speed?.raw, speed?.nextLevelValue, 'Sailing.BoatSpeed', breakpointResources?.[1])}
                                             </Box>
                                           </>}
                                           footer={<Box sx={UPGRADE_ROW_SX}>
                                             {upgradeCost('Loot', lootLevel, resources?.[0])}
                                             {upgradeCost('Speed', speedLevel, resources?.[1])}
                                           </Box>}>
          <ItemCard.Stats cols={[
            ['Loot', formatGame(loot?.value ?? 0, 'Sailing.BoatValue')],
            ['Speed', formatGame(speed?.raw ?? 0, 'Sailing.BoatSpeed')],
            island ? ['Arrives in', <Timer key={'timer'} type={'countdown'} lastUpdated={lastUpdated}
                                           date={new Date().getTime() + (timeLeft ?? 0)}
                                           placeholder={<StatusText status={'ready'}>Arrived</StatusText>}/>] : null
          ].filter(Boolean)}/>
          {island ? <ItemCard.Progress label={`To ${cleanUnderscore(island.name)}`}
                                       percent={island.distance > 0 ? Math.min(100, 100 * (distanceTraveled ?? 0) / island.distance) : 100}
                                       value={<Num value={distanceTraveled ?? 0} system={'Sailing'}/>}
                                       max={<Num value={island.distance ?? 0} system={'Sailing'}/>}/> : null}
          <ItemCard.Facts rows={[
            island ? null : ['Distance', <Num key={'distance'} value={0} system={'Sailing'}/>],
            cloud ? ['Cloud clears in', cloudClears(cloud, lastUpdated)] : null
          ]}/>
        </ItemCard>)}
      </CardGrid>
    </Box> : null}
    {Object.keys(shipOverview).length ? <Panel title={'Islands'} sx={{ mb: 3 }}>
      <Box sx={ISLANDS_SX}>
        {Object.entries(shipOverview).map(([islandName, { islandIndex, boats: islandBoats }]) => <Panel.Row
          key={islandName}
          sx={ISLAND_ROW_SX}
          icon={islandName !== 'Not assigned' ? <GameIcon src={`data/SailT${2 * islandIndex + 1}.png`} size={24} alt={''}/> : undefined}
          name={cleanUnderscore(islandName)}
          value={islandBoats?.map(({ captainMappedIndex }) => captainMappedIndex).filter(Boolean).join(', ')}/>)}
      </Box>
    </Panel> : null}
    {shopCaptains?.length ? <>
      <Typography mb={2} variant={'sectionTitle'} component={'h2'}>Captains shop</Typography>
      <CardGrid size={'m'} sx={{ mb: 3 }}>
        {shopCaptains.map((captain, index) => <Captain shop key={index} {...captain} lootPile={lootPile}
                                                       captainsOnBoats={captainsOnBoats}/>)}
      </CardGrid>
    </> : null}
    {captains?.length ? <>
      <Typography mb={2} variant={'sectionTitle'} component={'h2'}>Captains</Typography>
      <CardGrid size={'m'}>
        {captains.map((captain, index) => <Captain key={index} {...captain} captainsOnBoats={captainsOnBoats}/>)}
      </CardGrid>
    </> : null}
  </>;
};

export default BoatsAndCaptains;

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
import InfoButton, { NoteTrigger } from '@components/common/InfoButton';
import StatusText from '@components/common/StatusText';
import Notice from '@components/common/Notice';
import { treasureIndex, treasureName } from './LootPile';

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
      chestOdds ? ['Artifact chance', <NoteTrigger key={'tiers'} table note={<ChestTiers tiers={tiers} noArtifactsLeft={noArtifactsLeft}/>}
                                                   label={`${chance}, chest tiers`}>
        <Box component={'span'} sx={{ textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>{chance}</Box>
      </NoteTrigger>] : null
    ]}/>
  </ItemCard.Section>;
};

const cloudSection = (cloud, lastUpdated) => {
  const { progress, required, tripsLeft, timeLeft } = cloud ?? {};
  return <ItemCard.Section label={'Cloud discovery'}>
    <ItemCard.Progress label={'Progress'} percent={required > 0 ? Math.min(100, 100 * (progress ?? 0) / required) : 100}
                       value={<Num value={progress ?? 0} system={'Sailing'}/>} max={<Num value={required ?? 0} system={'Sailing'}/>}/>
    <ItemCard.Facts rows={[tripsLeft > 0
      ? ['Clears in', <Stack key={'clears'} component={'span'} direction={'row'} gap={0.5} justifyContent={'flex-end'}>
        <Timer type={'countdown'} lastUpdated={lastUpdated} date={new Date().getTime() + (timeLeft ?? 0)}/>
        <span>({formatNum(tripsLeft)} {tripsLeft === 1 ? 'trip' : 'trips'})</span>
      </Stack>]
      : ['Clears in', <StatusText key={'ready'} status={'ready'}>Ready to clear</StatusText>]]}/>
  </ItemCard.Section>;
};

// A boat upgrade: its value now and next, the next bonus level and what it costs, and the next level's cost against
// the treasure owned. Two of these sit side by side under one line (Cards board's L card), one over the other where
// a column would drop under 150 px (a phone).
const upgradeSection = (title, level, step, value, next, key, resource, breakpointResource) => {
  const breakpoint = (level ?? 0) + (step - ((level ?? 0) % step));
  return <Stack gap={1} sx={{ minWidth: 0 }}>
    <Typography variant={'groupLabel'} color={'text.secondary'}>{`${title} · Lv ${formatNum(level ?? 0)}`}</Typography>
    <ItemCard.Facts rows={[
      ['Value', `${formatGame(value ?? 0, key)} → ${formatGame(next ?? 0, key)}`],
      ['Next bonus', `Lv ${formatNum(breakpoint)} (${formatNum(breakpoint - (level ?? 0))} more)`],
      breakpointResource ? [`Cost to Lv ${formatNum(breakpoint)}`, formatGame(breakpointResource?.required ?? 0, 'Sailing.BoatUpgCostQty')] : null
    ]}/>
    {resource ? <ItemCard.Cost icon={`data/${resource.rawName}.png`} iconAlt={treasureName(treasureIndex(resource.rawName))}
                               need={resource.required ?? 0} have={resource.amount ?? 0} game={'Sailing.BoatUpgCostQty'}/> : null}
  </Stack>;
};
const UPGRADES_SX = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, pt: 1, borderTop: 1, borderColor: 'divider' };

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
    {Object.keys(shipOverview).length ? <Panel title={'Islands'} sx={{ mb: 3 }}>
      {Object.entries(shipOverview).map(([islandName, { islandIndex, boats: islandBoats }]) => <Panel.Row
        key={islandName}
        icon={islandName !== 'Not assigned' ? `data/SailT${2 * islandIndex + 1}.png` : undefined}
        name={cleanUnderscore(islandName)}
        value={islandBoats?.map(({ captainMappedIndex }) => captainMappedIndex).filter(Boolean).join(', ')}/>)}
    </Panel> : null}
    {boats?.length ? <>
      <Typography mb={2} variant={'sectionTitle'} component={'h2'}>Boats</Typography>
      <CardGrid size={'l'} sx={{ mb: 3 }}>
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
                                             .filter(Boolean).join(' · ')}>
          <ItemCard.Stats cols={[
            ['Loot', formatGame(loot?.value ?? 0, 'Sailing.BoatValue')],
            ['Speed', formatGame(speed?.raw ?? 0, 'Sailing.BoatSpeed')],
            island ? ['Arrives in', <Timer key={'timer'} type={'countdown'} lastUpdated={lastUpdated}
                                           date={new Date().getTime() + (timeLeft ?? 0)}/>] : null
          ].filter(Boolean)}/>
          {island ? <ItemCard.Progress label={`To ${cleanUnderscore(island.name)}`}
                                       percent={island.distance > 0 ? Math.min(100, 100 * (distanceTraveled ?? 0) / island.distance) : 100}
                                       value={<Num value={distanceTraveled ?? 0} system={'Sailing'}/>}
                                       max={<Num value={island.distance ?? 0} system={'Sailing'}/>}/> : null}
          <ItemCard.Facts rows={[
            island ? null : ['Distance', <Num key={'distance'} value={0} system={'Sailing'}/>],
            [<Stack key={'label'} component={'span'} direction={'row'} gap={0.5} alignItems={'center'}>
              Min travel distance
              <InfoButton label={'Min travel distance'}>How far this boat sails in the minimum travel time
                ({travelText}). Islands nearer than this still take that long.</InfoButton>
            </Stack>, <Num key={'min'} value={(speed?.raw ?? 0) * (minimumTravelTime ?? 0) / 60} system={'Sailing'}/>]
          ]}/>
          {cloud ? cloudSection(cloud, lastUpdated) : nextChestSection(chestOdds, artifactChance)}
          <Box sx={UPGRADES_SX}>
            {upgradeSection('Loot', lootLevel, 8, loot?.value, loot?.nextLevelValue, 'Sailing.BoatValue', resources?.[0], breakpointResources?.[0])}
            {upgradeSection('Speed', speedLevel, 7, speed?.raw, speed?.nextLevelValue, 'Sailing.BoatSpeed', resources?.[1], breakpointResources?.[1])}
          </Box>
        </ItemCard>)}
      </CardGrid>
    </> : null}
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

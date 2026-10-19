import React from 'react';
import { Card, CardContent, Divider, LinearProgress, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import Timer from '../../../../common/Timer';
import Captain from './Captain';
import { Row, SectionLabel } from './CardParts';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@components/Tooltip';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { CardTitleAndValue } from '@components/common/styles';
import { CardWithBreakdown } from '@components/common/Breakdown/CardWithBreakdown';
import { calcTotalBoatLevels } from '@parsers/world-5/sailing';

const BoatsAndCaptains = ({
                            boats,
                            captains,
                            lootPile,
                            captainsOnBoats,
                            shopCaptains,
                            minimumTravelTime,
                            minimumTravelTimeBreakdown,
                            lootMulti,
                            lastUpdated
                          }) => {
  const getShipsOverview = () => {
    return boats?.reduce((res, boat) => {
      const { island, islandIndex } = boat;
      return {
        ...res,
        [island?.name || 'Not assigned']: {
          islandIndex,
          boats: [...(res?.[island?.name]?.boats || []), boat]
        }
      };
    }, {})
  };
  const shipOverview = getShipsOverview();

  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mt={3}>
      <CardTitleAndValue title={'Total boat levels'} value={commaNotation(calcTotalBoatLevels(boats) ?? 0)}/>
      {lootMulti ? <CardWithBreakdown title={'Loot multi'}
                                      value={`${notateNumber(lootMulti?.value ?? 1, (lootMulti?.value ?? 1) > 1e4 ? 'Big' : 'MultiplierInfo')}x`}
                                      breakdown={lootMulti?.breakdown}/> : null}
      {minimumTravelTime ? <CardWithBreakdown title={'Min travel time'} value={`${minimumTravelTime} min`}
                                              breakdown={minimumTravelTimeBreakdown}/> : null}
    </Stack>
    <Typography my={3} variant={'h3'}>Overview</Typography>
    <Stack mt={1} direction={'row'} flexWrap={'wrap'} gap={3}>
      {Object.entries(shipOverview || {})?.map(([islandName, { islandIndex, boats }]) => {
        return <Card key={'overview' + islandIndex + boats?.length}>
          <CardContent>
            <Stack key={islandName}>
              <Stack direction={'row'} gap={1}>
                {islandName !== 'Not assigned' && <img style={{ width: 25, objectFit: 'contain' }}
                                                       src={`${prefix}data/SailT${(islandIndex * 2) + 1}.png`} alt=""/>}
                <Typography>{cleanUnderscore(islandName)}</Typography>
              </Stack>
              <Typography
                sx={{ textAlign: 'center' }}>{boats?.map(({ captainMappedIndex }) => captainMappedIndex)?.join(', ')}</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
    <Typography my={3} variant={'h3'}>Boats</Typography>
    <Stack mt={1} direction={'row'} flexWrap={'wrap'} gap={1}>
      {boats?.map(({
                     rawName,
                     level,
                     artifactChance,
                     eldritchChance,
                     loot,
                     speed,
                     lootLevel,
                     speedLevel,
                     boatIndex,
                     captainIndex,
                     captainMappedIndex,
                     island,
                     distanceTraveled,
                     timeLeft,
                     resources,
                     breakpointResources,
                     chestOdds,
                     cloud
                   }, index) => <Card
        key={`${rawName}-${index}`}>
        <CardContent sx={{ width: 270 }}>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <img style={{ width: 50, objectFit: 'contain' }}
                 src={`${prefix}etc/${rawName}.png`} alt={rawName}/>
            <Stack sx={{ minWidth: 0 }}>
              <Typography variant={'caption'}>Boat {boatIndex + 1} · Lv. {level} · Captain {captainMappedIndex}</Typography>
              <Typography variant={'caption'} color={'text.secondary'}>{cleanUnderscore(island?.name)}</Typography>
              <Timer variant={'h6'}
                     type={'countdown'} lastUpdated={lastUpdated}
                     date={new Date().getTime() + timeLeft}/>
            </Stack>
          </Stack>
          <Stack mt={0.5}>
            <Typography variant={'caption'} color={'text.secondary'}>Distance: {island?.distance > 0
              ? notateNumber(island?.distance)
              : 0}</Typography>
            <Stack direction={'row'} alignItems={'center'} gap={0.5}>
              <Typography variant={'caption'} color={'text.secondary'}>Min travel distance: {cleanUnderscore(notateNumber(speed.raw * minimumTravelTime / 60))}</Typography>
              <Tooltip
                title={<MinimumTravelTime minimumTravelTime={minimumTravelTime}/>}>
                <InfoIcon sx={{ fontSize: 14, color: 'text.secondary' }}/>
              </Tooltip>
            </Stack>
          </Stack>
          <Divider sx={{ my: 1 }}/>
          {cloud
            ? <CloudDiscovery cloud={cloud} lastUpdated={lastUpdated}/>
            : <NextChest chestOdds={chestOdds} artifactChance={artifactChance}/>}
          <Divider sx={{ my: 1 }}/>
          <SectionLabel>Upgrades</SectionLabel>
          <Stack direction={'row'} gap={1.5}>
            <UpgradeColumn title={'Loot'} level={lootLevel} step={8} value={loot.value}
                           nextValue={loot.nextLevelValue} resource={resources?.[0]}
                           breakpointResource={breakpointResources?.[0]}/>
            <UpgradeColumn title={'Speed'} level={speedLevel} step={7} value={speed.raw}
                           nextValue={speed.nextLevelValue} resource={resources?.[1]}
                           breakpointResource={breakpointResources?.[1]}/>
          </Stack>
        </CardContent>
      </Card>)}
    </Stack>
    <Typography my={3} variant={'h3'}>Captains shop</Typography>
    <Stack mt={1} direction={'row'} flexWrap={'wrap'} gap={1}>
      {shopCaptains?.map((captain, index) => <Captain shop key={index}
                                                      {...captain}
                                                      lootPile={lootPile}
                                                      captainsOnBoats={captainsOnBoats}/>)}
    </Stack>
    <Typography my={3} variant={'h3'}>Captains</Typography>
    <Stack mt={1} direction={'row'} flexWrap={'wrap'} gap={1}>
      {captains?.map((captain, index) => <Captain key={index} {...captain} captainsOnBoats={captainsOnBoats}/>)}
    </Stack>
  </>
};

const formatChance = (percent) => {
  if (percent >= 0.01) return `${Math.round(percent * 100) / 100}%`;
  if (percent <= 0) return '0%';
  return `1 in ${commaNotation(Math.round(100 / percent))}`;
}

const NextChest = ({ chestOdds, artifactChance }) => {
  const { tiers, expectedTreasure, expectedArtifactChance, noArtifactsLeft } = chestOdds || {};
  return <Stack>
    <SectionLabel>Next chest</SectionLabel>
    {chestOdds ? <>
      <Row label={'Treasure'} value={notateNumber(expectedTreasure, 'Big')}/>
      <Row label={'Artifact chance'}
           value={noArtifactsLeft ? 'None left' : formatChance(expectedArtifactChance)}
           info={<Tooltip title={<ChestTiers tiers={tiers} noArtifactsLeft={noArtifactsLeft}/>}>
             <InfoIcon sx={{ fontSize: 14, color: 'text.secondary' }}/>
           </Tooltip>}/>
    </> : null}
    <Row secondary label={'Artifact odds'} value={`${artifactChance?.value}x`}
         info={<Breakdown data={artifactChance?.breakdown}>
           <InfoIcon sx={{ fontSize: 14, cursor: 'pointer', color: 'text.secondary' }}/>
         </Breakdown>}/>
  </Stack>
}

const UpgradeColumn = ({ title, level, step, value, nextValue, resource, breakpointResource }) => {
  const breakpoint = level + (step - (level % step));
  return <Stack sx={{ flex: 1, minWidth: 0 }}>
    <Typography variant={'body2'}>{title} {level}</Typography>
    <Typography variant={'caption'} color={'text.secondary'}>{notateNumber(value, 'Big')} → {notateNumber(nextValue, 'Big')}</Typography>
    <LinearProgress variant={'determinate'} value={100 * (level % step) / step}
                    sx={{ height: 4, borderRadius: 1, my: 0.5 }}/>
    <Stack direction={'row'} alignItems={'center'} gap={0.5}>
      <Typography variant={'caption'} color={'text.secondary'}>{breakpoint - level} to {breakpoint}</Typography>
      {breakpointResource ? <Tooltip followCursor={false} placement="right" dark
                                     title={<Resources resources={[breakpointResource]}/>}>
        <InfoIcon sx={{ fontSize: 14, color: 'text.secondary' }}/>
      </Tooltip> : null}
    </Stack>
    {resource ? <Stack direction={'row'} alignItems={'center'} gap={0.5}>
      <img style={{ width: 20, objectFit: 'contain' }} src={`${prefix}data/${resource.rawName}.png`}
           alt={resource.rawName}/>
      <Typography variant={'caption'} color={resource.amount >= resource.required ? 'success.light' : 'error.light'}
                  sx={{ whiteSpace: 'nowrap' }}>
        {notateNumber(resource.amount, 'Big')} / {notateNumber(resource.required)}
      </Typography>
    </Stack> : null}
  </Stack>
}

const ChestTiers = ({ tiers, noArtifactsLeft }) => {
  return <Stack gap={0.5}>
    <Typography variant={'subtitle2'}>Next chest from this boat</Typography>
    <Divider sx={{ bgcolor: 'black' }}/>
    <Stack direction={'row'} gap={1}>
      <Typography variant={'caption'} sx={{ width: 24 }}/>
      <Typography variant={'caption'} sx={{ width: 90 }}>Odds</Typography>
      <Typography variant={'caption'} sx={{ width: 70 }}>Treasure</Typography>
      {!noArtifactsLeft ? <Typography variant={'caption'}>Artifact</Typography> : null}
    </Stack>
    {[...tiers].reverse().map(({ tier, rawName, chance, treasure, artifactChance }) => <Stack key={tier}
                                                                                                direction={'row'}
                                                                                                alignItems={'center'}
                                                                                                gap={1}>
      <img style={{ width: 24, objectFit: 'contain' }} src={`${prefix}data/${rawName}.png`} alt={rawName}/>
      <Typography variant={'caption'} sx={{ width: 90 }}>{formatChance(100 * chance)}</Typography>
      <Typography variant={'caption'} sx={{ width: 70 }}>{notateNumber(treasure, 'Big')}</Typography>
      {!noArtifactsLeft ? <Typography variant={'caption'}>{formatChance(artifactChance)}</Typography> : null}
    </Stack>)}
  </Stack>
}

const CloudDiscovery = ({ cloud, lastUpdated }) => {
  const { progress, required, tripsLeft, timeLeft } = cloud;
  return <Stack>
    <SectionLabel>Cloud discovery</SectionLabel>
    <Typography variant={'caption'}>Progress: {notateNumber(progress)} / {notateNumber(required)}</Typography>
    {tripsLeft > 0 ? <Stack direction={'row'} gap={0.5} alignItems={'center'}>
      <Typography variant={'caption'}>Clears in</Typography>
      <Timer variant={'caption'} type={'countdown'} lastUpdated={lastUpdated}
             date={new Date().getTime() + timeLeft}/>
      <Typography variant={'caption'}>({tripsLeft} {tripsLeft === 1 ? 'trip' : 'trips'})</Typography>
    </Stack> : <Typography variant={'caption'}>Ready to clear</Typography>}
  </Stack>
}

const MinimumTravelTime = ({ minimumTravelTime }) => {
  return <Typography variant={'subtitle2'}>This is how far the ship travels in {minimumTravelTime} minutes, you want to
    target islands that have less distance than this.</Typography>
}

const Resources = ({ resources, inline = false }) => {
  return <>
    {resources?.length > 0 ? <>
      {inline && <Divider sx={{ my: 1 }}/>}
      <Stack>
        {resources?.map(({ required, amount, rawName }, index) => <Stack key={`${rawName}-${index}`}
                                                                         direction={'row'}>
          <img style={{ width: 25, objectFit: 'contain' }}
               src={`${prefix}data/${rawName}.png`} alt={rawName}/>
          <Typography
            color={amount >= required
              ? 'success.light'
              : 'error.light'}>{notateNumber(amount, 'Big')} / {notateNumber(required)}</Typography>
        </Stack>)}
      </Stack> </> : null
    }
  </>
}


export default BoatsAndCaptains;

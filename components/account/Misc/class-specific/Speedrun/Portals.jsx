import React from 'react';
import { Alert, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, numberWithCommas, prefix, secondsToShortDuration } from '@utility/helpers';
import { TitleAndValue } from '@components/common/styles';
import useCheckbox from '@components/common/useCheckbox';

// One row per portal. Maps with two get two, told apart by where each door leads.
const PortalRow = ({ portal, showDoor }) => {
  const { portalIndex, reqKills, destinationName, secondsToClear, buffedSecondsToClear, reachable } = portal;

  return <Stack gap={0.25} sx={{ py: 0.5 }}>
    {showDoor ? <Typography variant={'caption'} color={'text.secondary'}>
      {destinationName ? `Door to ${cleanUnderscore(destinationName)}` : `Portal ${portalIndex + 1}`}
    </Typography> : null}
    <TitleAndValue title={'Kills needed'} value={numberWithCommas(reqKills)}/>
    <TitleAndValue title={'Clear time'} value={reachable ? secondsToShortDuration(secondsToClear) : 'Can\'t hit this monster'}/>
    {reachable ? <TitleAndValue title={'With Void Radius'} value={secondsToShortDuration(buffedSecondsToClear)}/> : null}
  </Stack>;
};

const MapCard = ({ mapName, monster, effectiveKillsPerSecond, reachable, portals, detailed }) => <Card
  sx={{ width: 260 }}>
  <CardContent>
    <Stack direction={'row'} alignItems={'center'} gap={1}>
      <img src={`${prefix}data/Mface${monster?.MonsterFace}.png`} alt="" width={28} height={28}
           style={{ objectFit: 'contain' }}/>
      <Typography variant={'body2'} sx={{ fontWeight: 500 }}>{cleanUnderscore(mapName)}</Typography>
    </Stack>
    <Typography variant={'caption'} color={'text.secondary'}>
      {reachable ? `${notateNumber(effectiveKillsPerSecond, 'Big')} portal progress / sec` : 'Out of reach'}
    </Typography>
    {detailed ? <>
      <Divider sx={{ my: 1 }}/>
      <Stack divider={<Divider flexItem/>}>
        {portals.map((portal) => <PortalRow key={portal.portalIndex} portal={portal}
                                            showDoor={portals.length > 1}/>)}
      </Stack>
    </> : null}
  </CardContent>
</Card>;

const Portals = ({ character, plan }) => {
  const [BlockedCheckboxEl, hideUnclearable] = useCheckbox('Hide portals I can\'t hit');
  const [DetailedCheckboxEl, detailed] = useCheckbox('Detailed view');

  if (!character) {
    return <Alert severity={'info'} variant={'outlined'}>Create a Voidwalker to see your portal costs.</Alert>;
  }

  const visible = plan.portals.filter(({ reachable }) => !hideUnclearable || reachable);

  // Grouped by world, maps in the game's own order. Any other ordering would read as a route, and
  // the real one turns on travel, unlocks and buff timing as much as on kill cost.
  const worlds = visible.reduce((result, portal) => {
    const world = result[portal.world] ?? (result[portal.world] = new Map());
    const existing = world.get(portal.mapIndex);
    if (existing) {
      existing.portals.push(portal);
    }
    else {
      world.set(portal.mapIndex, { ...portal, portals: [portal] });
    }
    return result;
  }, {});

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={2}>
      <BlockedCheckboxEl/>
      <DetailedCheckboxEl/>
    </Stack>
    <Stack gap={3} aria-label="speedrun portals">
      {Object.entries(worlds).map(([world, maps]) => <Stack key={world} gap={1.5}>
        <Typography variant={'h6'}>World {world}</Typography>
        <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'flex-start'}>
          {[...maps.values()].map((map) => <MapCard key={map.mapIndex} {...map} detailed={detailed}/>)}
        </Stack>
      </Stack>)}
    </Stack>
  </>
};

export default Portals;

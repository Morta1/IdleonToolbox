import React, { useMemo } from 'react';
import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { cleanUnderscore, notateNumber, prefix } from "../../../../../utility/helpers";
import styled from "@emotion/styled";
import Timer from "../../../../common/Timer";
import Captain from "./Captain";

const BoatsAndCaptains = ({ boats, captains, lootPile, captainsOnBoats, shopCaptains, lastUpdated }) => {
  const getShipsOverview = () => {
    return boats?.reduce((res, boat) => {
      const { island, islandIndex } = boat;
      return {
        ...res,
        [island?.name]: {
          islandIndex,
          boats: [...(res?.[island?.name]?.boats || []), boat]
        }
      };
    }, {})
  };
  const shipOverview = useMemo(() => getShipsOverview(), [boats])
  return <>
    <Typography my={3} variant={'h3'}>Overview</Typography>
    <Stack mt={1} direction={'row'} flexWrap={'wrap'} gap={3}>
      {Object.entries(shipOverview || {})?.map(([islandName, { islandIndex, boats }]) => {
        return <Card>
          <CardContent>
            <Stack key={islandName}>
              <Stack direction={'row'} gap={1}>
                <img style={{ width: 25, objectFit: 'contain' }}
                     src={`${prefix}data/SailT${(islandIndex * 2) + 1}.png`} alt=""/>
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
                     resources
                   }, index) => <Card
        key={`${rawName}-${index}`}>
        <CardContent sx={{ width: 250 }}>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <BoatWrapper>
              <img style={{ width: 50, objectFit: 'contain' }}
                   src={`${prefix}etc/${rawName}.png`} alt=""/>
              <Typography component={'span'}>{boatIndex + 1}</Typography>
            </BoatWrapper>
            <Stack>
              <Typography>Lv. {level}</Typography>
              <Typography variant={'caption'}>Captain {captainMappedIndex}</Typography>
              <Typography variant={'caption'}>Island - {cleanUnderscore(island?.name)}</Typography>
              <Timer variant={'body1'}
                     type={'countdown'} lastUpdated={lastUpdated}
                     date={new Date().getTime() + timeLeft}/>
            </Stack>
          </Stack>
          <Divider sx={{ my: 1 }}/>
          <Typography>Loot Value: {notateNumber(loot.value, 'Big')}</Typography>
          <Typography variant={'caption'}>Next level: {notateNumber(loot.nextLevelValue, 'Big')}</Typography>
          <Typography>Speed Value: {notateNumber(speed.raw, 'Big')}</Typography>
          <Typography variant={'caption'}>Next level: {notateNumber(speed.nextLevelValue, 'Big')}</Typography>
          <Divider sx={{ my: 1 }}/>
          <Stack>
            <Typography variant={'caption'}>Base loot: {lootLevel}</Typography>
            <Typography variant={'caption'}>Base speed: {speedLevel}</Typography>
          </Stack>
          {resources?.length > 0 ? <><Divider sx={{ my: 1 }}/>
            <Stack>
              {resources?.map(({ required, amount, rawName }, index) => <Stack key={`${rawName}-${index}`}
                                                                               direction={'row'}>
                <img style={{ width: 25, objectFit: 'contain' }}
                     src={`${prefix}data/${rawName}.png`} alt=""/>
                <Typography
                  color={amount >= required ? 'success.light' : 'error.light'}>{notateNumber(amount, 'Big')} / {notateNumber(required)}</Typography>
              </Stack>)}
            </Stack> </> : null}
          <Divider sx={{ my: 1 }}/>
          <Typography>Artifact Odds: {artifactChance}x</Typography>
        </CardContent>
      </Card>)}
    </Stack>
    <Typography my={3} variant={'h3'}>Captains shop</Typography>
    <Stack mt={1} direction={'row'} flexWrap={'wrap'} gap={1}>
      {shopCaptains?.map((captain, index) => <Captain shop key={index} {...captain}
                                                      lootPile={lootPile}
                                                      captainsOnBoats={captainsOnBoats}/>)}
    </Stack>
    <Typography my={3} variant={'h3'}>Captains</Typography>
    <Stack mt={1} direction={'row'} flexWrap={'wrap'} gap={1}>
      {captains?.map((captain, index) => <Captain key={index} {...captain} captainsOnBoats={captainsOnBoats}/>)}
    </Stack>
  </>
};

const BoatWrapper = styled.div`
  position: relative;

  & > span {
    position: absolute;
    right: 0;
    bottom: 0;
  }
`

export default BoatsAndCaptains;

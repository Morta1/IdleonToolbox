import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { cleanUnderscore, notateNumber, prefix } from "../../../../../utility/helpers";
import styled from "@emotion/styled";

const BoatsAndCaptains = ({ boats, captains, captainsOnBoats }) => {
  return <>
    <Typography my={3} variant={'h3'}>Boats</Typography>
    <Stack mt={1} direction={'row'} flexWrap={'wrap'} gap={1}>
      {boats?.map(({
                     rawName,
                     level,
                     artifactChance,
                     loot,
                     lootLevel,
                     speedLevel,
                     boatIndex,
                     captainIndex,
                     captainMappedIndex,
                     island,
                     distanceTraveled,
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
              <Typography variant={'caption'}>Trip {Math.round(distanceTraveled / island?.distance * 100)}% complete</Typography>
            </Stack>
          </Stack>
          <Divider sx={{ my: 1 }}/>
          <Typography>Loot Value: {loot.value}</Typography>
          <Typography variant={'caption'}>Next level: {loot.nextLevelValue}</Typography>
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
    <Typography my={3} variant={'h3'}>Captains</Typography>
    <Stack mt={1} direction={'row'} flexWrap={'wrap'} gap={1}>
      {captains?.map(({
                        firstBonusDescription,
                        secondBonusDescription,
                        firstBonus,
                        secondBonus,
                        level,
                        exp,
                        expReq,
                        firstBonusIndex,
                        secondBonusIndex,
                        captainIndex,
                        captainType
                      }, index) => <Card key={index}>
        <CardContent sx={{ width: 250, minHeight: 220 }}>
          {captainType >= 0 ? <>
            <Stack direction={'row'} alignItems={'center'} gap={1}>
              <Stack gap={1}>
                <img style={{ width: 25, height: 25, objectFit: 'contain' }}
                     src={`${prefix}etc/Sailing_Skill_${firstBonusIndex}.png`} alt=""/>
                {secondBonusIndex >= 0 ? <img style={{ width: 25, height: 25, objectFit: 'contain' }}
                                             src={`${prefix}etc/Sailing_Skill_${secondBonusIndex}.png`}
                                             alt=""/> : <>&nbsp;</>}
              </Stack>
              <img style={{ width: 40, height: 50, objectFit: 'contain' }}
                   src={`${prefix}etc/Captain_${captainType}.png`} alt=""/>
              <Stack>
                <Typography>{captainIndex}</Typography>
                <Typography variant={'caption'}>Boat {captainsOnBoats?.[captainIndex] + 1}</Typography>
              </Stack>
            </Stack>
            <Divider sx={{ my: 1 }}/>
            <Stack>
              <Typography>Lv.{level}</Typography>
              <Typography>Exp: {exp} / {expReq}</Typography>
              <Divider sx={{ my: 1 }}/>
              <Typography
                variant={'caption'}>{cleanUnderscore(firstBonusDescription)} ({firstBonus / level})</Typography>
              {secondBonus > 0 ? <Typography
                variant={'caption'}>{cleanUnderscore(secondBonusDescription)} ({secondBonus / level})</Typography> : null}
            </Stack>
          </> : <Stack alignItems={'center'} justifyContent={'center'}>
            <Typography>EMPTY</Typography>
          </Stack>}
        </CardContent>
      </Card>)}
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

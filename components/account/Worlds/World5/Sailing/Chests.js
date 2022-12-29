import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { cleanUnderscore, notateNumber, prefix } from "../../../../../utility/helpers";
import Tooltip from "../../../../Tooltip";
import { TitleAndValue } from "../../../../common/styles";

const Chests = ({ chests }) => {
  if (chests.length === 0) return <Stack justifyContent={'center'} direction={'row'}>
    <Typography variant={'h4'}>You have no chests!</Typography>
  </Stack>
  return <>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2} my={2}>
      {chests?.map(({
                      island,
                      artifactChance,
                      ancientChance,
                      rawName,
                      done,
                      possibleArtifacts,
                      islandIndex,
                      treasure
                    }, index) => {
        return <Card key={`${rawName}-${index}`} sx={{ width: 300 }}>
          <CardContent>
            <Stack>
              <Stack direction={'row'} alignItems={'center'}>
                <img style={{ objectFit: 'contain', width: 50 }} src={`${prefix}data/${rawName}.png`} alt=""/>
                <Stack>
                  {done ? <><Typography>No more artifacts!</Typography>
                    <Typography>&nbsp;</Typography></> : <>
                    <Typography>Artifact Chance {artifactChance}%</Typography>
                    <Typography>Ancient Chance {ancientChance}%</Typography>
                  </>}
                </Stack>
              </Stack>
              <Divider sx={{ my: 1 }}/>
              <Stack>
                <Typography>Island: {cleanUnderscore(island?.name)}</Typography>
                <Stack direction={'row'} alignItems={'center'}>
                  <img style={{ objectFit: 'contain', width: 25 }} src={`${prefix}data/SailT${islandIndex + 1}.png`}
                       alt=""/>
                  <Typography>{notateNumber(treasure, 'Big')}</Typography>
                </Stack>
                <Divider sx={{ my: 1 }}/>
                {!done ? <Stack direction={'row'} flexWrap={'wrap'}>
                  {possibleArtifacts?.map((artifact) => <Tooltip key={artifact?.rawName}
                                                                 title={<ArtifactInfoTooltip {...artifact}/>}>
                    <img src={`${prefix}data/${artifact?.rawName}.png`}
                         alt=""/>
                  </Tooltip>)}
                </Stack> : null}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack></>
};

const ArtifactInfoTooltip = ({ name, description }) => {
  return <>
    <Typography sx={{ fontWeight: 'bold' }} variant={'subtitle1'}>{cleanUnderscore(name)}</Typography>
    <TitleAndValue boldTitle title={'Bonus'} value={cleanUnderscore(description)}/>
  </>
}

export default Chests;

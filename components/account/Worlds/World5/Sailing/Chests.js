import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '../../../../../utility/helpers';
import Tooltip from '../../../../Tooltip';
import { TitleAndValue } from '../../../../common/styles';

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
                      eldritchChance,
                      sovereignChance,
                      rawName,
                      done,
                      acquired,
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
                    <Typography color={'warning.light'}>Ancient Chance {ancientChance}%</Typography>
                    <Typography color={'error.light'}>Eldritch Chance {eldritchChance}%</Typography>
                    <Typography color={'#67dada'}>Sovereign Chance {sovereignChance}%</Typography>
                  </>}
                </Stack>
              </Stack>
              <Divider sx={{ my: 1 }}/>
              <Stack>
                <Typography>Island: {cleanUnderscore(island?.name)}</Typography>
                <Stack direction={'row'} alignItems={'center'}>
                  <img style={{ objectFit: 'contain', width: 25 }} src={`${prefix}data/SailT${islandIndex * 2 + 1}.png`}
                       alt=""/>
                  <Typography>{notateNumber(treasure, 'Big')}</Typography>
                </Stack>
                <Divider sx={{ my: 1 }}/>
                {!done ? <Stack direction={'row'} flexWrap={'wrap'} gap={1} alignItems={'center'}>
                  {possibleArtifacts?.map((artifact) => <Tooltip key={artifact?.rawName}
                                                                 title={<ArtifactInfoTooltip {...artifact}/>}>
                    <Stack sx={{
                      border: '1px solid',
                      borderColor: artifact?.acquired === 2 ? 'warning.light' : artifact?.acquired === 3
                        ? 'error.light'
                        : '',
                      p: 1
                    }}
                           alignItems={'center'}>
                      <img src={`${prefix}data/${artifact?.rawName}.png`}
                           width={24} height={24}
                           alt=""/>
                    </Stack>
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

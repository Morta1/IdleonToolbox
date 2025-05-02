import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, prefix } from '@utility/helpers';
import React from 'react';
import useCheckbox from '@components/common/useCheckbox';
import { CardTitleAndValue } from '@components/common/styles';

const Portals = ({ maps }) => {
  const [CheckboxEl, hideUnlockedPortals] = useCheckbox('Hide unlocked portals');
  return <>
    <CardTitleAndValue title={''} value={<CheckboxEl/>}/>
    <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
      {maps?.map(({
                    mapName,
                    portals,
                    monster,
                    unlocked
                  }, index) => {
        if (hideUnlockedPortals && unlocked) return null;
        return (
          <Card key={mapName + index}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', width: 300 }}>
              <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center" justifyContent={'space-between'}
                     sx={{ position: 'relative' }}>
                <Typography>{cleanUnderscore(mapName)}</Typography>
                <img style={{ width: 32, height: 32, objectFit: 'contain' }}
                     src={`${prefix}data/Mface${monster.MonsterFace}.png`}/>
              </Stack>
              <Divider sx={{ my: 1.5 }}/>
              <Stack direction={'row'} alignItems={'center'} gap={1}
                     justifyContent={'space-between'}
              >
                {portals.map(({ unlocked, costType, costQuantity }, index) => {
                  return <Stack key={mapName + 'portal' + index}>
                    <Typography sx={{ opacity: unlocked ? 1 : .5 }} variant={'body1'}>Portal {index + 1}</Typography>
                    <Stack alignItems={'center'} sx={{ opacity: unlocked ? 1 : .5 }}>
                      <img style={{ width: 41, height: 41, objectFit: 'contain' }}
                           src={`${prefix}data/Dust${costType}_x1.png`}/>
                      <Typography variant={'body2'}>{commaNotation(costQuantity)}</Typography>
                    </Stack>
                  </Stack>
                })}
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  </>
};

export default Portals;

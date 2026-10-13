import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, prefix } from '@utility/helpers';
import React from 'react';
import useCheckbox from '@components/common/useCheckbox';
import { CardTitleAndValue } from '@components/common/styles';
import MultiCharLockText from '@components/common/MultiCharLockText';

// Mining and fishing maps idle on an ore or a fish, which has no monster face
const SKILL_MAP_ICONS = { MINING: 'ClassIconsM', FISHING: 'ClassIcons45' };

const Portals = ({ maps }) => {
  const [CheckboxEl, hideUnlockedPortals] = useCheckbox('Hide unlocked portals');
  return <Stack gap={2}>
    <Stack direction="row">
      <CardTitleAndValue title={''} value={<CheckboxEl/>}/>
    </Stack>
    <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
      {maps?.map(({
                    mapName,
                    portals,
                    monster,
                    afkType,
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
                     src={`${prefix}data/${SKILL_MAP_ICONS[afkType] ?? `Mface${monster?.MonsterFace}`}.png`} alt=""/>
              </Stack>
              <Divider sx={{ my: 1.5 }}/>
              <Stack direction={'row'} alignItems={'center'} gap={1}
                     justifyContent={'space-between'}
              >
                {portals.map(({ unlocked, costType, costQuantity, multiCharLock }, index) => {
                  return <Stack key={mapName + 'portal' + index}>
                    <Stack direction={'row'} alignItems={'center'} gap={0.5}>
                      <Typography sx={{ opacity: unlocked ? 1 : .5 }} variant={'body1'}>Portal {index + 1}</Typography>
                      <MultiCharLockText lock={multiCharLock} compact/>
                    </Stack>
                    <Stack alignItems={'center'} sx={{ opacity: unlocked ? 1 : .5 }}>
                      <img style={{ width: 41, height: 41, objectFit: 'contain' }}
                           src={`${prefix}data/Dust${costType}_x1.png`} alt=""/>
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
  </Stack>
};

export default Portals;

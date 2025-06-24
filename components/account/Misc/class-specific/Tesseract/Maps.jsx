import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, numberWithCommas, prefix } from '@utility/helpers';
import React from 'react';
import useCheckbox from '@components/common/useCheckbox';
import { CardTitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';

const Portals = ({ maps, weaponDropChance, ringDropChance }) => {
  const [CheckboxEl, hideUnlockedMaps] = useCheckbox('Hide unlocked maps');
  return <>
    <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
      <CardTitleAndValue title={''} value={<CheckboxEl/>}/>
      <CardTitleAndValue title={'Weapon Drop Chance'} value={`1 in ${Math.floor(1 / weaponDropChance)}`}
                         icon={'data/EquipmentWandsArc0.png'} imgStyle={{ width: 24, height: 24 }}/>
      <CardTitleAndValue title={'Ring Drop Chance'} value={`1 in ${Math.floor(1 / ringDropChance)}`}
                         icon={'data/EquipmentRingsArc0.png'} imgStyle={{ width: 24, height: 24 }}/>
    </Stack>
    <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
      {maps?.map(({
                    mapName,
                    reqKills,
                    monster,
                    unlocked,
                    tachyonQuantity,
                    tachyonType,
                    mapBonuses,
                    timeLeft
                  }, index) => {
        if (hideUnlockedMaps && unlocked) return null;
        return (
          <Card key={mapName + index}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', width: 350, opacity: unlocked ? 1 : .5 }}>
              <Stack direction="row" flexWrap="wrap" alignItems="center" justifyContent={'space-between'}
                     sx={{ position: 'relative' }}>
                <img style={{ width: 32, height: 32, objectFit: 'contain', marginTop: -8, marginRight: 4 }}
                     src={`${prefix}data/Mface${monster.MonsterFace}.png`}/>
                <Typography>{cleanUnderscore(mapName)}</Typography>
                <Stack direction={'row'} alignItems="center" sx={{ ml: 'auto' }}>
                  <Typography variant={'body1'}>{numberWithCommas(Math.floor(tachyonQuantity))}</Typography>
                  <img style={{ width: 32, height: 32, marginTop: -8 }}
                       src={`${prefix}data/Tach${tachyonType}_x1.png`}/>
                </Stack>
              </Stack>
              <Divider sx={{ my: 1.5 }}/>
              <Stack direction={'row'} gap={1} justifyContent={'space-between'}>
                <Stack>
                  <Typography>Charge kill req: {reqKills}</Typography>
                  <Typography>Time left: {timeLeft}s </Typography>
                </Stack>
                <Stack direction={'row'} alignItems={'center'} gap={2}>
                  {mapBonuses.map(({ value, killsToNext, type }, index) => {
                    return <Stack key={mapName + 'portal' + index} alignItems={'center'}>
                      <Tooltip title={killsToNext ? `Increases in ${killsToNext} kills` : ''}>
                        <Typography variant={'body1'}
                                    sx={{ borderBottom: '1px dotted', lineHeight: 1, mb: .5 }}>{type}</Typography>
                      </Tooltip>
                      <Stack alignItems={'center'}>
                        <img src={`${prefix}data/StatusArc${index}.png`}/>
                        <Typography variant={'body2'}>{Math.floor(1e3 * (1 + value / 100)) / 1e3}</Typography>
                      </Stack>
                    </Stack>
                  })}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  </>
};

export default Portals;

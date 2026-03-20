import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import React from 'react';
import Tooltip from '@components/Tooltip';

const Battles = ({ stones }) => {
  return <>
    <Stack direction={'row'} gap={2}>

    </Stack>

    <Stack gap={2} direction={'row'} flexWrap={'wrap'}>
      {stones?.map(({ name, bonus, kills, bossHp, nextLevelHps, monsterIcon, index, mapName, mapMonsterIcon, mapMonsterName }) => {
        return <Card key={'upgrade-' + index} sx={{ width: 350 }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
              <img style={{ width: 50, height: 50, objectFit: 'contain' }}
                src={`${prefix}etc/SumStone_${index}.png`} alt={''} />
              <img style={{ width: 50, height: 50, objectFit: 'contain' }}
                src={`${prefix}${monsterIcon}.png`} alt={''} />
              <Stack>
                <Typography variant={'caption'}>Kills: {kills}</Typography>
                <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={1}>
                  <Typography variant={'caption'}>Hp: {notateNumber(bossHp)}</Typography>
                  <Tooltip title={<Stack>
                    {nextLevelHps.map((futureHp, index) => <div
                      key={`futureKills-${name}-${index}`}>Kills: {kills + index + 1} - {futureHp < 1e7
                        ? commaNotation(futureHp)
                        : notateNumber(futureHp)}</div>)}
                  </Stack>}>
                    <IconInfoCircleFilled size={16} />
                  </Tooltip>
                </Stack>
              </Stack>
            </Stack>
            <Divider sx={{ my: 1 }}></Divider>
            <Typography variant={'body1'}>{cleanUnderscore(name)}</Typography>
            <Divider sx={{ my: 1 }}></Divider>
            <Stack direction={'row'} gap={1}>
              <Stack>
                <Typography mt={1} variant={'body2'}>{cleanUnderscore(bonus).capitalizeAll()}</Typography>
              </Stack>
            </Stack>
            <Divider sx={{ my: 1 }}></Divider>
            <Stack direction={'row'} justifyContent={'space-between'}>
              <Stack>
                <Typography variant={'caption'} color={'text.secondary'}>Found at:</Typography>
                <Typography variant={'body2'} fontWeight={500}>{cleanUnderscore(mapName)}</Typography>
              </Stack>
              {mapMonsterIcon && mapMonsterName && (
                <Stack direction={'row'} alignItems={'center'} gap={1} mt={0.5}>
                  <img style={{ width: 40, height: 40, objectFit: 'contain' }}
                    src={`${prefix}${mapMonsterIcon}.png`} alt={''} />
                  <Typography variant={'caption'} color={'text.secondary'}>
                    {cleanUnderscore(mapMonsterName)}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Battles;

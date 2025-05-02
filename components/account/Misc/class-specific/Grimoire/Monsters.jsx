import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, numberWithCommas, prefix } from '@utility/helpers';
import React from 'react';

const Monsters = ({ monsters }) => {
  return <>
    <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
      {monsters?.map(({
                        Name,
                        description = '',
                        boneType,
                        boneQuantity
                      }, index) => {
        return (
          <Card key={Name + index}>
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: 300,
                minHeight: 76
              }}
            >
              <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center"
                     sx={{ position: 'relative' }}>
                <img style={{ width: 41, height: 41, objectFit: 'contain' }}
                     src={`${prefix}afk_targets/${Name}.png`}/>
                <Stack>
                  <Typography>{cleanUnderscore(Name)}</Typography>
                  <Typography variant={'caption'}>{description ? `(${description})` : ''}</Typography>
                </Stack>
              </Stack>
              <Divider sx={{ my: 1 }}/>
              <Stack sx={{ width: '100%' }} direction={'row'} alignItems={'center'} gap={2}>
                <Stack direction={'row'} alignItems="center" sx={{ ml: 'auto' }}>
                  <Typography variant={'body1'}>{numberWithCommas(Math.floor(boneQuantity))}</Typography>
                  <img style={{ width: 42, height: 42, marginTop: -15 }}
                       src={`${prefix}data/Bone${boneType}_x1.png`}/>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  </>
};

export default Monsters;

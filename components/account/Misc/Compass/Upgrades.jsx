import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import React from 'react';

const Upgrades = ({ upgrades, dusts }) => {
  return <Stack direction="column" gap={4}>
    {upgrades.map(({ path, list }) => (
      <Stack key={path} direction="column" gap={2}>
        <Typography variant="h6">{path}</Typography>
        <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
          {list.map(({
                       name,
                       cost,
                       description,
                       monsterProgress,
                       unlockLevel,
                       level,
                       x3,
                       x4,
                       x5,
                       x6,
                       x7,
                       x8,
                       x9,
                       x10,
                       baseIconIndex,
                       index,
                       shapeIcon
                     }, i) => {
            if (description === "Titan_doesnt_exist") return null;
            let iconIndex = index ?? i;
            if (baseIconIndex) {
              iconIndex = baseIconIndex + 106;
            }

            return (
              <Card key={name + iconIndex}>
                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: 370,
                    minHeight: 250,
                    height: '100%',
                    opacity: level > 0 ? 1 : 0.5
                  }}
                >
                  <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center" sx={{ position: 'relative' }}>
                    <img style={{ width: 32, height: 32, position: 'absolute', left: 0 }}
                         src={`${prefix}data/${shapeIcon}.png`}/>
                    <img style={{ width: 32, height: 32, zIndex: 1 }} src={`${prefix}data/CompassUpg${iconIndex}.png`}/>
                    <Typography>
                      {cleanUnderscore(
                        name
                          .replace(/[船般航舞製]/, '')
                          .replace('(Tap_for_more_info)', '')
                          .replace('(#)', '')
                      )} ({level} / {x4})
                    </Typography>
                  </Stack>
                  <Divider sx={{ my: 1 }}/>
                  <Typography>
                    {cleanUnderscore(description.replace('$', ` ${cleanUnderscore(monsterProgress)}`).replace('.00', ''))}
                  </Typography>
                  <Divider sx={{ my: 1 }}/>
                  <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
                    <img style={{ objectPosition: '0 -6px' }} src={`${prefix}data/Dust${x3}_x1.png`}/>
                    <Typography>Cost: {notateNumber(dusts?.[x3] || 0)} / {notateNumber(cost, 'Big')}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </Stack>
    ))}
  </Stack>
};

export default Upgrades;

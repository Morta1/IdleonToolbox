import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';
import React from 'react';
import { CardTitleAndValue } from '@components/common/styles';
import useCheckbox from '@components/common/useCheckbox';

const Medallions = ({ medallions, totalAcquiredMedallions }) => {
  const [CheckboxEl, hideCoinedPortals] = useCheckbox('Hide coined monsters');
  return <>
    <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
      <CardTitleAndValue title={'Total medallions'} value={`${totalAcquiredMedallions} / ${medallions?.length}`}/>
      <CardTitleAndValue title={''} value={<CheckboxEl/>}/>
    </Stack>
    <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
      {medallions?.map(({
                          Name,
                          name,
                          rawName,
                          acquired,
                          monsterFace,
                          MonsterFace,
                          icon,
                          description = ''
                        }, index) => {
        if (hideCoinedPortals && acquired) return null;
        const currentIcon = icon || `data/Mface${monsterFace || MonsterFace}`;
        return (
          <Card key={rawName + index}>
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: 300,
                opacity: acquired > 0 ? 1 : 0.5
              }}
            >
              <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center" sx={{ position: 'relative' }}>
                <img style={{ width: 41, height: 41, objectFit: 'contain' }} src={`${prefix}${currentIcon}.png`}/>
                <Typography>{cleanUnderscore(name || Name)} {description ? `(${description})` : ''}</Typography>
                {acquired ? <img style={{ width: 41, height: 41, marginLeft: 'auto' }}
                                 src={`${prefix}data/WWcoin.png`}/> : null}
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  </>
};

export default Medallions;

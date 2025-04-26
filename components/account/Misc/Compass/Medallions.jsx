import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';
import React from 'react';
import { CardTitleAndValue } from '@components/common/styles';
import useCheckbox from '@components/common/useCheckbox';
import ItemDisplay from '@components/common/ItemDisplay';
import Tooltip from '@components/Tooltip';

const Medallions = ({ medallions, totalAcquiredMedallions }) => {
  const [CheckboxEl, hideCoinedPortals] = useCheckbox('Hide coined monsters');
  const [CheckboxDropsEl, showWindWalkerDrops] = useCheckbox('Show wind walker drops');
  return <>
    <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
      <CardTitleAndValue title={'Total medallions'} value={`${totalAcquiredMedallions} / ${medallions?.length}`}/>
      <CardTitleAndValue title={''} value={<CheckboxEl/>}/>
      <CardTitleAndValue title={''} value={<CheckboxDropsEl/>}
                         tooltipTitle={'Grass Bow and Wind Ring don\'t drop due to a bug.'}/>
    </Stack>
    <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
      {medallions?.map(({
                          Name,
                          rawName,
                          acquired,
                          MonsterFace,
                          icon,
                          description = '',
                          drops
                        }, index) => {
        if (hideCoinedPortals && acquired) return null;
        const currentIcon = icon ? `${icon}.png` : MonsterFace
          ? `data/Mface${MonsterFace}.png`
          : `afk_targets/${Name}.png`;
        return (
          <Card key={rawName + index}>
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: 300,
                minHeight: 76,
                opacity: acquired > 0 ? 1 : 0.5
              }}
            >
              <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center"
                     sx={{ position: 'relative' }}>
                <img style={{ width: 41, height: 41, objectFit: 'contain' }}
                     onError={(e) => {
                       e.target.src = `${prefix}afk_targets/${Name}.png`;
                     }}
                     src={`${prefix}${currentIcon}`}/>
                <Stack>
                  <Typography>{cleanUnderscore(Name)}</Typography>
                  <Typography variant={'caption'}>{description ? `(${description})` : ''}</Typography>
                </Stack>
                {acquired ? <img style={{ width: 41, height: 41, marginLeft: 'auto' }}
                                 src={`${prefix}data/WWcoin.png`}/> : null}
              </Stack>
              {showWindWalkerDrops ? <>
                <Divider sx={{ my: 1 }}/>
                <Stack sx={{ width: '100%' }} direction={'row'} alignItems={'center'} gap={2}>
                  {drops?.length > 0 ? drops.map((item, index) => {
                    return <Tooltip key={rawName + '-drop-' + item?.rawName + '-index-' + index}
                                    title={<ItemDisplay {...item} />}>
                      <img style={{ width: 42, height: 42 }} src={`${prefix}data/${item?.rawName}.png`}/>
                    </Tooltip>
                  }) : <Box sx={{ width: 42, height: 42 }}></Box>}
                </Stack>
              </> : null}
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  </>
};

export default Medallions;

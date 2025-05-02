import { Box, Card, CardContent, Divider, FormControl, MenuItem, Select, Stack, Typography } from '@mui/material';
import { cleanUnderscore, numberWithCommas, prefix } from '@utility/helpers';
import React, { useState } from 'react';
import { CardTitleAndValue } from '@components/common/styles';
import useCheckbox from '@components/common/useCheckbox';
import ItemDisplay from '@components/common/ItemDisplay';
import Tooltip from '@components/Tooltip';
import { dustNames } from '@parsers/compass';

const Medallions = ({ medallions, totalAcquiredMedallions }) => {
  const [CheckboxEl, hideCoinedPortals] = useCheckbox('Hide coined monsters');
  const [CheckboxDropsEl, showWindWalkerDrops] = useCheckbox('Show wind walker drops');
  const [dustFilter, setDustFilter] = useState('all');

  return <>
    <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
      <CardTitleAndValue title={'Total medallions'} value={`${totalAcquiredMedallions} / ${medallions?.length}`}/>
      <CardTitleAndValue title={''} value={<CheckboxEl/>}/>
      <CardTitleAndValue title={''} value={<CheckboxDropsEl/>}/>
      <CardTitleAndValue title={''} value={<FormControl sx={{ minWidth: 150 }}>
        <Select
          value={dustFilter}
          onChange={(e) => setDustFilter(e.target.value)}
          size="small"
          displayEmpty
        >
          <MenuItem key="all" value="all">
            <Stack direction="row" gap={1} alignItems="center">
              All Types
            </Stack>
          </MenuItem>
          {Object.entries(dustNames).map(([value, label]) => (
            value != 4 ? <MenuItem key={value} value={value}>
              <Stack direction="row" gap={1} alignItems="center">
                <img
                  style={{ width: 24, height: 24, objectPosition: '0 -6px' }}
                  src={`${prefix}data/Dust${value}_x1.png`}
                />
                {label}
              </Stack>
            </MenuItem> : null
          ))}

        </Select>
      </FormControl>}/>
    </Stack>
    <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
      {medallions?.map(({
                          Name,
                          rawName,
                          acquired,
                          description = '',
                          drops,
                          weakness,
                          dustType,
                          dustBaseQuantity
                        }, index) => {
        if (hideCoinedPortals && acquired) return null;
        if (dustFilter !== 'all' && dustType.toString() !== dustFilter) return null;
        return (
          <Card key={Name + index}>
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
                     src={`${prefix}afk_targets/${Name}.png`}/>
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
                  }) : <Box sx={{ width: 42, height: 42 }}/>}
                  <Stack direction={'row'} alignItems="center" sx={{ ml: 'auto' }}>
                    <Typography variant={'body1'}>{numberWithCommas(Math.floor(dustBaseQuantity))}</Typography>
                    <img style={{ width: 42, height: 42, marginTop: -15 }}
                         src={`${prefix}data/Dust${dustType}_x1.png`}/>
                    <img style={{ width: 24, height: 24 }}
                         src={`${prefix}data/WWeffect${weakness}.png`}/>
                  </Stack>
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

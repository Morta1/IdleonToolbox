import { Card, CardContent, Stack, Typography } from '@mui/material';
import { createRange, msToDate, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import { seedInfo } from '../../../../../data/website-data';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import React from 'react';
import { Breakdown } from '@components/common/styles';

const Crop = ({ crop, maxTimes }) => {
  return <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
    {seedInfo.map(({ name, seedId, cropIdMin, cropIdMax }, index) => {
      const array = createRange(cropIdMin, cropIdMax)
      return <Stack key={name}>
        <Stack mb={1} direction={'row'} gap={1} alignItems={'center'}>
          <img width={20} height={20} src={`${prefix}etc/Seed_${seedId}.png`} alt={''}/>
          <Stack direction={'row'} gap={1} alignItems={'center'}>
            <Typography variant={'h5'}>{name.toLowerCase().capitalize()}</Typography>
            <Stack direction={'row'} gap={1} alignItems={'center'}>
              <Typography variant={'h6'}>{msToDate(maxTimes?.[index]?.value * 1000)}</Typography>
              <Tooltip title={<Breakdown titleStyle={{ width: 160 }} breakdown={maxTimes?.[index]?.breakdown}
                                         notation={'MultiplierInfo'}/>}>
                <IconInfoCircleFilled size={18}/>
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>
        <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
          {array.map((cropId) => {
            return <Card key={'crop' + cropId} data-index={cropId}
                         sx={{ width: 90, opacity: crop?.[cropId] >= 0 ? 1 : .5 }}>
              <CardContent sx={{ '&:last-child': { p: 1 } }}>
                <Tooltip title={crop?.[cropId] >= 0 ? numberWithCommas(crop?.[cropId]) : ''}>
                  <Stack direction={'row'} gap={1} justifyContent={'center'} alignItems={'center'}>
                    <img width={20} height={20} src={`${prefix}data/FarmCrop${cropId}.png`} alt={''}/>
                    {crop?.[cropId] >= 0 ? notateNumber(crop?.[cropId]) : 0}
                  </Stack>
                </Tooltip>
              </CardContent>
            </Card>
          })}
        </Stack>
      </Stack>
    })}
  </Stack>
};

export default Crop;

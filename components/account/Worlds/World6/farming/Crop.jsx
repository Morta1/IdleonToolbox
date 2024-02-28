import { Card, CardContent, Stack, Typography } from '@mui/material';
import { createRange, prefix, notateNumber } from '@utility/helpers';
import { seedInfo } from '../../../../../data/website-data';

const Crop = ({ crop }) => {
  return <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
    {seedInfo.map(({ name, seedId, cropIdMin, cropIdMax }) => {
      const array = createRange(cropIdMin, cropIdMax)
      return <Stack key={name}>
        <Stack mb={1} direction={'row'} gap={1} alignItems={'center'}>
          <img width={20} height={20} src={`${prefix}etc/Seed_${seedId}.png`} alt={''}/>
          <Typography variant={'h5'}>{name.toLowerCase().capitalize()}</Typography>
        </Stack>
        <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
          {array.map((cropId) => {
            return <Card key={'crop' + cropId} sx={{ width: 90, opacity: crop?.[cropId] >= 0 ? 1 : .5 }}>
              <CardContent sx={{ '&:last-child': { p: 1 } }}>
                <Stack direction={'row'} gap={1} justifyContent={'center'} alignItems={'center'}>
                  <img width={20} height={20} src={`${prefix}data/FarmCrop${cropId}.png`} alt={''}/>
                  {crop?.[cropId] >= 0 ? notateNumber(crop?.[cropId]) : 0}
                </Stack>
              </CardContent>
            </Card>
          })}
        </Stack>
      </Stack>
    })}
  </Stack>
};

export default Crop;

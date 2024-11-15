import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import React from 'react';

const TheHarp = ({ hole }) => {
  const { theHarp } = hole?.caverns;
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Power'} value={`${100 > theHarp?.power
        ? '' + notateNumber(theHarp?.power, 'Small')
        : 1E6 > theHarp?.power
          ? '' + notateNumber(theHarp?.power)
          : '' + notateNumber(theHarp?.power, 'Big')}%`}/>
      <CardTitleAndValue title={'Power rate'} value={`${commaNotation(theHarp?.powerRate)} / hr`}/>
      <CardTitleAndValue title={'Strings'} value={theHarp?.stringSlots}/>
      <CardTitleAndValue title={'New note cost'} value={`${notateNumber(theHarp?.newNoteCost)}`}/>
      <CardTitleAndValue title={'Opal chance'} value={`${notateNumber(theHarp?.opalChance * 100, 'MultiplierInfo')}%`}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {theHarp?.notes?.map((value, index) => {
        return <Card key={`bonus-${index}`}>
          <CardContent sx={{ width: 150, opacity: value === 0 ? .5 : 1 }}>
            <Stack direction={'row'}>
              <img src={`${prefix}data/HoleHarpNote${index}.png`} alt={''}/>
              <Typography>{notateNumber(value, 'Big')}</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {theHarp?.chords?.map(({ description, level, bonus, owned }, index) => {
        return <Card key={`bonus-${index}`}>
          <CardContent sx={{ width: 300, height: 150, opacity: level === 0 ? .5 : 1 }}>
            <Typography>Lv. {level}</Typography>
            <Typography>{cleanUnderscore(description?.replace('|', Math.round(100 * (1 + bonus / 100)) / 100)?.replace('}', notateNumber(bonus, 'Big')))}</Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default TheHarp;

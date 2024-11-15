import { CardTitleAndValue } from '@components/common/styles';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import React from 'react';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';

const Measure = ({ hole }) => {
  return <>
    <Stack mb={1} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Level'} value={hole?.villagers?.[3]?.level}/>
      <CardTitleAndValue title={'Exp'} value={`${hole?.villagers?.[3]?.exp} / ${hole?.villagers?.[3]?.expReq}`}/>
      <CardTitleAndValue title={'Exp rate'} value={`${commaNotation(hole?.villagers?.[3]?.expRate)} / hr`}/>
      <CardTitleAndValue title={'Opals invested'} value={hole?.villagers?.[3]?.opalInvested} icon={'data/Opal.png'}
                         imgStyle={{ width: 22, height: 22 }}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.measurements?.map(({ description, bonus, multi, level }, index) => {
        if (description === 'i') return null
        const desc = description.toLowerCase().replace('访', '&');
        return <Card key={`measure-${index}`}>
          <CardContent sx={{ width: 300 }}>
            <Stack mb={2} direction={'row'} gap={2}>
              <img src={`${prefix}etc/Measure_${index}.png`}
                   alt={'measure-' + index}/>
              <Typography>Lv. {level}</Typography>
            </Stack>
            <Typography>{cleanUnderscore(desc.replace('|', ' ').replace('{', notateNumber(bonus, 'Big')))}</Typography>
            <Typography mt={2}>Multi: {notateNumber(multi, 'MultiplierInfo')}x</Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Measure;

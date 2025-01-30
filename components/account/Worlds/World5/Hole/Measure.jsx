import { CardTitleAndValue } from '@components/common/styles';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import React from 'react';
import { cleanUnderscore, commaNotation, msToDate, notateNumber, prefix } from '@utility/helpers';

const Measure = ({ hole }) => {
  const [,,,measure] = hole?.villagers || [];
  return <>
    <Stack mb={1} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Level'} value={measure?.level}/>
      <CardTitleAndValue title={'Exp'} value={`${measure?.exp} / ${measure?.expReq}`}/>
      <CardTitleAndValue title={'Exp rate'} value={`${commaNotation(measure?.expRate)} / hr`}/>
      <CardTitleAndValue title={'Time to level'} value={measure?.timeLeft >= 0 && measure?.expRate > 0 ? msToDate(measure?.timeLeft) : '0'}/>
      <CardTitleAndValue title={'Opals invested'} value={measure?.opalInvested || '0'} icon={'data/Opal.png'}
                         imgStyle={{ width: 22, height: 22 }}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.measurements?.map(({ description, bonus, multi, level, cost, owned, icon }, index) => {
        if (description === 'i') return null
        const desc = description.toLowerCase().replace('访', '&');
        return <Card key={`measure-${index}`}>
          <CardContent sx={{ width: 300, height: 210 }}>
            <Stack mb={2} direction={'row'} gap={2}>
              <img src={`${prefix}etc/Measure_${index}.png`}
                   alt={'measure-' + index}/>
              <Typography>Lv. {level}</Typography>
            </Stack>
            <Typography>{cleanUnderscore(desc.replace('|', ' ').replace('{', notateNumber(bonus, 'Big')))}</Typography>
            <Typography mt={2}>Multi: {notateNumber(multi, 'MultiplierInfo')}x</Typography>
            <Stack direction={'row'} gap={1} mt={2} alignItems={'center'}>
              {icon ? <img src={`${prefix}data/${icon}.png`}
                    style={{ width: 45, height: 45, objectFit: icon.includes('Fill') ? 'cover': 'none' }}
                    alt={'cost-type-' + index}/> : <img src={`${prefix}afk_targets/Nothing.png`}
                                                        alt={'unknown-cost-' + index}/>}
              <Typography >Cost: {notateNumber(owned, 'Big')} / {notateNumber(cost, 'Big')}</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Measure;

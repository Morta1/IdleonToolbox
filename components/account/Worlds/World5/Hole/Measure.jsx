import { CardTitleAndValue } from '@components/common/styles';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import React from 'react';
import { cleanUnderscore, msToDate, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import { ExpRateCard } from '@components/account/Worlds/World5/Hole/commons';

const Measure = ({ hole }) => {
  const [, , , measure] = hole?.villagers || [];
  return <>
    <Stack mb={1} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Level'} value={measure?.level}/>
      <CardTitleAndValue title={'Exp'} value={`${measure?.exp} / ${measure?.expReq}`}/>
      <ExpRateCard title={'Exp rate'} expRate={measure?.expRate} />
      <CardTitleAndValue title={'Time to level'}
                         value={measure?.timeLeft >= 0 && measure?.expRate?.value > 0 ? msToDate(measure?.timeLeft) : '0'}/>
      <CardTitleAndValue title={'Opals invested'} value={measure?.opalInvested || '0'} icon={'data/Opal.png'}
                         imgStyle={{ width: 22, height: 22 }}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.measurements?.map(({ description, baseBonus, totalBonus, multi, measuredBy, level, cost, owned, icon }, index) => {
        if (description === 'i') return null
        const desc = description.toLowerCase().replace('访', '&');
        return <Card key={`measure-${index}`}>
          <CardContent sx={{ width: 340, height: 260 }}>
            <Stack mb={2} direction={'row'} gap={2}>
              {/* font-324 */}
              <img src={`${prefix}etc/Measure_${index}.png`}
                   alt={'measure-' + index}/>
              <Typography>Lv. {level}</Typography>
            </Stack>
            <Typography>Base: {cleanUnderscore(desc.replace('|', ' ').replace('{', notateNumber(baseBonus, 'Big')))}</Typography>
            <Typography>Total: {cleanUnderscore(desc.replace('|', ' ').replace('{', notateNumber(totalBonus, 'Big')))}</Typography>
            <Divider sx={{ my: 1 }}/>
            <Typography>Multi: {notateNumber(multi, 'MultiplierInfo')}x</Typography>
            <Divider sx={{ my: 1 }}/>
            <Typography>{measuredBy?.label}: {measuredBy?.value < 1e6
              ? numberWithCommas(measuredBy?.value)
              : notateNumber(measuredBy?.value, 'Big')}</Typography>
            <Divider sx={{ mt: 1 }}/>
            <Stack direction={'row'} gap={1} alignItems={'center'}>
              {icon ? <img src={`${prefix}data/${icon}.png`}
                           style={{ width: 45, height: 45, objectFit: icon.includes('Fill') ? 'cover' : 'none' }}
                           alt={'cost-type-' + index}/> : <img src={`${prefix}afk_targets/Nothing.png`}
                                                               alt={'unknown-cost-' + index}/>}
              <Typography>Cost: {notateNumber(owned, 'Big')} / {notateNumber(cost, 'Big')}</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Measure;

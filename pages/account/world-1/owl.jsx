import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';

const MyComponent = () => {
  const { state } = useContext(AppContext);
  const { owl } = state?.account || {};
  const notation = (val) => val < 9999999 ? commaNotation(Math.ceil(val)) : notateNumber(val, 'Big')
  return <>
    <NextSeo
      title="Owl | Idleon Toolbox"
      description="Keep track of your owl upgrades and progress"
    />
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      <CardTitleAndValue cardSx={{my: 1}} title={'Feathers'} value={notation(owl?.feathers || 0)} icon={'etc/Owlb_0.png'}/>
      <CardTitleAndValue cardSx={{my: 1}} title={'Feathers/sec'} value={notation(owl?.bonuses?.[0]?.bonus)}
                         icon={'etc/Owlb_0.png'}/>
      <CardTitleAndValue cardSx={{my: 1}} title={'Feathers/hour'} value={notation(owl?.bonuses?.[0]?.bonus * 60 * 60)}
                         icon={'etc/Owlb_0.png'}/>
      <CardTitleAndValue cardSx={{my: 1}} title={'Next Lv'} value={owl?.nextLvReq > 0
        ? `${notateNumber(owl?.progress)}/${notateNumber(owl?.nextLvReq)}`
        : 'Done'}/>
    </Stack>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {owl?.bonuses.map(({ name, bonus, percentage }, index) => {
        if (index === 0) return;
        return <CardTitleAndValue cardSx={{my: 1}} key={name} title={name}
                                  value={`${!percentage ? '+' : ''}${commaNotation(bonus)}${percentage ? '%' : ''}`}
                                  icon={`etc/Owlb_${index}.png`}>
        </CardTitleAndValue>
      })}
    </Stack>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {owl?.megaFeathers?.map(({ description, unlocked, amount }, index) => {
        return <CardTitleAndValue cardSx={{my: 1}} value={amount > 0 ? amount : ''} tooltipTitle={cleanUnderscore(description)} key={'mega' + index} icon={`data/Feaz${index}.png`}
                                  imgStyle={{ width: 32, opacity: unlocked ? 1 : .5 }} imgOnly/>
      })}
    </Stack>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      {owl?.upgrades?.map(({ name, desc, level, cost }, index) => {
        return <Card key={'upgrade-' + index} sx={{ width: 350, mt: 1 }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack direction={'row'} gap={2}>
              <img src={`${prefix}etc/Owl_${index}.png`} alt={''}/>
              <Typography>{cleanUnderscore(name)}</Typography>
            </Stack>
            <Typography mt={1}>{cleanUnderscore(index === 4 ? desc.replace('{', owl?.restartMulti) : desc)}</Typography>
            <Stack mt={'auto'} direction={'row'} justifyContent={'space-between'}>
              <Typography>Lv. {level}</Typography>
              <Stack direction={'row'} gap={1}>
                <Typography>{cost < 9999999 ? commaNotation(Math.ceil(cost)) : notateNumber(cost, 'Big')}</Typography>
                <img src={`${prefix}etc/Owlb_0.png`} alt={''}/>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>

};

export default MyComponent;

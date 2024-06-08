import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';

const MyComponent = () => {
  const { state } = useContext(AppContext);
  const { owl } = state?.account || {};

  return <>
    <NextSeo
      title="Owl | Idleon Toolbox"
      description="Keep track of your owl upgrades and progress"
    />
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Feathers'} value={commaNotation(owl?.feathers || 0)} icon={'etc/Owlb_0.png'}/>
      {owl?.bonuses.map(({ name, bonus, percentage }, index) => {
        return <CardTitleAndValue key={name} title={name}
                                  value={`${!percentage ? '+' : ''}${commaNotation(bonus)}${percentage ? '%' : ''}`}
                                  icon={`etc/Owlb_${index}.png`}>
        </CardTitleAndValue>
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
                <Typography>{commaNotation(cost)}</Typography>
                <img src={`${prefix}etc/Feather.png`} alt={''}/>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>

};

export default MyComponent;

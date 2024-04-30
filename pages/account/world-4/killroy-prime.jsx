import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { notateNumber, prefix } from '@utility/helpers';

const MyComponent = () => {
  const { state } = useContext(AppContext);
  const { killroy } = state?.account || { deathNote: {} };
  return <>
    <NextSeo
      title="Killroy | Idleon Toolbox"
      description="Keep track of kill roy kills progression"
    />
    <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
      <CardTitleAndValue title={'Total Kills'} value={notateNumber(killroy.totalKills)}/>
      <CardTitleAndValue title={'Total Damage Multi'} value={`${killroy.totalDamageMulti}x`}/>
    </Stack>
    <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
      {killroy?.list?.map(({ rawName, world, killRoyKills, icon }, index) => {
        return <Card key={rawName + index}>
          <CardContent>
            <Stack alignItems={'center'} gap={1}>
              <img src={`${prefix}data/${icon}.png`} alt=""/>
              <Typography>{notateNumber(killRoyKills ?? 0, 'Big')}</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default MyComponent;

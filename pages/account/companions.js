import { NextSeo } from 'next-seo';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from '../../components/common/context/AppProvider';
import { companions } from '../../data/website-data';
import { cleanUnderscore, prefix } from '../../utility/helpers';

const Companions = () => {
  const { state } = useContext(AppContext);

  return <>
    <NextSeo
      title="Idleon Toolbox | Companions"
      description="Detailed information about companions and their bonuses"
    />
    <Typography textAlign={'center'} mt={2} mb={2} variant={'h2'}>Companions</Typography>
    <Stack direction={'row'} gap={3}>
      <Card sx={{ my: 3 }}>
        <CardContent>
          <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>Pet Crystals</Typography>
          <Typography>{state?.account?.companions?.petCrystals ?? 0}</Typography>
        </CardContent>
      </Card>
      <Card sx={{ my: 3 }}>
        <CardContent>
          <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>Total Box Opened</Typography>
          <Typography>{state?.account?.companions?.totalBoxesOpened ?? 0}</Typography>
        </CardContent>
      </Card>
    </Stack>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {companions?.map(({ name, effect }) => {
        return <Card key={name} sx={{ width: 200 }}>
          <CardContent sx={{ '&:last-child': { padding: 1 } }} sx={{ height: '100%' }}>
            <Stack gap={2} justifyContent={'center'}>
              <img width={50} height={50}
                   style={{ objectFit: 'contain' }}
                   src={`${prefix}afk_targets/${name}.png`} alt={''}/>
              <Typography>{cleanUnderscore(effect?.replace('{', '+'))}</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Companions;

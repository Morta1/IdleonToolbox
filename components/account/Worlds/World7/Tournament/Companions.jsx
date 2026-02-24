import React from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';

const byPowerDesc = (a, b) => (b.tourPower ?? 0) - (a.tourPower ?? 0);

const PetCard = ({ name, rawName, tourPower }) => (
  <Card key={rawName ?? name} sx={{ width: 100 }}>
    <CardContent sx={{ '&:last-child': { padding: 1 } }}>
      <Stack alignItems={'center'} gap={0.5}>
        <img
          width={42} height={42}
          style={{ objectFit: 'contain' }}
          src={`${prefix}afk_targets/${name}.png`}
          alt={''}
        />
        <Typography variant={'body2'} textAlign={'center'} fontSize={11}>
          {cleanUnderscore(name)}
        </Typography>
        {tourPower > 0 && (
          <Stack direction={'row'} alignItems={'center'} gap={0.5}>
            <img width={16} height={16} style={{ objectFit: 'contain' }} src={`${prefix}etc/Companion_Power.png`}
                 alt={''}/>
            <Typography variant={'caption'} color={'text.secondary'}>{tourPower}</Typography>
          </Stack>
        )}
      </Stack>
    </CardContent>
  </Card>
);

const PetSection = ({ title, pets }) => (
  <Stack gap={1}>
    <Typography variant={'subtitle2'} color={'text.secondary'}>
      {title} ({pets.length})
    </Typography>
    <Stack direction={'row'} gap={1.5} flexWrap={'wrap'}>
      {pets.map((pet, index) => <PetCard key={(pet.rawName ?? pet.name) + index} {...pet} />)}
    </Stack>
  </Stack>
);

const Companions = ({ companions }) => {
  const acquired = (companions ?? []).filter(c => c?.acquired).sort(byPowerDesc);
  const notOwned = (companions ?? []).filter(c => !c?.acquired && c.name && c?.effect !== 'Not_officially_in_the_game_and_may_never_be').sort(byPowerDesc);

  return (
    <Stack gap={3}>
      <PetSection title={'Owned'} pets={acquired}/>
      <PetSection title={'Not yet owned'} pets={notOwned}/>
    </Stack>
  );
};

export default Companions;

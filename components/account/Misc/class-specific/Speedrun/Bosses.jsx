import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';

const Bosses = ({ bosses, bossPortals }) => <Card sx={{ mb: 3 }}>
  <CardContent>
    <Typography variant={'h6'}>Bosses</Typography>
    <Typography variant={'body2'} color={'text.secondary'} sx={{ mb: 1.5 }}>
      {bossPortals > 0
        ? 'Each boss kill is worth its difficulty plus one in portals, and speeds mob respawn for the rest of the run.'
        : 'Level "Bossing in Vain" to make boss kills count as portals.'}
    </Typography>
    <Divider sx={{ mb: 1.5 }}/>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      {bosses.map(({ mapIndex, name, world, difficultyName, portals }) => <Stack
        key={mapIndex} sx={{ px: 1.5, py: 0.5, borderRadius: 1, bgcolor: 'background.default' }}>
        <Typography variant={'body2'}>{name}</Typography>
        <Typography variant={'caption'} color={'text.secondary'}>
          W{world} &middot; {difficultyName} &middot; {bossPortals > 0 ? `+${portals}` : '+0'} portals
        </Typography>
      </Stack>)}
    </Stack>
  </CardContent>
</Card>;

export default Bosses;

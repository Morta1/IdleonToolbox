import React from 'react';
import { Card, CardContent, Link, Stack, Typography } from '@mui/material';
import { KIND_PLURALS } from './EntityPanel';
import { KindArt } from './CategoryTiles';

// The category pages used to open on a thin line of text and a row of controls, which is most of
// why they read as empty. This is the band the three explored directions all shared, so it lands
// regardless of how the body below it is laid out.
const BLURB = {
  item: 'Every item in Legends of Idleon: what drops it, what it crafts into, and which quests want it.',
  monster: 'Every enemy in Legends of Idleon, what it drops and where it spawns.',
  npc: 'Everyone who gives a quest, and what they want for it.',
  vial: 'Every alchemy vial, what it is brewed from and what it gives you.',
  bubble: 'Every cauldron bubble, its ingredients and its effect.'
};

const CategoryHeader = ({ kind, count, onBack }) => <Card variant={'outlined'}>
  <CardContent>
    <Stack direction={'row'} gap={2} alignItems={'center'}>
      <KindArt kind={kind} size={56}/>
      <Stack sx={{ minWidth: 0 }}>
        <Stack direction={'row'} gap={0.75} alignItems={'baseline'}>
          <Link component={'button'} type={'button'} variant={'body2'} underline={'hover'} onClick={onBack}>
            Wiki
          </Link>
          <Typography variant={'caption'} color={'text.disabled'}>/</Typography>
          <Typography variant={'caption'} color={'text.secondary'}>{KIND_PLURALS[kind] || kind}</Typography>
        </Stack>
        <Typography variant={'h5'} component={'h2'}>{KIND_PLURALS[kind] || kind}</Typography>
        <Typography variant={'caption'} color={'text.secondary'}>{BLURB[kind]}</Typography>
      </Stack>
      <Stack sx={{ ml: 'auto', textAlign: 'right', flexShrink: 0 }}>
        <Typography variant={'h5'} sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {count.toLocaleString('en-US')}
        </Typography>
        <Typography variant={'caption'} color={'text.secondary'} textTransform={'uppercase'}>
          {(KIND_PLURALS[kind] || kind).toLowerCase()}
        </Typography>
      </Stack>
    </Stack>
  </CardContent>
</Card>;

export default CategoryHeader;

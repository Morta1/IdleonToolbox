import React from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { KIND_PLURALS } from '@utility/wiki/kind-labels.mjs';
import { KindArt } from './kind-art';
import { formatNum } from '@utility/helpers';

// The category pages used to open on a thin line of text and a row of controls, which is most of
// why they read as empty. This is the band the three explored directions all shared, so it lands
// regardless of how the body below it is laid out.
const BLURB = {
  item: 'Every item in Legends of Idleon: what drops it, what it crafts into, and which quests want it.',
  monster: 'Every enemy in Legends of Idleon, what it drops and where it spawns.',
  npc: 'Everyone who gives a quest, and what they want for it.',
  achievement: 'Every achievement, banded by world, with the gems and time candy it pays out.',
  world: 'Every world, and every area inside it with the enemy that lives there.',
  class: 'Every class, what it promotes into, and the talents it brings with it.',
  talent: 'Every talent in the game, what it does at each level, and what it costs to cast.',
  pet: 'Every companion pet, its bonus, and the bundle it came in.',
  bundle: 'Every bundle the game has sold, and what each one hands over.',
  vial: 'Every alchemy vial, what it is brewed from and what it gives you.',
  bubble: 'Every cauldron bubble, its ingredients and its effect.'
};

const CategoryHeader = ({ kind, count }) => <Card variant={'outlined'}>
  <CardContent>
    {/* Below sm the count wraps onto its own line under the name, so a long name keeps the width */}
    <Stack direction={'row'} gap={2} alignItems={'center'} sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' }, rowGap: { xs: 1, sm: 2 } }}>
      <KindArt kind={kind} size={56}/>
      <Stack sx={{ minWidth: 0, flex: { xs: '1 1 0', sm: '0 1 auto' } }}>
        <Typography variant={'pageTitle'} component={'h2'}>{KIND_PLURALS[kind] || kind}</Typography>
        <Typography variant={'caption'} color={'text.secondary'}>{BLURB[kind]}</Typography>
      </Stack>
      <Stack sx={{
        ml: { xs: 0, sm: 'auto' }, pl: { xs: 9, sm: 0 }, flexBasis: { xs: '100%', sm: 'auto' }, flexShrink: 0,
        flexDirection: { xs: 'row', sm: 'column' }, alignItems: { xs: 'baseline', sm: 'stretch' }, gap: { xs: 1, sm: 0 },
        textAlign: { xs: 'left', sm: 'right' }
      }}>
        <Typography variant={'heroValue'} component={'div'}>
          {formatNum(count, 'amount')}
        </Typography>
        <Typography variant={'groupLabel'} component={'div'} color={'text.secondary'}>
          {(KIND_PLURALS[kind] || kind).toLowerCase()}
        </Typography>
      </Stack>
    </Stack>
  </CardContent>
</Card>;

export default CategoryHeader;

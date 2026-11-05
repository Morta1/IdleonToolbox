import React from 'react';
import { Stack, Typography } from '@mui/material';
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

// A plural inside a sentence: lowercase word by word, but an acronym stays as written ("NPCs", "dungeon RNG items").
export const pluralInSentence = (plural) => plural.split(' ').map((word) => (/[A-Z].*[A-Z]/.test(word) ? word : word.toLowerCase())).join(' ');

const CategoryHeader = ({ kind, count }) => <Stack direction={'row'} gap={2} alignItems={'center'}>
  <KindArt kind={kind} size={56}/>
  <Stack sx={{ minWidth: 0 }}>
    <Typography variant={'pageTitle'} component={'h2'}>{KIND_PLURALS[kind] || kind}</Typography>
    <Typography variant={'body2'} color={'text.secondary'}>
      {formatNum(count, 'whole')} {pluralInSentence(KIND_PLURALS[kind] || kind)}
    </Typography>
    {BLURB[kind] ? <Typography variant={'caption'} color={'text.secondary'}>{BLURB[kind]}</Typography> : null}
  </Stack>
</Stack>;

export default CategoryHeader;

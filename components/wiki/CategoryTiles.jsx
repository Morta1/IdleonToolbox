import React from 'react';
import { Box, Card, CardActionArea, Stack, Typography } from '@mui/material';
import { KIND_PLURALS } from './EntityPanel';
import { LISTED_KINDS } from '@utility/wiki/kinds.mjs';
import { prefix } from '@utility/helpers';

// One recognisable piece of the game per category, picked for being the thing a player meets first:
// Copper Ore, Green Mushroom, Scripticus.
export const KIND_ART = {
  item: 'data/Copper.png',
  monster: 'monsters/mushG/static.png',
  npc: 'npcs/Scripticus/static.png',
  // The first achievement the game hands out, and the one every player has.
  achievement: 'data/TaskAchA1.png',
  // The first bubble of the first cauldron, and the flask the game draws at every vial level.
  bubble: 'data/aUpgradesO0.png',
  vial: 'data/aVials1.png',
  // Beginner, which every character starts as.
  class: 'data/ClassIcons1.png',
  // The first talent every character gets, and the icon the game files at index 0.
  talent: 'data/UISkillIcon0.png',
  // Whale: an Exclusive pet, and the one the site's own tournament page draws first.
  pet: 'monsters/Pet4/static.png',
  // The great tree on Blunder Hills, cut out of that world's own map. The full maps are 811x433
  // and letterbox to an unreadable strip in a square tile, so the tile takes the one landmark on
  // them that survives being 44px wide.
  world: 'etc/World_Category.png',
  // Not a bundle banner: at tile size a 711x120 strip is unreadable either squashed or cropped.
  // The gem chest is what every bundle is drawn around, and it is square.
  bundle: 'data/PremiumGem.png'
};

// Every listed kind carries real art, so there is no drawn stand-in any more: the glyphs existed
// for quests, maps and shops, and none of the three has a listing left.
export const KindArt = ({ kind, size = 44 }) => {
  const art = KIND_ART[kind];
  if (!art) return null;
  return <img
    src={`${prefix}${art}`}
    alt={''}
    width={size}
    height={size}
    style={{ objectFit: 'contain', flexShrink: 0 }}
  />;
};

// The way in for someone who does not yet know what to search for. Counts are shown because they
// set the expectation before the click: Shops is nine rows, Items is a few thousand.
const CategoryTiles = ({ searchList, onSelect }) => {
  const counts = {};
  for (const entry of searchList) counts[entry.kind] = (counts[entry.kind] || 0) + 1;

  return <Box sx={{
    display: 'grid',
    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
    gap: 1.5
  }}>
    {LISTED_KINDS.filter((kind) => counts[kind]).map((kind) => <Card key={kind} variant={'outlined'}>
      <CardActionArea onClick={() => onSelect(kind)} sx={{ p: 1.5 }}>
        <Stack direction={'row'} gap={1.5} alignItems={'center'}>
          <KindArt kind={kind}/>
          <Stack gap={0.25}>
            <Typography fontWeight={600}>{KIND_PLURALS[kind] || kind}</Typography>
            <Typography variant={'caption'} color={'text.secondary'}>
              {counts[kind].toLocaleString('en-US')}
            </Typography>
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>)}
  </Box>;
};

export default CategoryTiles;

import React from 'react';
import { Box, Card, CardActionArea, Stack, Typography } from '@mui/material';
import { KIND_PLURALS } from './EntityPanel';
import { LISTED_KINDS } from '@utility/wiki/kinds.mjs';
import { prefix } from '@utility/helpers';

// One recognisable piece of the game per category, picked for being the thing a player meets first:
// Copper Ore, Green Mushroom, Scripticus.
const KIND_ART = {
  item: 'data/Copper.png',
  monster: 'afk_targets/Green_Mushroom.png',
  npc: 'npcs/Scripticus.gif',
  // The first bubble of the first cauldron, and the flask the game draws at every vial level.
  bubble: 'data/aUpgradesO0.png',
  vial: 'data/aVials1.png'
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
    style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }}
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

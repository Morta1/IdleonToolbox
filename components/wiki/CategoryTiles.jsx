import React from 'react';
import { Box, Card, CardActionArea, Stack, Typography } from '@mui/material';
import { KIND_PLURALS } from './EntityPanel';
import { KIND_GROUPS } from '@utility/wiki/kinds.mjs';
import { prefix } from '@utility/helpers';

// One recognisable piece of the game per category, picked for being the thing a player meets first:
// Copper Ore, Green Mushroom, Scripticus.
export const KIND_ART = {
  item: 'data/Copper.png',
  monster: 'monsters/mushG/static.png',
  npc: 'npcs/Scripticus/static.png',
  // The first achievement the game hands out, and the one every player has.
  achievement: 'data/TaskAchA1.png',
  // The app's own Bubbles page icon, and the flask the game draws at every vial level.
  bubble: 'data/aBrewOptionA0.png',
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
  bundle: 'data/PremiumGem.png',
  // The game systems wear the icon of their page in the app's own menu (components/constants.jsx),
  // so a player recognises the tile from the site they already use. Where the app has no page of
  // its own (chips and jewels share the Lab's, star signs and post office boxes have none), the
  // system's first entry stands in.
  vault: 'data/VaultBut.png',
  starsign: 'data/SignStar1b.png',
  constellation: 'data/StarTitle1.png',
  postbox: 'data/UIboxUpg0.png',
  sigil: 'data/LabBonus12.png',
  arcade: 'data/PachiBall1.png',
  building: 'data/ConTower7.png',
  prayer: 'data/PrayerSel.png',
  equinox: 'data/Quest78.png',
  chip: 'data/ConsoleChip0.png',
  jewel: 'data/ConsoleJwl0.png',
  meal: 'data/ClassIcons51.png',
  god: 'data/ClassIcons55.png',
  artifact: 'data/Arti29.png',
  superbit: 'data/ClassIcons56.png',
  jade: 'data/ClassIcons58.png'
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

  return <Stack gap={2.5}>
    {KIND_GROUPS.map((group) => {
      const kinds = group.kinds.filter((kind) => counts[kind]);
      if (kinds.length === 0) return null;
      return <Stack key={group.label} gap={1}>
        <Typography variant={'subtitle2'} color={'text.secondary'} textTransform={'uppercase'} letterSpacing={0.5}>
          {group.label}
        </Typography>
        {/* The encyclopedia keeps the big tiles; a world's systems are many small catalogs, so they
            take a compact one-line tile and four to a row. */}
        {group.collapsible ? <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 1
        }}>
          {kinds.map((kind) => <Card key={kind} variant={'outlined'}>
            <CardActionArea onClick={() => onSelect(kind)} sx={{ px: 1.25, py: 0.75 }}>
              <Stack direction={'row'} gap={1} alignItems={'center'}>
                <KindArt kind={kind} size={28}/>
                <Typography variant={'body2'} fontWeight={600} sx={{ flexGrow: 1, minWidth: 0, lineHeight: 1.2 }}>
                  {KIND_PLURALS[kind] || kind}
                </Typography>
                <Typography variant={'caption'} color={'text.secondary'}>
                  {counts[kind].toLocaleString('en-US')}
                </Typography>
              </Stack>
            </CardActionArea>
          </Card>)}
        </Box> : <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
          gap: 1.5
        }}>
          {kinds.map((kind) => <Card key={kind} variant={'outlined'}>
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
        </Box>}
      </Stack>;
    })}
  </Stack>;
};

export default CategoryTiles;

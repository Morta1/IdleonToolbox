import { Box, Stack, Typography } from '@mui/material';
import StatusText from '@components/common/StatusText';
import { formatNum } from '@utility/helpers';
import React from 'react';
import BlackStars, { BlackStarPreviews } from './BlackStars';
import HiddenCapLine from '@components/common/HiddenCapLine';
import { NoteTrigger } from '@components/common/InfoButton';
import GameIcon from '@components/common/GameIcon';
import ItemCard from '@components/common/cards/ItemCard';
import { colourName, paletteOdds } from './CardView';

const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
// The board's glows for the active colours and the fastest to level, on the theme's primary and warning channels
const glow = (channel) => `drop-shadow(0 0 8px rgba(var(--mui-palette-${channel}-mainChannel) / 0.8)) drop-shadow(0 0 4px rgba(var(--mui-palette-${channel}-mainChannel) / 1))`;
// Dark text on the colour's own fill, with a light halo, as the game's board draws it
const ON_FILL_SX = { position: 'relative', textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8)', pointerEvents: 'none', zIndex: 2, color: 'common.black' };

// A hex's details, the card's content: a click, a tap or Enter pins it
const hexNote = (item, isTop3, blackStarsOwned) => {
  const { description, level, active, blackStars, blackStarMulti, blackStarPreviews } = item;
  return <Stack gap={0.5}>
    <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
      <Typography variant={'cardTitle'} component={'div'}>{colourName(item)}</Typography>
      {active ? <StatusText status={'active'}/> : null}
      {isTop3 ? <StatusText status={'best'}>Fastest to level</StatusText> : null}
    </Stack>
    {level !== undefined ? <Typography variant={'body2'}>{formatNum(level, 'level')}</Typography> : null}
    {blackStars > 0 ? <Stack direction={'row'} alignItems={'center'} gap={0.5}>
      <BlackStars count={blackStars}/>
      <Typography variant={'body2'}>{formatNum(blackStarMulti ?? 1, 'mult')}</Typography>
    </Stack> : null}
    {description ? <ItemCard.Desc text={description}/> : null}
    <HiddenCapLine system={'palette'} index={item.index} inline/>
    <BlackStarPreviews description={description} previews={blackStarPreviews} owned={blackStarsOwned}/>
  </Stack>;
};

// The game's palette board: each colour where the game places it, its fill from the game's data (x0, x1, x2)
const HexagonView = ({ palette, hexagonPositions, gridBounds, hexagonSize, itemMatchesSearch, searching, fastestIndices, blackStarsOwned }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: 600, // Minimum height to ensure enough space
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'auto'
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: gridBounds.width,
          height: gridBounds.height,
          margin: 'auto'
        }}
      >
        {palette.map((item, index) => {
          if (typeof item !== 'object' || !item) return null;

          const { level, chance, x0, x1, x2, active, blackStars } = item;
          const position = hexagonPositions[index];
          const hasLevel = level !== undefined && level > 0.5;
          const dimmed = searching && !itemMatchesSearch(item);
          const isTop3 = fastestIndices.has(item.index);
          const odds = chance !== undefined && chance > 0 && chance < Infinity ? paletteOdds(chance) : null;

          // RGB color values (x0, x1, x2 are R, G, B from the game's palette data)
          const r = x0 !== undefined ? Math.round(Math.max(0, Math.min(255, x0))) : 255;
          const g = x1 !== undefined ? Math.round(Math.max(0, Math.min(255, x1))) : 255;
          const b = x2 !== undefined ? Math.round(Math.max(0, Math.min(255, x2))) : 255;

          // Only apply color if level > 0.5 and color is not white
          const shouldColorize = hasLevel && (r !== 255 || g !== 255 || b !== 255);
          const colorValue = `rgb(${r}, ${g}, ${b})`;
          const ring = active || isTop3;

          return <NoteTrigger key={`hexagon-${index}`} note={hexNote(item, isTop3, blackStarsOwned)} label={colourName(item)}
                              sx={{
                                position: 'absolute',
                                left: position.x - gridBounds.offsetX,
                                top: position.y - gridBounds.offsetY,
                                width: hexagonSize,
                                height: hexagonSize,
                                transition: 'all 0.2s',
                                opacity: dimmed ? 0.3 : 1,
                                filter: dimmed ? 'grayscale(70%)' : 'none',
                                ...(hasLevel ? { '&:hover': { transform: 'scale(1.02)', zIndex: 10 } } : {})
                              }}>
            {hasLevel ? <Box sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Border hexagon (outer layer) for active or top 3 */}
              {ring ? <Box sx={{
                position: 'absolute',
                inset: 0,
                clipPath: HEX_CLIP,
                backgroundColor: active ? 'primary.main' : 'warning.main',
                filter: `drop-shadow(0 0 8px rgba(var(--mui-palette-${active ? 'primary' : 'warning'}-mainChannel) / 0.6))`,
                pointerEvents: 'none'
              }}/> : null}
              {/* Inner hexagon (main content) */}
              <Box sx={{
                position: 'absolute',
                top: ring ? '4%' : 0,
                left: ring ? '4%' : 0,
                width: ring ? '92%' : '100%',
                height: ring ? '92%' : '100%',
                clipPath: HEX_CLIP,
                border: 1,
                borderColor: active ? 'primary.main' : isTop3 ? 'warning.main' : 'common.black',
                bgcolor: 'common.white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {shouldColorize ? <Box sx={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: colorValue,
                  clipPath: HEX_CLIP,
                  opacity: 0.7,
                  pointerEvents: 'none'
                }}/> : null}
                <Stack gap={1} alignItems={'center'} justifyContent={'center'}>
                  {level > 0 ? <Typography variant={'value'} component={'div'} sx={ON_FILL_SX}>
                    {formatNum(level, 'level')}
                  </Typography> : null}
                  <BlackStars count={blackStars}/>
                  {odds ? <Typography variant={'caption'} sx={ON_FILL_SX}>{odds}</Typography> : null}
                </Stack>
              </Box>
            </Box> : <Box sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              ...(active ? { filter: glow('primary'), '& img': { filter: 'brightness(1.2)' } }
                : isTop3 ? { filter: glow('warning'), '& img': { filter: 'brightness(1.2)' } } : {})
            }}>
              <GameIcon src={'data/GamingHexB.png'} size={hexagonSize} fit={'canvas'} alt={''}/>
              <Stack sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                {odds ? <Typography variant={'caption'}>{odds}</Typography> : null}
              </Stack>
            </Box>}
          </NoteTrigger>;
        })}
      </Box>
    </Box>
  );
};

export default HexagonView;

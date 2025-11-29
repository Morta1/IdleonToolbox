import { Box, Tooltip, Typography, Stack, Chip } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix, commaNotation } from '../../../../../../utility/helpers';
import React from 'react';

const HexagonView = ({ palette, hexagonPositions, gridBounds, hexagonSize, itemMatchesSearch, searchTerm, selectedSlots }) => {

  // Find top 3 with highest chance values
  const itemsWithIndex = palette
    .map((item, index) => ({ item, index, chance: item?.chance || 0 }))
    .filter(({ chance }) => chance > 0 && chance < Infinity);

  const sortedByChance = [...itemsWithIndex].sort((a, b) => b.chance - a.chance);
  const topIndices = new Set(sortedByChance.slice(0, selectedSlots ?? 3).map(({ index }) => index));

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

          const { name, description, bonus, level, chance, x0, x1, x2, active } = item;
          const position = hexagonPositions[index];
          const hasLevel = level !== undefined && level > 0.5;
          const hexImage = hasLevel ? null : 'GamingHexB.png';
          const matchesSearch = itemMatchesSearch(item);
          const isTop3 = topIndices.has(index);

          // RGB color values (x0, x1, x2 are R, G, B from the game's palette data)
          const r = x0 !== undefined ? Math.round(Math.max(0, Math.min(255, x0))) : 255;
          const g = x1 !== undefined ? Math.round(Math.max(0, Math.min(255, x1))) : 255;
          const b = x2 !== undefined ? Math.round(Math.max(0, Math.min(255, x2))) : 255;

          // Only apply color if level > 0.5 and color is not white
          const shouldColorize = hasLevel && (r !== 255 || g !== 255 || b !== 255);
          const colorValue = `rgb(${r}, ${g}, ${b})`;
          const chanceValue = 1 / chance;
          const formattedChance = chanceValue > 999999 ? notateNumber(chanceValue, 'Big') : commaNotation(chanceValue);

          return (
            <Tooltip
              key={`hexagon-${index}`}
              title={
                <Stack>
                  <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {cleanUnderscore(name || `Palette ${index + 1}`)}
                    </Typography>
                    {active && (
                      <Chip
                        label="ACTIVE"
                        color="primary"
                        size="small"
                        sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}
                      />
                    )}
                    {isTop3 && (
                      <Chip
                        label="FASTEST TO LEVEL"
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          backgroundColor: '#d18d28',
                          color: '#000'
                        }}
                      />
                    )}
                  </Stack>
                  {level !== undefined && (
                    <Typography>Lv. {notateNumber(level)}</Typography>
                  )}
                  {description && (
                    <Typography>{cleanUnderscore(description)}</Typography>
                  )}
                </Stack>
              }
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: position.x - gridBounds.offsetX,
                  top: position.y - gridBounds.offsetY,
                  width: hexagonSize,
                  height: hexagonSize,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  opacity: searchTerm.trim() && !matchesSearch ? 0.3 : 1,
                  filter: searchTerm.trim() && !matchesSearch ? 'grayscale(70%)' : 'none',
                  ...(hasLevel ? {
                    '&:hover': {
                      transform: 'scale(1.02)',
                      zIndex: 10
                    }
                  } : {})
                }}
              >
                {hexImage ? (
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      ...(active && {
                        filter: 'drop-shadow(0 0 8px rgba(25, 118, 210, 0.8)) drop-shadow(0 0 4px rgba(25, 118, 210, 1))',
                        '& img': {
                          filter: 'brightness(1.2)'
                        }
                      }),
                      ...(!active && isTop3 && {
                        filter: 'drop-shadow(0 0 8px rgba(255, 152, 0, 0.8)) drop-shadow(0 0 4px rgba(255, 152, 0, 1))',
                        '& img': {
                          filter: 'brightness(1.2)'
                        }
                      })
                    }}
                  >
                    <img
                      src={`${prefix}data/${hexImage}`}
                      alt={cleanUnderscore(name || `Palette ${index + 1}`)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                    <Stack sx={
                      {
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center'
                      }
                    }
                    >
                      {chance !== undefined && chance > 0 && (
                        <Typography
                          variant='caption'

                        >
                          1 in {formattedChance}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Border hexagon (outer layer) for active or top 3 */}
                    {(active || isTop3) && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                          backgroundColor: active ? '#1976d2' : '#ff9800',
                          filter: active
                            ? 'drop-shadow(0 0 8px rgba(25, 118, 210, 0.6))'
                            : 'drop-shadow(0 0 8px rgba(255, 152, 0, 0.6))',
                          pointerEvents: 'none'
                        }}
                      />
                    )}
                    {/* Inner hexagon (main content) */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: (active || isTop3) ? '4%' : 0,
                        left: (active || isTop3) ? '4%' : 0,
                        width: (active || isTop3) ? '92%' : '100%',
                        height: (active || isTop3) ? '92%' : '100%',
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        border: `1px solid ${active ? '#1976d2' : isTop3 ? '#ff9800' : 'black'}`,
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {shouldColorize && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: colorValue,
                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                            opacity: 0.7,
                            pointerEvents: 'none'
                          }}
                        />
                      )}
                      <Stack gap={1} alignItems={'center'} justifyContent={'center'}>
                        {level !== undefined && level > 0 && (
                          <Typography
                            sx={{
                              position: 'relative',
                              fontSize: '0.875rem',
                              fontWeight: 'bold',
                              textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8)',
                              pointerEvents: 'none',
                              zIndex: 2,
                              color: '#000000'
                            }}
                          >
                            Lv. {level}
                          </Typography>
                        )}
                        {chance !== undefined && chance > 0 && (
                          <Typography
                            variant='caption'
                            sx={{
                              position: 'relative',
                              color: '#000000',
                              textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8)',
                              pointerEvents: 'none',
                              zIndex: 2
                            }}
                          >
                            1 in {formattedChance}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

export default HexagonView;


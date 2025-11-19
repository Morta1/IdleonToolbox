import { Card, CardContent, Stack, Typography, ToggleButtonGroup, ToggleButton, Box, Tooltip, TextField } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '../../../../../utility/helpers';
import { CardTitleAndValue } from '../../../../common/styles';
import React, { useState, useMemo } from 'react';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { IconLayoutDashboardFilled } from '@tabler/icons-react';

const Palette = ({ account }) => {
  const { palette, paletteFinalBonus, paletteLuck } = account?.gaming || {};
  const [viewMode, setViewMode] = useState('card');
  const [searchTerm, setSearchTerm] = useState('');

  if (!palette) return null;

  // The palette array has 37 items plus a final bonus value at index 37

  // Hexagon size - can be adjusted to make hexagons bigger
  const hexagonSize = 96; // Increased from 64px

  // Calculate hexagon positions for indices 0-36 and grid bounds for centering
  const { hexagonPositions, gridBounds } = useMemo(() => {
    const positions = [];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    // Scale factor to adjust positions for larger hexagons
    const scaleFactor = hexagonSize / 64;

    for (let s = 0; s < 37; s++) {
      const baseX = 80 + Math.floor((s + 0.5) / 7.5) % 2 * -33 + 66 * Math.ceil(s - Math.floor(7.5 * Math.floor((s + 0.5) / 7.5)));
      const baseY = 91 + 56 * Math.floor((s + 0.5) / 7.5);
      // Scale positions proportionally
      const x = baseX * scaleFactor;
      const y = baseY * scaleFactor;
      positions.push({ x, y });

      // Track bounds (including hexagon size)
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + hexagonSize);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + hexagonSize);
    }

    return {
      hexagonPositions: positions,
      gridBounds: {
        width: maxX - minX,
        height: maxY - minY,
        offsetX: minX,
        offsetY: minY
      }
    };
  }, [hexagonSize]);

  // Filter palette items based on search term (for card view)
  const filteredPalette = useMemo(() => {
    if (!searchTerm.trim()) return palette;

    const searchLower = searchTerm.toLowerCase();
    return palette?.filter((item) => {
      if (typeof item !== 'object' || !item) return false;
      const { name, description } = item;
      const nameStr = cleanUnderscore(name || '').toLowerCase();
      const descStr = cleanUnderscore(description || '').toLowerCase();
      return nameStr.includes(searchLower) || descStr.includes(searchLower);
    }) || [];
  }, [palette, searchTerm]);

  // Check if an item matches the search (for hexagon view highlighting)
  const itemMatchesSearch = useMemo(() => {
    if (!searchTerm.trim()) return () => true;

    const searchLower = searchTerm.toLowerCase();
    return (item) => {
      if (typeof item !== 'object' || !item) return false;
      const { name, description } = item;
      const nameStr = cleanUnderscore(name || '').toLowerCase();
      const descStr = cleanUnderscore(description || '').toLowerCase();
      return nameStr.includes(searchLower) || descStr.includes(searchLower);
    };
  }, [searchTerm]);

  const renderCardView = () => {
    return (
      <Stack gap={2} direction={'row'} flexWrap={'wrap'} sx={{ maxWidth: 300 * 7 }}>
        {filteredPalette?.map((item, index) => {
          // Skip if item is not an object (the final bonus is a number)
          if (typeof item !== 'object' || !item) return null;

          const { name, description, bonus, level } = item;
          const hasBonus = bonus !== undefined && bonus !== null && bonus !== 0;

          return (
            <Card
              key={`palette-${index}`}
              sx={{
                width: 300,
                border: hasBonus ? '1px solid' : '',
                borderColor: hasBonus ? 'success.main' : '',
                opacity: !hasBonus ? 0.5 : 1
              }}
            >
              <CardContent>
                <Typography variant={'body1'} sx={{ fontWeight: 'bold', mb: 1 }}>
                  {cleanUnderscore(name || `Palette ${index + 1}`)}
                </Typography>
                {level !== undefined && (
                  <Typography variant={'body2'} sx={{ mb: 1, color: 'text.secondary' }}>
                    Level: {notateNumber(level)}
                  </Typography>
                )}
                {description && (
                  <Typography variant={'body2'} sx={{ mb: 1 }}>
                    {cleanUnderscore(description)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    );
  };

  const renderHexagonView = () => {
    const hexagonItems = palette?.slice(0, 37) || []; // Only first 37 items (exclude final bonus)

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
          {hexagonItems.map((item, index) => {
            if (typeof item !== 'object' || !item) return null;

            const { name, description, bonus, level, x0, x1, x2 } = item;
            const position = hexagonPositions[index];
            const hasLevel = level !== undefined && level > 0.5;
            const hexImage = hasLevel ? null : 'GamingHexB.png';
            const matchesSearch = itemMatchesSearch(item);

            // RGB color values (x0, x1, x2 are R, G, B from the game's palette data)
            const r = x0 !== undefined ? Math.round(Math.max(0, Math.min(255, x0))) : 255;
            const g = x1 !== undefined ? Math.round(Math.max(0, Math.min(255, x1))) : 255;
            const b = x2 !== undefined ? Math.round(Math.max(0, Math.min(255, x2))) : 255;

            // Only apply color if level > 0.5 and color is not white
            const shouldColorize = hasLevel && (r !== 255 || g !== 255 || b !== 255);
            const colorValue = `rgb(${r}, ${g}, ${b})`;

            return (
              <Tooltip
                key={`hexagon-${index}`}
                title={
                  <Stack>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {cleanUnderscore(name || `Palette ${index + 1}`)}
                    </Typography>
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
                        height: '100%'
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
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        border: `1px solid black`,
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
                      {level !== undefined && level > 0 && (
                        <Typography
                          sx={{
                            position: 'relative',
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            color: '#000000',
                            textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8)',
                            pointerEvents: 'none',
                            zIndex: 2
                          }}
                        >
                          Lv. {level}
                        </Typography>
                      )}
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

  return <>
    <Stack direction="row" alignItems="center" mb={3} gap={2} flexWrap="wrap">
      {paletteFinalBonus !== undefined && (
        <CardTitleAndValue
          title={'Palette Final Bonus'}
          value={notateNumber(paletteFinalBonus)}
        />
      )}
      {paletteLuck !== undefined && (
        <CardTitleAndValue
          title={'Palette Luck'}
          value={`${notateNumber(paletteLuck, 'MultiplierInfo')}x`}
        />
      )}
      <TextField
        label="Search by name or description"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        size="small"
        sx={{ width: 250 }}
      />
      <Stack direction="row" alignItems="center" gap={2} sx={{ ml: 'auto' }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => {
            if (newMode) setViewMode(newMode);
          }}
          size="small"
        >
          <ToggleButton value="card" aria-label="card view">
            <Tooltip title="Card View">
              <ViewModuleIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="hexagon" aria-label="hexagon grid">
            <Tooltip title="Hexagon Grid">
              <IconLayoutDashboardFilled />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Stack>
    {viewMode === 'card' ? renderCardView() : renderHexagonView()}
  </>;
};

export default Palette;


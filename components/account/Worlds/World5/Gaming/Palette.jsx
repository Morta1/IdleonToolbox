import { Stack, ToggleButtonGroup, ToggleButton, TextField, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber } from '../../../../../utility/helpers';
import { CardTitleAndValue } from '../../../../common/styles';
import React, { useState, useMemo } from 'react';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { IconLayoutDashboardFilled, IconInfoCircleFilled } from '@tabler/icons-react';
import CardView from './Palette/CardView';
import HexagonView from './Palette/HexagonView';
import { CardWithBreakdown } from '@components/account/Worlds/World5/Hole/commons';
import Tooltip from '@components/Tooltip';

const Palette = ({ account }) => {
  const { palette, paletteFinalBonus, paletteLuck, selectedSlots } = account?.gaming || {};
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

  return <>
    <Stack direction="row" alignItems="center" mb={3} gap={2} flexWrap="wrap">
      {paletteFinalBonus !== undefined && (
        <CardTitleAndValue
          title={'Palette Final Bonus'}
          value={notateNumber(paletteFinalBonus)}
        />
      )}
      {paletteLuck !== undefined && (
        <CardWithBreakdown
          title={'Palette Luck'}
          value={`${notateNumber(paletteLuck?.value, 'MultiplierInfo')}x`}
          breakdown={paletteLuck?.breakdown}
          notation={'MultiplierInfo'}
        />
      )}
      <CardTitleAndValue
        title={'Selected Slots'}
        value={selectedSlots}
      />
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
    {viewMode === 'card' ? (
      <CardView filteredPalette={filteredPalette} />
    ) : (
      <HexagonView
        palette={palette}
        hexagonPositions={hexagonPositions}
        gridBounds={gridBounds}
        hexagonSize={hexagonSize}
        itemMatchesSearch={itemMatchesSearch}
        searchTerm={searchTerm}
        selectedSlots={selectedSlots}
      />
    )}
  </>;
};

export default Palette;


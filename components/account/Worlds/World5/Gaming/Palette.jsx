import { Stack, ToggleButtonGroup, ToggleButton, TextField, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber } from '@utility/helpers';
import { CardTitleAndValue } from '../../../../common/styles';
import React, { useState } from 'react';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { IconLayoutDashboardFilled, IconInfoCircleFilled } from '@tabler/icons-react';
import CardView from './Palette/CardView';
import HexagonView from './Palette/HexagonView';
import { CardWithBreakdown } from '@components/account/Worlds/World5/Hole/commons';
import Tooltip from '@components/Tooltip';

// Hexagon geometry is constant — computed once at module level
const HEXAGON_SIZE = 96;
const HEXAGON_POSITIONS = [];
let _minX = Infinity, _maxX = -Infinity, _minY = Infinity, _maxY = -Infinity;
const SCALE_FACTOR = HEXAGON_SIZE / 64;
for (let s = 0; s < 37; s++) {
  const baseX = 80 + Math.floor((s + 0.5) / 7.5) % 2 * -33 + 66 * Math.ceil(s - Math.floor(7.5 * Math.floor((s + 0.5) / 7.5)));
  const baseY = 91 + 56 * Math.floor((s + 0.5) / 7.5);
  const x = baseX * SCALE_FACTOR;
  const y = baseY * SCALE_FACTOR;
  HEXAGON_POSITIONS.push({ x, y });
  _minX = Math.min(_minX, x);
  _maxX = Math.max(_maxX, x + HEXAGON_SIZE);
  _minY = Math.min(_minY, y);
  _maxY = Math.max(_maxY, y + HEXAGON_SIZE);
}
const GRID_BOUNDS = { width: _maxX - _minX, height: _maxY - _minY, offsetX: _minX, offsetY: _minY };

const Palette = ({ account }) => {
  const { palette, paletteFinalBonus, paletteLuck, selectedSlots } = account?.gaming || {};
  const [viewMode, setViewMode] = useState('card');
  const [searchTerm, setSearchTerm] = useState('');
  if (!palette) return null;

  const hexagonSize = HEXAGON_SIZE;
  const hexagonPositions = HEXAGON_POSITIONS;
  const gridBounds = GRID_BOUNDS;

  // Filter palette items based on search term (for card view)
  const paletteSearchLower = searchTerm.trim().toLowerCase();
  const filteredPalette = !paletteSearchLower ? palette : palette?.filter((item) => {
    if (typeof item !== 'object' || !item) return false;
    const { name, description } = item;
    const nameStr = cleanUnderscore(name || '').toLowerCase();
    const descStr = cleanUnderscore(description || '').toLowerCase();
    return nameStr.includes(paletteSearchLower) || descStr.includes(paletteSearchLower);
  }) || [];

  // Check if an item matches the search (for hexagon view highlighting)
  const itemMatchesSearch = !paletteSearchLower
    ? () => true
    : (item) => {
      if (typeof item !== 'object' || !item) return false;
      const { name, description } = item;
      const nameStr = cleanUnderscore(name || '').toLowerCase();
      const descStr = cleanUnderscore(description || '').toLowerCase();
      return nameStr.includes(paletteSearchLower) || descStr.includes(paletteSearchLower);
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
      <CardView filteredPalette={filteredPalette} selectedSlots={selectedSlots} />
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


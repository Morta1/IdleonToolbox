import { Stack } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { getTotalPaletteLevels } from '@parsers/world-5/gaming';
import { getHiddenCap } from '@parsers/misc/hiddenCaps';
import React from 'react';
import CardView from './Palette/CardView';
import HexagonView from './Palette/HexagonView';
import { DOUBLER_ICONS, DoublerUsageCard } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';
import StatTile from '@components/common/cards/StatTile';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const PALETTE_TOOLBAR = { search: '', view: 'cards' };

// Hexagon geometry is constant: computed once at module level
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

const Palette = ({ account, gaming }) => {
  const { palette, paletteFinalBonus, paletteLuck, selectedSlots } = gaming ?? account?.gaming ?? {};
  const blackStars = account?.menagerie?.doublers?.blackStars;
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('gaming-palette', PALETTE_TOOLBAR);
  if (!palette) return null;

  // Colours already at their hidden cap gain nothing from more levels, so they never get the fastest-to-level pick
  const fastestIndices = new Set(palette
    .filter((item) => item?.chance > 0 && item?.chance < Infinity)
    .filter((item) => {
      const hiddenCap = getHiddenCap(account, 'palette', item.index);
      return !hiddenCap || hiddenCap.total < hiddenCap.cap;
    })
    .sort((a, b) => b.chance - a.chance)
    .slice(0, selectedSlots ?? 3)
    .map(({ index }) => index));

  // The palette's colours (its last entry is the final bonus, a number); the cards list the ones the search keeps,
  // the board dims the rest
  const colours = palette.filter((item) => item && typeof item === 'object');
  const query = (toolbar?.search ?? '').trim().toLowerCase();
  const matches = (item) => !query
    || cleanUnderscore(item?.name || '').toLowerCase().includes(query)
    || cleanUnderscore(item?.description || '').toLowerCase().includes(query);
  const shown = colours.filter(matches);
  const luckText = `${formatGame(paletteLuck?.value ?? 1, 'GamingStatType.PaletteLuck')}x`;

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Palette final bonus'} value={formatGame(paletteFinalBonus ?? 0, 'GamingStatType.PaletteBonus')}/>
      <StatTile label={'Palette luck'} value={luckText} breakdownTitle={'Palette luck'}
                breakdown={paletteLuck?.breakdown ? { ...paletteLuck.breakdown, totalValue: luckText } : undefined}/>
      <StatTile label={'Total palette levels'} value={getTotalPaletteLevels(palette) ?? 0} kind={'amount'}/>
      <StatTile label={'Selected slots'} value={selectedSlots ?? 0} kind={'amount'}/>
      <DoublerUsageCard title={'Black Stars'} doubler={blackStars} icon={DOUBLER_ICONS.blackStars}/>
    </Stack>
    <Toolbar state={toolbar} defaults={PALETTE_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={colours.length} shown={shown.length} noun={'colours'}>
      <Toolbar.Search placeholder={'Search colours'}/>
      <Toolbar.View options={[['cards', 'Cards'], ['board', 'Board']]}/>
    </Toolbar>
    {toolbar?.view === 'board' ? <HexagonView
      palette={palette}
      hexagonPositions={HEXAGON_POSITIONS}
      gridBounds={GRID_BOUNDS}
      hexagonSize={HEXAGON_SIZE}
      itemMatchesSearch={matches}
      searching={Boolean(query)}
      fastestIndices={fastestIndices}
      blackStarsOwned={blackStars?.owned}
    /> : <CardView colours={shown} fastestIndices={fastestIndices} blackStarsOwned={blackStars?.owned}/>}
  </>;
};

export default Palette;

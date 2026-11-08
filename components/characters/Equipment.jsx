import React from 'react';
import { Box } from '@mui/material';
import ItemDisplay from '../common/ItemDisplay';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import { getGoldenFoodBonus } from '@parsers/misc';
import { getPlayerFoodBonus } from '@parsers/character';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import { isFilledSlot } from './sectionSummary';

const SLOTS_PER_GROUP = 8;
// The game's own layout: a page of slots is 2 wide and 4 tall, so equipment reads as the body down the left (helmet,
// chest, pants, shoes) beside weapon, pendant and rings. Four pages side by side where the section has room for 8 tiles
// at their 44 px floor (CardGrid) and the gaps, two by two where not, one under another in a column too narrow for two.
const TILE_FLOOR = 44;
const TILE_GAP = 6;
const PAGE_GAP = 16;
const PAGE_SPACE = '10px';
const pagesWidth = (pages) => pages * (2 * TILE_FLOOR + TILE_GAP) + (pages - 1) * PAGE_GAP;
// A page's label and its 4 rows of tiles sit on rows the pages beside it share (subgrid), so every label lines up and a
// row of food with numbers sets the height of the tools beside it. The space before a row of pages is on its labels: a
// row's labels are all on top or all below another row, so each row's labels take the same space.
const spaceBefore = (from) => ({ [`&&& > :nth-child(n+${from}) > :first-child`]: { pt: PAGE_SPACE } });
const PAGES_SX = {
  display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: `${PAGE_GAP}px`, rowGap: `${TILE_GAP}px`,
  '&&& > *': { mt: 0, display: 'grid', gridRow: 'span 5', gridTemplateRows: 'subgrid' },
  '&&& > * > :first-child': { mb: 0 },
  '&&& > * > :last-child': { display: 'contents' },
  ...spaceBefore(3),
  [`@container (min-width: ${pagesWidth(4)}px)`]: {
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', '&&& > :nth-child(n+3) > :first-child': { pt: 0 }
  },
  [`@container (max-width: ${pagesWidth(2) - 0.05}px)`]: { gridTemplateColumns: 'minmax(0, 1fr)', ...spaceBefore(2) }
};
const PAGE_TILES_SX = { gridRow: 'span 4', gridTemplateRows: 'subgrid' };

const Equipment = ({ equipment, tools, food, account, character, characters }) => {
  // The game's own names for its two pages of equips
  const groups = [
    ['Equipment', equipment?.slice(0, SLOTS_PER_GROUP)],
    ['Specials', equipment?.slice(SLOTS_PER_GROUP)],
    ['Tools', tools],
    ['Food', food]
  ];
  return <Panel title={'Equipment'}>
    <Box sx={PAGES_SX}>
      {groups.map(([label, items]) => <Panel.Group key={label} label={label}>
        <CardGrid size={'icon'} sheetColumns={[2]} sx={PAGE_TILES_SX}>
          {items?.slice(0, SLOTS_PER_GROUP).map((item, itemIndex) => {
            const { rawName, displayName, amount } = item;
            // A slot with nothing in it has nothing to read: no note, no tab stop
            if (!isFilledSlot(item)) {
              return <IconTile key={`${rawName}-${itemIndex}`} status={'empty'} alt={'Empty slot'}/>;
            }
            // The item is all a tile says: the sheet's 40 px, as talents and skills (players asked for bigger icons)
            return <IconTile key={`${rawName}-${itemIndex}`} icon={`data/${rawName}.png`} alt={cleanUnderscore(displayName)} iconSize={40}
                             value={amount ? formatNum(amount, 'whole') : undefined}
                             details={<ItemDisplay {...item} character={character} account={account} characters={characters}
                                                   getGoldenFoodBonus={getGoldenFoodBonus} getPlayerFoodBonus={getPlayerFoodBonus}/>}/>;
          })}
        </CardGrid>
      </Panel.Group>)}
    </Box>
  </Panel>;
};

export default Equipment;

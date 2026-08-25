import React from 'react';
import InfoBox from './InfoBox';
import { Box, Stack } from '@mui/material';
import { prefix } from '@utility/helpers';
import { cleanUnderscore, growth, numberWithCommas } from '@utility/helpers';

// A vial or bubble's description carries a `{` where its bonus goes, and what fills it is the
// bonus at the reader's level. A page with no save has no level, so it reads at level one: a real
// number the game itself would show, rather than a blank or someone else's total.
const LEVEL = 1;

export const alchemyEffect = (node) => {
  const { func, x1, x2 } = node?.effect || {};
  if (!node?.description) return null;
  if (!func) return cleanUnderscore(node.description);
  const bonus = growth(func, LEVEL, x1, x2, false);
  const value = Number.isFinite(bonus) ? Math.round(bonus * 100) / 100 : '';
  return cleanUnderscore(String(node.description).replace(/[{$]/g, String(value)));
};

// The liquids have art of their own, and the rest of the site already draws them from Liquid<n>_x1.
const LiquidIcon = ({ liquid, size = 18 }) => {
  if (!liquid?.icon) return null;
  return <img
    src={`${prefix}${liquid.icon.replace(/^\//, '')}`}
    alt={''}
    width={size}
    height={size}
    style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }}
  />;
};

const AlchemyInfo = ({ node, materialName }) => {
  if (node?.kind !== 'vial' && node?.kind !== 'bubble') return null;

  // No Type row: the cauldron is already a chip beside the name, and repeating it here would be
  // the same three words twice on a page this short.
  const rows = [];
  if (node.effect?.func) rows.push({ label: 'Lv 1', value: alchemyEffect(node) });
  // The score the vial's item has to roll to discover it, which is the game's own difficulty
  // number: Copper Corona wants 1 and the late-game vials want 99.
  if (node.discoveryScore != null) rows.push({ label: 'Discovery score', value: node.discoveryScore });

  // The four alchemy liquids are not items and have no page, so they cannot be edges. They are
  // still part of the upgrade cost, and a page that silently omitted them would be wrong.
  const liquid = node.liquids?.[0] || null;
  const liquids = (node.liquids || []).map((entry) => ({
    label: <Stack direction={'row'} gap={0.75} alignItems={'center'}>
      <LiquidIcon liquid={entry}/>
      <Box component={'span'}>{entry.name}</Box>
    </Stack>,
    value: entry.cost > 0 ? entry.cost.toLocaleString('en-US') : ''
  }));

  // The same rungs for every vial, and the answer to the only question the page could not answer
  // before: what it costs to take one up.
  //
  // A real table rather than label/value rows, for two reasons. The header has to sit ON the column
  // it names: as two right-aligned runs of text above two right-aligned runs of numbers, "Water
  // Drops" floated above a column of single digits and the reader had to infer the pairing. And the
  // level needs a verb, because 100 at "Lv 2" is what you pay standing at Lv 1 to REACH Lv 2, which
  // is how the game indexes it (AlchemyVialQTYreq[currentLevel]) and not what the bare label says.
  const costs = node.upgradeCosts || [];
  const totalMaterials = costs.reduce((sum, rung) => sum + rung.materials, 0);
  const totalLiquid = costs.reduce((sum, rung) => sum + rung.liquid, 0);

  // InfoBox already pads the content block, so a cell only needs the gap to its neighbour.
  const CELL = { py: 0.5, fontSize: 14, lineHeight: 1.43, whiteSpace: 'nowrap' };
  const NUM = { ...CELL, pl: 2, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
  const HEAD = {
    ...NUM, fontSize: 12, fontWeight: 500, color: 'text.secondary',
    borderBottom: '1px solid', borderColor: 'divider'
  };
  const TOTAL = { fontWeight: 600, borderTop: '1px solid', borderColor: 'divider' };

  const costTable = costs.length === 0 ? null : <Box component={'table'} sx={{
    width: '100%', borderCollapse: 'collapse'
  }}>
    <thead>
    <Box component={'tr'}>
      <Box component={'th'} sx={{ ...HEAD, textAlign: 'left' }}>To reach</Box>
      <Box component={'th'} sx={HEAD}>{materialName || 'Material'}</Box>
      <Box component={'th'} sx={HEAD}>{liquid?.name || 'Liquid'}</Box>
    </Box>
    </thead>
    <tbody>
    {costs.map(({ level, materials, liquid: liquidCost }) => <Box component={'tr'} key={level}>
      <Box component={'td'} sx={{ ...CELL, color: 'text.secondary' }}>Lv {level}</Box>
      <Box component={'td'} sx={NUM}>{numberWithCommas(materials)}</Box>
      {/* The icon rides with the number rather than sitting once in the header: beside a column
          of bare digits it is what says at a glance that these are drops, not more material. */}
      <Box component={'td'} sx={{ ...NUM, color: 'text.disabled' }}>
        <Stack direction={'row'} gap={0.5} alignItems={'center'} justifyContent={'flex-end'}>
          <LiquidIcon liquid={liquid} size={18}/>
          <Box component={'span'}>{liquidCost}</Box>
        </Stack>
      </Box>
    </Box>)}
    {/* What maxing costs, which is the number a player is otherwise adding up by hand. */}
    <Box component={'tr'}>
      <Box component={'td'} sx={{ ...CELL, ...TOTAL }}>Total</Box>
      <Box component={'td'} sx={{ ...NUM, ...TOTAL }}>{numberWithCommas(totalMaterials)}</Box>
      <Box component={'td'} sx={{ ...NUM, ...TOTAL }}>
        <Stack direction={'row'} gap={0.5} alignItems={'center'} justifyContent={'flex-end'}>
          <LiquidIcon liquid={liquid} size={18}/>
          <Box component={'span'}>{totalLiquid}</Box>
        </Stack>
      </Box>
    </Box>
    </tbody>
  </Box>;

  return <InfoBox groups={[
    { title: `${node.kind === 'vial' ? 'Vial' : 'Bubble'} Info`, rows },
    { title: 'Liquids', rows: liquids },
    // No rows: the table IS the group, and InfoBox keeps a group that has content.
    { title: 'Upgrade Cost', content: costTable, rows: [] }
  ]}/>;
};

export default AlchemyInfo;

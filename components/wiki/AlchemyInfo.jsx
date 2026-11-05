import React from 'react';
import InfoBox, { visibleGroups } from './InfoBox';
import { Stack } from '@mui/material';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import { formatNum } from '@utility/helpers';
import LevelledEffect, { CostAmount } from './LevelledEffect';

// The liquids have art of their own, and the rest of the site already draws them from Liquid<n>_x1. It rides with the
// number rather than sitting once in the header: beside a column of bare digits it is what says at a glance that these
// are drops, not more material.
const LiquidAmount = ({ liquid, amount }) => <Stack component={'span'} direction={'row'} gap={0.5} alignItems={'center'} justifyContent={'flex-end'}>
  {liquid?.icon ? <GameIcon src={liquid.icon.replace(/^\//, '')} size={16} alt={''}/> : null}
  <span>{formatNum(amount, 'whole')}</span>
</Stack>;

const alchemyGroups = (node, materialName) => {
  if (node?.kind !== 'vial' && node?.kind !== 'bubble') return [];

  // No Type row: the cauldron is already a chip beside the name, and repeating it here would be
  // the same three words twice on a page this short.
  const rows = [];
  // The score the vial's item has to roll to discover it, which is the game's own difficulty
  // number: Copper Corona wants 1 and the late-game vials want 99.
  if (node.discoveryScore != null) rows.push({ label: 'Discovery score', value: formatNum(node.discoveryScore, 'whole') });

  // The four alchemy liquids are not items and have no page, so they cannot be edges. They are still part of the
  // upgrade cost: a vial's upgrade table has a column for its liquid, and a bubble's cost lines (node.cost, in the
  // Effect group) price it beside the material.
  const liquid = node.liquids?.[0] || null;

  // The same rungs for every vial, and the answer to the only question the page could not answer
  // before: what it costs to take one up.
  //
  // A real table rather than label/value rows, for two reasons. The header has to sit ON the column
  // it names: as two right-aligned runs of text above two right-aligned runs of numbers, "Water
  // Drops" floated above a column of single digits and the reader had to infer the pairing. And the
  // level needs a verb, because 100 at "Lv 2" is what you pay standing at Lv 1 to REACH Lv 2, which
  // is how the game indexes it (AlchemyVialQTYreq[currentLevel]) and not what the bare label says.
  const costs = node.upgradeCosts || [];
  // What maxing costs, which is the number a player is otherwise adding up by hand.
  const total = {
    level: 'Total',
    materials: costs.reduce((sum, rung) => sum + rung.materials, 0),
    liquid: costs.reduce((sum, rung) => sum + rung.liquid, 0)
  };

  const costTable = costs.length === 0 ? null : <DataTable
    fits
    rows={[...costs, total]}
    rowKey={'level'}
    columns={[
      { key: 'level', label: 'To reach', render: ({ level }) => (level === 'Total' ? level : `Lv ${formatNum(level, 'whole')}`) },
      { key: 'materials', label: materialName || 'Material', numeric: true, render: ({ materials }) => <CostAmount amount={materials}/> },
      { key: 'liquid', label: liquid?.name || 'Liquid', numeric: true, render: ({ liquid: amount }) => <LiquidAmount liquid={liquid} amount={amount}/> }
    ]}
  />;

  return [
    { title: 'Effect', content: node.effect ? <LevelledEffect node={node}/> : null, rows: [] },
    { title: `${node.kind === 'vial' ? 'Vial' : 'Bubble'} info`, rows },
    // No rows: the table IS the group, and InfoBox keeps a group that has content.
    { title: 'Upgrade cost', content: costTable, rows: [] }
  ];
};

// The panel asks the same question the box answers, so it cannot draw while the empty state shows.
export const alchemyInfoShows = (node) => visibleGroups(alchemyGroups(node)).length > 0;

const AlchemyInfo = ({ node, materialName }) => <InfoBox groups={alchemyGroups(node, materialName)}/>;

export default AlchemyInfo;

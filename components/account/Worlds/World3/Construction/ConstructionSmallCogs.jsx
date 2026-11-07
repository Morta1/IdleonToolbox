import React from 'react';
import { Box, Typography } from '@mui/material';
import { formatNum } from '@utility/helpers';
import { getCogDisplayName } from '@parsers/world-3/construction';
import Panel from '@components/common/cards/Panel';

/**
 * Small cogs only fit the 24 side slots and their bonuses are a flat sum, so there is no arrangement
 * to optimize: the only thing worth surfacing is a stronger one going unused in the inventory.
 */
const ConstructionSmallCogs = ({ smallCogs }) => {
  const { upgrades = [], spares = [], freeSlots = 0 } = smallCogs || {};
  if (spares.length === 0) return null;
  const meta = `${formatNum(spares.length)} in inventory${freeSlots > 0 ? `, ${formatNum(freeSlots)} free slot${freeSlots > 1 ? 's' : ''}` : ''}`;

  return <Panel title={'Small cogs'} meta={meta}>
    <Box sx={{ px: 2, py: 1.25 }}>
      <Typography variant={'body2'} color={'text.secondary'}>
        {upgrades.length === 0
          ? 'Nothing to gain: everything placed already beats what you are holding.'
          : 'Side slot swaps, best first. Position never matters for these, only which ones you place.'}
      </Typography>
    </Box>
    {upgrades.map((upgrade) => <Panel.Row key={`${upgrade.originalIndex}-${upgrade.slotIndex}`}
                                          icon={`data/${upgrade.name}.png`}
                                          name={getCogDisplayName(upgrade.name)}
                                          sub={`${upgrade.slotLabel}: ${upgrade.replaces ? `replaces ${getCogDisplayName(upgrade.replaces.name)}` : 'empty slot'}`}
                                          value={formatNum(upgrade.gainPercent, 'pct', { signed: true, precise: true })}/>)}
  </Panel>;
};

export default ConstructionSmallCogs;

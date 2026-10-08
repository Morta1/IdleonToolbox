import React from 'react';
import { Link, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { TABS, metaOf, rankText } from './format';
import { openOnPlainClick } from './MetricCard';
import { bestInSection, medianRank } from './standing';

// One tile per category tab. `ranks` is the viewed player's, or undefined: then a tile is only its name and count.
// linkPlayer: the ?player= kept in each tile's href, for a middle click or a copied link.
const CategoryTiles = ({ index, ranks, onTab, linkPlayer = null }) => {
  const tiles = TABS.map((tab) => ({ tab, keys: index.categories[tab.toLowerCase()]?.metrics ?? [] })).filter(({ keys }) => keys.length);
  if (!tiles.length) return null;
  return (
    <Box sx={{
      display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5,
      '@container (min-width: 520px)': { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
      '@container (min-width: 900px)': { gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }
    }}>
      {tiles.map(({ tab, keys }) => {
        const median = ranks ? medianRank(keys, ranks) : null;
        const best = ranks ? bestInSection(keys, ranks) : null;
        return (
          <Link key={tab} href={`?t=${tab}${linkPlayer ? `&player=${encodeURIComponent(linkPlayer)}` : ''}`} onClick={openOnPlainClick(onTab, tab)} underline="none" color="inherit" sx={{
            display: 'flex', flexDirection: 'column', gap: 0.75, boxSizing: 'border-box', p: '14px', bgcolor: '#1C252E', border: 1, borderColor: 'divider', borderRadius: 2,
            '&:hover': { borderColor: 'primary.main' }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
              <Typography component="span" sx={{ fontWeight: 700 }}>{tab}</Typography>
              <Typography component="span" color="text.disabled" sx={{ fontSize: 11 }}>{keys.length}</Typography>
            </Box>
            {median != null ? <Typography color="text.secondary" sx={{ fontSize: 12 }}>{`median ${rankText(median)}`}</Typography> : null}
            {best ? <Typography color="primary" noWrap title={metaOf(index, best.key).label} sx={{ fontSize: 12 }}>{`${rankText(best.r)} ${metaOf(index, best.key).label}`}</Typography> : null}
          </Link>
        );
      })}
    </Box>
  );
};

export default CategoryTiles;

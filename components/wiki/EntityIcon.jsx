import React, { useState } from 'react';
import { Box } from '@mui/material';

// NPCs and quests carry no icon, and the build nulls the 135 paths whose art the game never
// shipped. Both cases collapse to an empty box of the same size so the rows stay aligned. The
// onError fallback still matters for art that disappears between graph builds.
// Remount this on the entity it belongs to, or `broken` outlives the icon that set it.
// Its own module, importing nothing of the wiki's: every row component draws it, and EntityPanel
// imports those rows, so living in EntityPanel made each of them a cycle back into it.
// `loading` is for a long listing ("lazy"); left out, React writes no attribute and the image loads as before.
const EntityIcon = ({ node, size, loading }) => {
  const [broken, setBroken] = useState(false);
  if (!node?.icon || broken) return <Box sx={{ width: size, height: size, flexShrink: 0 }}/>;
  return <img
    src={node.icon}
    alt=""
    width={size}
    height={size}
    loading={loading}
    style={{ objectFit: 'contain', flexShrink: 0 }}
    onError={() => setBroken(true)}
  />;
};

export default EntityIcon;

import React from 'react';
import { Box } from '@mui/material';
import GameIcon from '@components/common/GameIcon';

// NPCs and quests carry no icon, and the build nulls the 135 paths whose art the game never shipped: an empty box of the
// same size, so the rows stay aligned. Art that disappears between graph builds draws GameIcon's missing-art box.
// Its own module, importing nothing of the wiki's: every row component draws it, and EntityPanel
// imports those rows, so living in EntityPanel made each of them a cycle back into it.
// `loading` is for a long listing ("lazy"). A node's icon is rooted at /, GameIcon's src under public/.
const EntityIcon = ({ node, size, loading }) => (node?.icon
  ? <GameIcon src={node.icon.replace(/^\//, '')} size={size} alt={''} loading={loading}/>
  : <Box sx={{ width: size, height: size, flexShrink: 0 }}/>);

export default EntityIcon;

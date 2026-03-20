import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { cleanUnderscore, prefix } from '@utility/helpers';

const buildDependencyTree = (upgrades) => {
  const upgradeMap = {};

  upgrades.forEach((u, index) => {
    upgradeMap[index] = { ...u, id: index, children: [] };
  });

  const roots = [];

  upgrades.forEach((upgrade, index) => {
    const parent = upgradeMap[upgrade.x6];

    if (parent && parent.id !== index) {
      parent.children.push(upgradeMap[index]);
    } else if (index === upgrade.x6 || !parent) {
      roots.push(upgradeMap[index]);
    }
  });

  // Sort children by x8 (row) value
  Object.values(upgradeMap).forEach(node => {
    node.children.sort((a, b) => (a.x8 ?? 0) - (b.x8 ?? 0) || a.id - b.id);
  });

  return roots;
};

// Helper function to check if a target node ID exists in the subtree
const isAncestorOf = (node, targetId) => {
  if (node.id === targetId) return true;
  if (!node.children || node.children.length === 0) return false;
  return node.children.some(child => isAncestorOf(child, targetId));
};

const UpgradeTree = ({ upgrade, depth = 0, hoveredNodeId, onHover }) => {
  const hasChildren = upgrade.children && upgrade.children.length > 0;
  const isUnlocked = upgrade.level > 0;
  const [isExpanded, setIsExpanded] = useState(true);
  const isAncestor = hoveredNodeId !== null && upgrade.id !== hoveredNodeId && isAncestorOf(upgrade, hoveredNodeId);

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        gap={0.75}
        onClick={hasChildren ? () => setIsExpanded(!isExpanded) : undefined}
        onMouseEnter={() => onHover(upgrade.id)}
        onMouseLeave={() => onHover(null)}
        sx={{
          py: 0.4,
          opacity: isUnlocked ? 1 : 0.5,
          cursor: hasChildren ? 'pointer' : 'default',
          '&:hover': { bgcolor: 'action.hover', borderRadius: 0.5 }
        }}
      >
        <Box sx={{ width: 16, ml: hasChildren ? -0.25 : 0 }}>
          {hasChildren && (
            <ExpandMoreIcon
              sx={{
                fontSize: 16,
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s',
                opacity: 0.6
              }}
            />
          )}
        </Box>

        <img
          src={`${prefix}data/CaveShopUpg${upgrade.originalIndex}.png`}
          style={{ width: 20, height: 20, flexShrink: 0 }}
        />

        <Typography
          variant="body2"
          sx={{
            fontWeight: isUnlocked ? 500 : 400,
            fontSize: '0.875rem',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: isAncestor ? 'primary.main' : 'inherit'
          }}
        >
          {cleanUnderscore(upgrade.name)}
        </Typography>

        <Stack direction="column" gap={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
          <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.75rem' }}>
            {Math.max(upgrade.level, 0)}/{upgrade.x3}
          </Typography>
        </Stack>
      </Stack>

      {isExpanded && hasChildren && (
        <Box sx={{ 
          borderLeft: depth > 0 ? '2px solid' : 'none', 
          borderColor: 'divider', 
          pl: 1 
        }}>
          {upgrade.children.map(child => (
            <UpgradeTree 
              key={child.id} 
              upgrade={child} 
              depth={depth + 1} 
              hoveredNodeId={hoveredNodeId}
              onHover={onHover}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

const PathView = ({ upgrades, roots }) => {
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  
  // Find primary root (id 0) or use first root
  const primaryRoot = roots.find(r => r.id === 0) ?? roots[0];
  const displayRoots = primaryRoot ? [primaryRoot] : roots;

  if (roots.length === 0) {
    return (
      <Box>
        <Typography variant="h6" mb={1.5}>Upgrade Dependency Paths</Typography>
        <Typography>No upgrades found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" mb={1.5}>Upgrade Dependency Paths</Typography>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
        {displayRoots.map(root => (
          <UpgradeTree 
            key={root.id} 
            upgrade={root} 
            hoveredNodeId={hoveredNodeId}
            onHover={setHoveredNodeId}
          />
        ))}
      </Box>
    </Box>
  );
}

export default PathView;
export { buildDependencyTree };


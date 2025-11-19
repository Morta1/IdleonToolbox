import { groupUpgradesByColumn } from '@parsers/world-7/spelunking';
import React, { useMemo, useState } from 'react';
import {
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { IconChartCohort, IconRoute } from '@tabler/icons-react';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { useLocalStorage } from '@mantine/hooks';
import GroupedView from './upgrades/GroupedView';
import PathView, { buildDependencyTree } from './upgrades/PathView';

const Upgrades = ({ upgrades, currentAmber, denominator, amberIndex }) => {
  const [viewMode, setViewMode] = useLocalStorage({
    key: `${prefix}:spelunkingUpgrades:viewMode`,
    defaultValue: 'group'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const groupedUpgrades = groupUpgradesByColumn(upgrades);
  const dependencyRoots = useMemo(() => buildDependencyTree(upgrades), [upgrades]);

  // Filter upgrades based on search term
  const filteredUpgrades = useMemo(() => {
    if (!searchTerm.trim()) return upgrades;
    const lowerSearch = searchTerm.toLowerCase();
    return upgrades.filter(u => 
      cleanUnderscore(u.name).toLowerCase().includes(lowerSearch) ||
      cleanUnderscore(u.description).toLowerCase().includes(lowerSearch)
    );
  }, [upgrades, searchTerm]);

  const filteredGroupedUpgrades = useMemo(() => {
    if (!searchTerm.trim()) return groupedUpgrades;
    const filtered = {};
    Object.entries(groupedUpgrades).forEach(([key, groupUpgrades]) => {
      const filteredGroup = groupUpgrades.filter(u => 
        cleanUnderscore(u.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        cleanUnderscore(u.description).toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filteredGroup.length > 0) {
        filtered[key] = filteredGroup;
      }
    });
    return filtered;
  }, [groupedUpgrades, searchTerm]);

  const filteredDependencyRoots = useMemo(() => {
    if (!searchTerm.trim()) return dependencyRoots;
    const lowerSearch = searchTerm.toLowerCase();
    
    const filterTree = (node) => {
      const matches = cleanUnderscore(node.name).toLowerCase().includes(lowerSearch) ||
                     cleanUnderscore(node.description).toLowerCase().includes(lowerSearch);
      
      const filteredChildren = node.children
        ? node.children.map(filterTree).filter(child => child !== null)
        : [];
      
      if (matches || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    };
    
    return dependencyRoots.map(filterTree).filter(root => root !== null);
  }, [dependencyRoots, searchTerm]);

  return <Stack>
    <Stack mb={3} direction={'row'} alignItems={'center'} gap={2}>
      {viewMode !== 'path' && (
        <TextField
          placeholder="Search by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flex: 1, maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      )}
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        sx={{ ml: 'auto' }}
        onChange={(_, val) => val && setViewMode(val)}
      >
        <Tooltip title={'Group view'}><ToggleButton sx={{ height: 40 }}
          value="group"><IconChartCohort /></ToggleButton></Tooltip>
        <Tooltip title={'Path view'}><ToggleButton sx={{ height: 40 }}
          value="path"><IconRoute /></ToggleButton></Tooltip>
      </ToggleButtonGroup>
    </Stack>
    {viewMode === 'path' ? (
      <PathView upgrades={filteredUpgrades} roots={filteredDependencyRoots} />
    ) : (
      <GroupedView grouped={filteredGroupedUpgrades} currentAmber={currentAmber} denominator={denominator} amberIndex={amberIndex} searchTerm={searchTerm} />
    )}
  </Stack>;
}

export default Upgrades;
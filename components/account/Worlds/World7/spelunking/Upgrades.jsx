import { groupUpgradesByColumn } from '@parsers/world-7/spelunking';
import React, { useMemo, useState } from 'react';
import {
  Checkbox,
  FormControlLabel,
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
  const [hideCompleted, setHideCompleted] = useLocalStorage({
    key: `${prefix}:spelunkingUpgrades:hideCompleted`,
    defaultValue: false
  });
  const [searchTerm, setSearchTerm] = useState('');

  const groupedUpgrades = groupUpgradesByColumn(upgrades);
  const dependencyRoots = useMemo(() => buildDependencyTree(upgrades), [upgrades]);

  // Helper function to check if upgrade is completed
  const isCompleted = (upgrade) => upgrade.level >= upgrade.x3;

  // Filter upgrades based on search term and hide completed option
  const filteredUpgrades = useMemo(() => {
    let filtered = upgrades;
    
    // Filter by search term
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        cleanUnderscore(u.name).toLowerCase().includes(lowerSearch) ||
        cleanUnderscore(u.description).toLowerCase().includes(lowerSearch)
      );
    }
    
    // Filter out completed upgrades if option is enabled
    if (hideCompleted) {
      filtered = filtered.filter(u => !isCompleted(u));
    }
    
    return filtered;
  }, [upgrades, searchTerm, hideCompleted]);

  const filteredGroupedUpgrades = useMemo(() => {
    const filtered = {};
    Object.entries(groupedUpgrades).forEach(([key, groupUpgrades]) => {
      let filteredGroup = groupUpgrades;
      
      // Filter by search term
      if (searchTerm.trim()) {
        filteredGroup = filteredGroup.filter(u => 
          cleanUnderscore(u.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
          cleanUnderscore(u.description).toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Filter out completed upgrades if option is enabled
      if (hideCompleted) {
        filteredGroup = filteredGroup.filter(u => !isCompleted(u));
      }
      
      if (filteredGroup.length > 0) {
        filtered[key] = filteredGroup;
      }
    });
    return filtered;
  }, [groupedUpgrades, searchTerm, hideCompleted]);

  const filteredDependencyRoots = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    const hasSearchTerm = searchTerm.trim().length > 0;
    
    const filterTree = (node) => {
      // Check if node matches search term
      const matchesSearch = !hasSearchTerm || 
        cleanUnderscore(node.name).toLowerCase().includes(lowerSearch) ||
        cleanUnderscore(node.description).toLowerCase().includes(lowerSearch);
      
      // Filter children recursively
      const filteredChildren = node.children
        ? node.children.map(filterTree).filter(child => child !== null)
        : [];
      
      // Keep node if it matches search OR has matching children
      if (matchesSearch || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    };
    
    return dependencyRoots.map(filterTree).filter(root => root !== null);
  }, [dependencyRoots, searchTerm]);

  return <Stack>
    <Stack mb={3} direction={'row'} alignItems={'center'} gap={2}>
      {viewMode !== 'path' && (
        <>
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
          <FormControlLabel
            control={
              <Checkbox
                checked={hideCompleted}
                onChange={(e) => setHideCompleted(e.target.checked)}
                size="small"
              />
            }
            label="Hide completed"
          />
        </>
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
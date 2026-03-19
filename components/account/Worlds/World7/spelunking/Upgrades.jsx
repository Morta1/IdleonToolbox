import { groupUpgradesByColumn } from '@parsers/world-7/spelunking';
import React, { useState } from 'react';
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
  const dependencyRoots = buildDependencyTree(upgrades);

  // Helper function to check if upgrade is completed
  const isCompleted = (upgrade) => upgrade.level >= upgrade.x3;

  // Filter upgrades based on search term and hide completed option
  let filteredUpgrades = upgrades;
  if (searchTerm.trim()) {
    const lowerSearch = searchTerm.toLowerCase();
    filteredUpgrades = filteredUpgrades.filter(u =>
      cleanUnderscore(u.name).toLowerCase().includes(lowerSearch) ||
      cleanUnderscore(u.description).toLowerCase().includes(lowerSearch)
    );
  }
  if (hideCompleted) {
    filteredUpgrades = filteredUpgrades.filter(u => !isCompleted(u));
  }

  const filteredGroupedUpgrades = {};
  Object.entries(groupedUpgrades).forEach(([key, groupUpgrades]) => {
    let filteredGroup = groupUpgrades;
    if (searchTerm.trim()) {
      filteredGroup = filteredGroup.filter(u =>
        cleanUnderscore(u.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        cleanUnderscore(u.description).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (hideCompleted) {
      filteredGroup = filteredGroup.filter(u => !isCompleted(u));
    }
    if (filteredGroup.length > 0) {
      filteredGroupedUpgrades[key] = filteredGroup;
    }
  });

  const depSearchLower = searchTerm.trim().toLowerCase();
  const hasDepSearchTerm = searchTerm.trim().length > 0;
  const filterTree = (node) => {
    const matchesSearch = !hasDepSearchTerm ||
      cleanUnderscore(node.name).toLowerCase().includes(depSearchLower) ||
      cleanUnderscore(node.description).toLowerCase().includes(depSearchLower);
    const filteredChildren = node.children
      ? node.children.map(filterTree).filter(child => child !== null)
      : [];
    if (matchesSearch || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }
    return null;
  };
  const filteredDependencyRoots = dependencyRoots.map(filterTree).filter(root => root !== null);

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
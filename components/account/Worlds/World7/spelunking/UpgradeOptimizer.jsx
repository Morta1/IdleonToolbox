import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { cleanUnderscore, notateNumber, prefix, commaNotation } from '@utility/helpers';
import { IconList, IconTable } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';
import { useLocalStorage } from '@mantine/hooks';
import { getOptimizedSpelunkingPowerUpgrades, getOptimizedSpelunkingAmberGainUpgrades, getAmberIndex, getAmberDenominator } from '@parsers/world-7/spelunking';

const maxUpgradesOptions = [5, 10, 25, 50, 100, 200, 300];
const groupModes = ['None', 'Upgrade', 'Summary'];
const optimizationCategorys = ['Power', 'Amber Gain', 'All'];

const UpgradeOptimizer = ({ character, account }) => {
  const { state } = useContext(AppContext);
  const [maxUpgrades, setMaxUpgrades] = useLocalStorage({
    key: 'spelunkingUpgradeOptimizer:maxUpgrades',
    defaultValue: 10
  });
  const [maxUpgradesMode, setMaxUpgradesMode] = useLocalStorage({
    key: 'spelunkingUpgradeOptimizer:maxUpgradesMode',
    defaultValue: 'preset'
  });
  const [customMaxUpgrades, setCustomMaxUpgrades] = useLocalStorage({
    key: 'spelunkingUpgradeOptimizer:customMaxUpgrades',
    defaultValue: 10
  });
  const [onlyAffordable, setOnlyAffordable] = useState(false);
  const [viewMode, setViewMode] = useLocalStorage({
    key: 'spelunkingUpgradeOptimizer:viewMode',
    defaultValue: 'grid'
  });
  const [groupMode, setGroupMode] = useLocalStorage({
    key: 'spelunkingUpgradeOptimizer:groupMode',
    defaultValue: 'None'
  });
  const [optimizationCategory, setOptimizationCategory] = useLocalStorage({
    key: 'spelunkingUpgradeOptimizer:optimizationCategory',
    defaultValue: 'Power'
  });

  const denominator = getAmberDenominator(account);
  const amberIndex = getAmberIndex(account);

  const optimizedUpgrades = useMemo(() => {
    if (!character || !account) return [];
    
    const maxToUse = maxUpgradesMode === 'custom'
      ? Math.max(0, parseInt(customMaxUpgrades || 0, 10) || 0)
      : maxUpgrades;
    
    const characters = state?.characters || [];
    const options = { onlyAffordable, characters };
    
    // Helper function to get upgrades for a specific category
    const getUpgradesForCategory = (category, limit) => {
      const upgrades = category === 'Amber Gain'
        ? getOptimizedSpelunkingAmberGainUpgrades(character, account, limit, options)
        : getOptimizedSpelunkingPowerUpgrades(character, account, limit, options);
      return upgrades.map(upgrade => ({ ...upgrade, category }));
    };
    
    if (optimizationCategory === 'All') {
      // Get upgrades from both categories, merge, sort by efficiency, and limit
      const powerUpgrades = getUpgradesForCategory('Power', maxToUse * 2);
      const amberGainUpgrades = getUpgradesForCategory('Amber Gain', maxToUse * 2);
      return [...powerUpgrades, ...amberGainUpgrades]
        .sort((a, b) => (b.efficiency || 0) - (a.efficiency || 0))
        .slice(0, maxToUse);
    }
    
    return getUpgradesForCategory(optimizationCategory, maxToUse);
  }, [character, account, maxUpgradesMode, customMaxUpgrades, maxUpgrades, onlyAffordable, state?.characters, optimizationCategory]);

  const formatChange = (change) => {
    if (change >= 1000) {
      return `+${notateNumber(change)}`;
    }
    return `+${change.toFixed(2).replace(/\.00$/, '')}`;
  };

  const formatPercentChange = (percentChange) => {
    return `+${percentChange.toFixed(2).replace(/\.00$/, '')}%`;
  };

  const formatCost = (cost) => {
    const costValue = cost < 1e9 ? commaNotation(cost / denominator) : notateNumber(cost / denominator, "Big");
    return costValue;
  };

  // Helper function to get the change value and label based on upgrade category
  const getChangeInfo = (upgrade, isCombined = false) => {
    const category = upgrade.category || optimizationCategory;
    if (category === 'All') {
      // In "All" mode, prefer the category marked on the upgrade, otherwise detect from available data
      const detectedCategory = upgrade.category || 
        (upgrade.powerChange !== undefined || upgrade.combinedPowerChange !== undefined ? 'Power' : 'Amber Gain');
      if (detectedCategory === 'Amber Gain') {
        return {
          label: 'Amber Gain',
          value: isCombined ? upgrade.combinedAmberGainChange : upgrade.amberGainChange,
          category: 'Amber Gain'
        };
      }
      return {
        label: 'Power',
        value: isCombined ? upgrade.combinedPowerChange : upgrade.powerChange,
        category: 'Power'
      };
    }
    
    if (category === 'Amber Gain') {
      return {
        label: 'Amber Gain',
        value: isCombined ? upgrade.combinedAmberGainChange : upgrade.amberGainChange,
        category: 'Amber Gain'
      };
    }
    
    return {
      label: 'Power',
      value: isCombined ? upgrade.combinedPowerChange : upgrade.powerChange,
      category: 'Power'
    };
  };

  // Group upgrades by name if consolidation is enabled
  const displayUpgrades = useMemo(() => {
    if (groupMode === 'Upgrade') {
      // Group consecutive upgrades of the same type while preserving order
      const consolidatedUpgrades = [];
      let currentGroup = null;
      const currentLevels = {};
      optimizedUpgrades.forEach((upgrade, index) => {
        const upgradeName = upgrade.name;
        // Determine the start level for this group
        const startLevel = currentGroup && currentGroup.name === upgradeName
          ? currentGroup.startLevel
          : (currentLevels[upgradeName] ?? upgrade.level);
        if (!currentGroup || currentGroup.name !== upgradeName) {
          if (currentGroup) {
            // After finishing a group, update the current level and push
            currentGroup.finalLevel = currentGroup.startLevel + currentGroup.sequence.length - 1;
            currentLevels[currentGroup.name] = currentGroup.finalLevel;
            consolidatedUpgrades.push(currentGroup);
          }
          // Start new group
          currentGroup = {
            ...upgrade,
            upgradeIndex: index,
            sequence: [{ ...upgrade, originalIndex: index }],
            startLevel
          };
        }
        else {
          currentGroup.sequence.push({ ...upgrade, originalIndex: index });
        }
      });
      // Push the last group
      if (currentGroup) {
        currentGroup.finalLevel = currentGroup.startLevel + currentGroup.sequence.length - 1;
        currentLevels[currentGroup.name] = currentGroup.finalLevel;
        consolidatedUpgrades.push(currentGroup);
      }
      // Calculate combined stats for each group
      return consolidatedUpgrades.map(upgrade => {
        if (!upgrade.sequence || upgrade.sequence.length <= 1) {
          return upgrade;
        }
        // Calculate total changes (power or amber gain)
        let totalPowerChange = 0;
        let totalAmberGainChange = 0;
        let totalPercentChange = 0;
        let totalCost = 0;
        upgrade.sequence.forEach(seq => {
          totalCost += seq.cost;
          totalPowerChange += seq.powerChange || 0;
          totalAmberGainChange += seq.amberGainChange || 0;
          totalPercentChange += seq.percentChange || 0;
        });
        return {
          ...upgrade,
          combinedPowerChange: totalPowerChange,
          combinedAmberGainChange: totalAmberGainChange,
          combinedPercentChange: totalPercentChange,
          totalCost,
          startLevel: upgrade.startLevel,
          finalLevel: upgrade.finalLevel,
          numberOfUpgrades: upgrade.sequence.length
        };
      });
    }
    else if (groupMode === 'Summary') {
      const grouped = {};
      optimizedUpgrades.forEach((upgrade, index) => {
        if (!grouped[upgrade.name]) {
          grouped[upgrade.name] = {
            ...upgrade,
            upgradeIndex: index,
            startLevel: upgrade.level,
            finalLevel: upgrade.level,
            sequence: [],
            totalCost: 0,
            combinedPowerChange: 0,
            combinedAmberGainChange: 0,
            combinedPercentChange: 0
          };
        }

        const g = grouped[upgrade.name];
        g.sequence.push(upgrade);
        g.finalLevel = Math.max(g.finalLevel, upgrade.level);
        g.totalCost += upgrade.cost;
        g.combinedPowerChange += upgrade.powerChange || 0;
        g.combinedAmberGainChange += upgrade.amberGainChange || 0;
        g.combinedPercentChange += upgrade.percentChange || 0;
      });

      return Object.values(grouped);
    }
    return optimizedUpgrades.map((upgrade, index) => ({ ...upgrade, upgradeIndex: index }));
  }, [optimizedUpgrades, groupMode]);

  return (
    <Stack gap={3}>
      <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ width: 140 }}>
          <InputLabel>Optimization Category</InputLabel>
          <Select
            value={optimizationCategory}
            label="Optimization Category"
            onChange={(e) => setOptimizationCategory(e.target.value)}
          >
            {optimizationCategorys.map(mode => (
              <MenuItem key={mode} value={mode}>{mode}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 160 }}>
          <InputLabel>Max Upgrades</InputLabel>
          <Select
            value={maxUpgradesMode === 'custom' ? 'custom' : maxUpgrades}
            label="Max Upgrades"
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'custom') {
                setMaxUpgradesMode('custom');
              }
              else {
                setMaxUpgradesMode('preset');
                setMaxUpgrades(val);
              }
            }}
          >
            {maxUpgradesOptions.map(max => (
              <MenuItem key={max} value={max}>{max}</MenuItem>
            ))}
            <MenuItem value={'custom'}>Custom</MenuItem>
          </Select>
        </FormControl>
        {maxUpgradesMode === 'custom' && (
          <TextField
            size="small"
            type="number"
            inputProps={{ min: 1 }}
            sx={{ width: 120 }}
            label="Custom Max"
            value={customMaxUpgrades}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (isNaN(v)) {
                setCustomMaxUpgrades('');
              }
              else {
                setCustomMaxUpgrades(Math.max(1, v));
              }
            }}
          />
        )}
        <FormControl size="small" sx={{ width: 120 }}>
          <InputLabel>Group mode</InputLabel>
          <Select
            value={groupMode}
            label="Group mode"
            onChange={(e) => setGroupMode(e.target.value)}
          >
            {groupModes.map(group => (
              <MenuItem key={group} value={group}>{group}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Checkbox
              checked={onlyAffordable}
              onChange={(e) => setOnlyAffordable(e.target.checked)}
              size="small"
            />
          }
          label="Only show affordable upgrades"
        />
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          sx={{ ml: 'auto' }}
          onChange={(_, val) => val && setViewMode(val)}
        >
          <Tooltip title={'Grid view'}><ToggleButton sx={{ height: 40 }}
            value="grid"><IconTable /></ToggleButton></Tooltip>
          <Tooltip title={'List view'}><ToggleButton sx={{ height: 40 }}
            value="list"><IconList /></ToggleButton></Tooltip>
        </ToggleButtonGroup>
      </Stack>

      <Typography variant="h6">
        Recommended {optimizationCategory === 'All' ? 'Upgrade' : optimizationCategory === 'Amber Gain' ? 'Amber Gain' : 'Power'} Upgrade Sequence
      </Typography>
      {displayUpgrades.length > 0 ? (
        viewMode === 'grid' ? (
          <Stack direction="row" gap={2} flexWrap="wrap">
            {displayUpgrades.map((upgrade, index) => {
              const hasSequence = upgrade.sequence && upgrade.sequence.length > 1;
              const originalIndex = upgrade.upgradeIndex !== undefined ? upgrade.upgradeIndex : index;
              return (
                <Card key={originalIndex} sx={{ width: 350 }}>
                  <CardContent>
                    <Stack direction="row" gap={2} sx={{ position: 'relative' }}>
                      <img
                        style={{ width: 32, height: 32 }}
                        src={`${prefix}data/CaveShopUpg${upgrade.originalIndex}.png`}
                        alt=""
                      />
                      <Box>
                        <Typography variant="subtitle1">
                          {cleanUnderscore(upgrade.name.replace(/[船般航舞製]/, '')
                            .replace('(Tap_for_more_info)', '')
                            .replace('(#)', ''))} ({upgrade.level} / {upgrade.x3})
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {hasSequence
                            ? `Upgrade Group (#${originalIndex + 1}${upgrade.sequence.length > 1
                              ? ` to #${originalIndex + upgrade.sequence.length}`
                              : ''})`
                            : `Upgrade #${originalIndex + 1}`}
                          {optimizationCategory === 'All' && upgrade.category && (
                            <span> • {upgrade.category}</span>
                          )}
                        </Typography>
                      </Box>
                    </Stack>
                    {hasSequence && (upgrade.combinedPowerChange !== undefined || upgrade.combinedAmberGainChange !== undefined) ? (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" gutterBottom>
                          Total Benefits (Levels {upgrade.startLevel} → {upgrade.finalLevel})
                        </Typography>
                        <Typography variant="body2">
                          {(() => {
                            const changeInfo = getChangeInfo(upgrade, true);
                            return `${changeInfo.label}: ${formatChange(changeInfo.value)} (${formatPercentChange(upgrade.combinedPercentChange)})`;
                          })()}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Stack direction="row" gap={1} alignItems="center">
                          <img
                            style={{ objectPosition: '0 -6px', width: 20, height: 20 }}
                            src={`${prefix}data/CaveAmber${amberIndex}.png`}
                            alt=""
                          />
                          <Typography variant="body2">Total Cost: {formatCost(upgrade.totalCost)}</Typography>
                        </Stack>
                      </>
                    ) : (
                      <Stack sx={{ mt: 1 }} gap={1}>
                        <Typography variant="body2">
                          {(() => {
                            const changeInfo = getChangeInfo(upgrade, false);
                            return `${changeInfo.label}: ${formatChange(changeInfo.value)} (${formatPercentChange(upgrade.percentChange)})`;
                          })()}
                        </Typography>
                        <Stack direction="row" gap={1} alignItems="center">
                          <img
                            style={{ objectPosition: '0 -6px', width: 20, height: 20 }}
                            src={`${prefix}data/CaveAmber${amberIndex}.png`}
                            alt=""
                          />
                          <Typography variant="body2">
                            Cost: {formatCost(upgrade.cost)}
                          </Typography>
                        </Stack>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        ) : (
          <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Icon</TableCell>
                  <TableCell>Name</TableCell>
                  {optimizationCategory === 'All' && <TableCell>Category</TableCell>}
                  <TableCell>Level</TableCell>
                  <TableCell>{optimizationCategory === 'All' ? 'Change' : optimizationCategory === 'Amber Gain' ? 'Amber Gain Change' : 'Power Change'}</TableCell>
                  <TableCell>Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayUpgrades.map((upgrade, idx) => {
                  const hasSequence = upgrade.sequence && upgrade.sequence.length > 1;
                  return (
                    <TableRow key={upgrade.upgradeIndex !== undefined ? upgrade.upgradeIndex : idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <img
                          style={{ width: 24, height: 24 }}
                          src={`${prefix}data/CaveShopUpg${upgrade.originalIndex}.png`}
                          alt=""
                        />
                      </TableCell>
                      <TableCell>{cleanUnderscore(upgrade.name.replace(/[船般航舞製]/, '').replace('(Tap_for_more_info)', '').replace('(#)', ''))}</TableCell>
                      {optimizationCategory === 'All' && (
                        <TableCell>{upgrade.category || 'Unknown'}</TableCell>
                      )}
                      <TableCell>
                        {hasSequence
                          ? `${upgrade.startLevel} → ${upgrade.finalLevel}`
                          : `${upgrade.level} / ${upgrade.x3}`}
                      </TableCell>
                      <TableCell>
                        {hasSequence && (upgrade.combinedPowerChange !== undefined || upgrade.combinedAmberGainChange !== undefined)
                          ? (
                            <>
                              <Typography variant="caption">Levels {upgrade.startLevel} → {upgrade.finalLevel}</Typography>
                              <div>
                                {(() => {
                                  const changeInfo = getChangeInfo(upgrade, true);
                                  return `${changeInfo.label}: ${formatChange(changeInfo.value)} (${formatPercentChange(upgrade.combinedPercentChange)})`;
                                })()}
                              </div>
                            </>
                          )
                          : (
                            <>
                              {(() => {
                                const changeInfo = getChangeInfo(upgrade, false);
                                return `${changeInfo.label}: ${formatChange(changeInfo.value)} (${formatPercentChange(upgrade.percentChange)})`;
                              })()}
                            </>
                          )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" gap={1} alignItems="center">
                          <img
                            style={{ objectPosition: '0 -6px' }}
                            src={`${prefix}data/CaveAmber${amberIndex}.png`}
                            alt=""
                            width={20}
                            height={20}
                          />
                          {hasSequence && upgrade.totalCost
                            ? formatCost(upgrade.totalCost)
                            : formatCost(upgrade.cost)}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : (
        <Typography variant="body1" color="text.secondary">
          No viable {optimizationCategory === 'All' ? '' : optimizationCategory === 'Amber Gain' ? 'amber gain' : 'power'} upgrades found with your current resources.
        </Typography>
      )}
    </Stack>
  );
};

export default UpgradeOptimizer;


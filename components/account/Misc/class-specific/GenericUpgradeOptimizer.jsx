import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
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
import { cleanUnderscore, notateNumber, parseShorthandNumber, prefix, splitTime } from '@utility/helpers';
import { IconInfoCircleFilled, IconList, IconTable } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';
import useCheckbox from '@components/common/useCheckbox';
import { useLocalStorage } from '@mantine/hooks';

const maxUpgradesOptions = [5, 10, 25, 50, 100, 200, 300];
const groupModes = ['None', 'Upgrade', 'Summary'];
const GenericUpgradeOptimizer = ({
  character,
  account,
  getOptimizedUpgradesFn,
  upgradeCategories,
  resourceNames,
  resourceKey,
  resourceImagePrefix,
  upgradeImagePrefix,
  getResourceType,
  getUpgradeIconIndex,
  getResourceAmount,
  tooltipText
}) => {
  const [viewMode, setViewMode] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:viewMode`,
    defaultValue: 'grid'
  });
  const [category, setCategory] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:category`,
    defaultValue: 'damage'
  });
  const [maxUpgrades, setMaxUpgrades] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:maxUpgrades`,
    defaultValue: 10
  });
  const [maxUpgradesMode, setMaxUpgradesMode] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:maxUpgradesMode`,
    defaultValue: 'preset'
  });
  const [customMaxUpgrades, setCustomMaxUpgrades] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:customMaxUpgrades`,
    defaultValue: 10
  });
  const [groupMode, setGroupMode] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:groupMode`,
    defaultValue: 'None'
  });
  const [AffordableCheckboxEl, onlyAffordable] = useCheckbox('Only show affordable upgrades');
  const [resourcePerHour, setResourcePerHour] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:resourcePerHour`,
    defaultValue: (() => {
      const obj = {};
      Object.keys(resourceNames).forEach(key => { obj[key] = 1; });
      return obj;
    })()
  });
  // Add a separate state for the raw input string for each resource
  const [resourcePerHourInput, setResourcePerHourInput] = useState(() => {
    const obj = {};
    Object.keys(resourceNames).forEach(key => {
      obj[key] = resourcePerHour[key] !== undefined && resourcePerHour[key] !== null && resourcePerHour[key] !== ''
        ? resourcePerHour[key].toLocaleString()
        : '';
    });
    return obj;
  });
  const [rphDialogOpen, setRphDialogOpen] = useState(false);
  const [optimizationMethod, setOptimizationMethod] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:optimizationMethod`,
    defaultValue: 'rph'
  });

  useEffect(() => {
    setResourcePerHourInput(
      Object.fromEntries(
        Object.entries(resourcePerHour).map(([key, value]) => [
          key,
          value !== undefined && value !== null && value !== '' ? Number(value).toLocaleString() : ''
        ])
      )
    );
  }, [resourcePerHour]);

  const optimizedUpgrades = useMemo(() => {
    if (!character) return [];
    const maxToUse = maxUpgradesMode === 'custom'
      ? Math.max(0, parseInt(customMaxUpgrades || 0, 10) || 0)
      : maxUpgrades;
    return getOptimizedUpgradesFn(character, account, category, maxToUse, {
      onlyAffordable,
      resourcePerHour: optimizationMethod === 'rph' ? resourcePerHour : undefined,
      getResourceType
    });
  }, [character, category, maxUpgradesMode, customMaxUpgrades, maxUpgrades, account, getOptimizedUpgradesFn,
    onlyAffordable, resourcePerHour,
    optimizationMethod, getResourceType]);

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
        // Calculate total stats
        const combinedStats = {};
        let totalCost = 0;
        const resourceType = getResourceType(upgrade);
        upgrade.sequence.forEach(seq => {
          totalCost += seq.cost;
          if (category !== 'all') {
            seq.statChanges.forEach(statChange => {
              if (!combinedStats[statChange.stat]) {
                combinedStats[statChange.stat] = {
                  stat: statChange.stat,
                  change: 0,
                  percentChange: 0
                };
              }
              combinedStats[statChange.stat].change += statChange.change;
              combinedStats[statChange.stat].percentChange += statChange.percentChange;
            });
          }
        });
        return {
          ...upgrade,
          combinedStatChanges: Object.values(combinedStats),
          totalCost,
          resourceType,
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
            combinedStatChanges: {} // temp object for merging
          };
        }

        const g = grouped[upgrade.name];
        g.sequence.push(upgrade);
        g.finalLevel = Math.max(g.finalLevel, upgrade.level);
        g.totalCost += upgrade.cost;

        if (upgrade.statChanges) {
          upgrade.statChanges.forEach(statChange => {
            if (!g.combinedStatChanges[statChange.stat]) {
              g.combinedStatChanges[statChange.stat] = {
                stat: statChange.stat,
                change: 0,
                percentChange: 0
              };
            }
            g.combinedStatChanges[statChange.stat].change += statChange.change;
            g.combinedStatChanges[statChange.stat].percentChange += statChange.percentChange;
          });
        }
      });

      const summary = Object.values(grouped).map(g => ({
        ...g,
        combinedStatChanges: Object.values(g.combinedStatChanges)
      }));

      return summary;
    }
    return optimizedUpgrades.map((upgrade, index) => ({ ...upgrade, upgradeIndex: index }));
  }, [optimizedUpgrades, groupMode, getResourceType]);

  // Calculate total resource costs by type
  const resourceUsage = useMemo(() => {
    const usage = {};
    optimizedUpgrades.forEach(upgrade => {
      const resourceType = getResourceType(upgrade);
      const resourceName = resourceNames[resourceType] || resourceType;
      if (!usage[resourceName]) {
        usage[resourceName] = {
          name: resourceName,
          cost: 0,
          currentAmount: 0
        };
      }
      usage[resourceName].cost += upgrade.cost;
    });
    // Add current amounts
    const resourceArr = resourceKey.split('.').reduce((obj, key) => obj?.[key], account) || [];
    resourceArr.forEach((resource, idx) => {
      const name = resourceNames[idx] || resource.name;
      if (usage[name]) {
        usage[name].currentAmount = getResourceAmount
          ? getResourceAmount(resource, idx, resourceNames)
          : resource.value ?? resource;
      }
    });
    return Object.values(usage);
  }, [optimizedUpgrades, account, resourceKey, resourceNames, getResourceAmount, getResourceType]);

  // Format for display
  const formatChange = (change) => {
    if (change >= 1000) {
      return `+${notateNumber(change)}`;
    }
    return `+${change.toFixed(2).replace(/\.00$/, '')}`;
  };
  const formatPercentChange = (percentChange) => {
    return `+${percentChange.toFixed(2).replace(/\.00$/, '')}%`;
  };
  const renderStatChanges = (statChanges) => {
    return statChanges.map((change, index) => (
      <Typography key={index} variant="body2">
        {change.stat.charAt(0).toUpperCase() + change.stat.slice(1)}: {formatChange(change.change)} ({formatPercentChange(change.percentChange)})
      </Typography>
    ));
  };
  const renderCombinedStats = (upgrade) => {
    if (!upgrade.combinedStatChanges) return null;
    const resourceTypeKey = getResourceType(upgrade);
    return (
      <>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" gutterBottom>
          Total Benefits (Levels {upgrade.startLevel} → {upgrade.finalLevel})
        </Typography>
        {upgrade.combinedStatChanges.map((statChange, index) => (
          <Typography key={index} variant="body2">
            {statChange.stat.charAt(0).toUpperCase() + statChange.stat.slice(1)}: {formatChange(statChange.change)} ({formatPercentChange(statChange.percentChange)})
          </Typography>
        ))}
        <Divider sx={{ my: 1 }} />
        <Stack direction="row" gap={1} alignItems="center">
          <img
            style={{ objectPosition: '0 -6px' }}
            src={`${prefix}data/${resourceImagePrefix}${resourceTypeKey}_x1.png`}
            alt=""
          />
          <Typography variant="body2">Total Cost: {notateNumber(upgrade.totalCost)}</Typography>
        </Stack>
      </>
    );
  };

  // Add a function to sync all input values to resourcePerHour when closing the dialog
  const handleRphDialogClose = () => {
    Object.entries(resourcePerHourInput).forEach(([key, rawValue]) => {
      const raw = (rawValue || '').replace(/\s+/g, '');
      const parsed = parseShorthandNumber(raw);
      if (raw === '' || isNaN(parsed)) {
        setResourcePerHour(rph => ({ ...rph, [key]: '' }));
        setResourcePerHourInput(input => ({ ...input, [key]: '' }));
      }
      else {
        setResourcePerHour(rph => ({ ...rph, [key]: parsed }));
        setResourcePerHourInput(input => ({ ...input, [key]: String(parsed) }));
      }
    });
    setRphDialogOpen(false);
  };

  return (
    <Stack gap={3}>
      <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ width: 200 }}>
          <InputLabel>Optimization Category</InputLabel>
          <Select
            value={category}
            label="Optimization Category"
            onChange={(e) => setCategory(e.target.value)}
          >
            {Object.entries(upgradeCategories).map(([key, { name }]) => (
              <MenuItem key={key} value={key}>{name}</MenuItem>
            ))}
            <MenuItem value={'all'}>All</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 180 }}>
          <InputLabel>Optimization Method</InputLabel>
          <Select
            value={optimizationMethod}
            label="Optimization Method"
            onChange={e => setOptimizationMethod(e.target.value)}
          >
            <MenuItem value="rph">Resource per hour</MenuItem>
            <MenuItem value="cost">Cost only</MenuItem>
          </Select>
        </FormControl>
        {optimizationMethod === 'rph' && (
          <Button sx={{ width: 'fit-content' }} variant="outlined" onClick={() => setRphDialogOpen(true)}>
            Set RPH
          </Button>
        )}
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
        <AffordableCheckboxEl />
        <Tooltip title={tooltipText}>
          <IconInfoCircleFilled />
        </Tooltip>
        <Divider sx={{ my: 1 }} flexItem orientation={'vertical'} />
        {resourceUsage.map((resource) => {
          const resourceTypeKey = Object.keys(resourceNames).find(key => resourceNames[key] === resource.name) || resource.name;
          const resourcePerHourValue = resourcePerHour[resourceTypeKey];
          const hasResourcePerHour = resourcePerHourValue && !isNaN(resourcePerHourValue) && resourcePerHourValue > 0;
          const timeEstimateHours = hasResourcePerHour ? resource.cost / resourcePerHourValue : null;
          // Only show time estimate if it's at least 1 minute (1/60 hour)
          const shouldShowTimeEstimate = timeEstimateHours && timeEstimateHours >= (1 / 60);
          return (
            <Stack key={resource.name} direction="row" gap={1} alignItems="center">
              <img
                style={{ objectPosition: '0 -6px' }}
                src={`${prefix}data/${resourceImagePrefix}${resourceTypeKey}_x1.png`}
                alt={resource.name}
                width={24}
                height={24}
              />
              <Typography>{notateNumber(resource.cost)}</Typography>
              {shouldShowTimeEstimate && (
                <Typography variant="caption" color="text.secondary">
                  ({splitTime(timeEstimateHours)})
                </Typography>
              )}
            </Stack>
          );
        })}
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

      {optimizationMethod === 'rph' && (
        <Dialog open={rphDialogOpen} onClose={handleRphDialogClose}>
          <DialogTitle>Set Resource Per Hour</DialogTitle>
          <DialogContent>
            <Stack direction="column" gap={2}>
              {Object.entries(resourceNames).map(([key, name], index) => (
                <Stack direction="column" key={key}>
                  <Typography variant="caption">{name} per hour:</Typography>
                  <TextField
                    InputProps={{
                      startAdornment: <img
                        style={{ objectPosition: '0 -3px', marginLeft: -5, marginRight: 5 }}
                        src={`${prefix}data/${resourceImagePrefix}${index}_x1.png`}
                        width={24}
                        height={24}
                      />
                    }}
                    type="text"
                    size="small"
                    value={resourcePerHourInput[key]}
                    onChange={e => {
                      const value = e.target.value;
                      if (/^[\d\p{P}\p{Z}kmbtqKMBTQ]*$/u.test(value)) {
                        setResourcePerHourInput(input => ({ ...input, [key]: value }));
                      }
                    }}
                    onBlur={e => {
                      const raw = e.target.value;

                      const parsed = parseShorthandNumber(raw);

                      if (raw === '' || isNaN(parsed)) {
                        setResourcePerHour(rph => ({ ...rph, [key]: '' }));
                        setResourcePerHourInput(input => ({ ...input, [key]: '' }));
                      }
                      else {
                        setResourcePerHour(rph => ({ ...rph, [key]: parsed }));
                        setResourcePerHourInput(input => ({ ...input, [key]: String(parsed) }));
                      }
                    }}
                    inputProps={{ inputMode: 'text', pattern: /^[\d\p{P}\p{Z}kmbtqKMBTQ]*$/u }}
                  />
                  {resourcePerHour[key] && !isNaN(resourcePerHour[key]) && resourcePerHour[key] !== 0 && resourcePerHour[key] > 1000
                    ? (
                      <Typography variant="caption" color="text.secondary">
                        {notateNumber(resourcePerHour[key])}
                      </Typography>
                    )
                    : null}
                </Stack>
              ))}
            </Stack>
            <Button sx={{ mt: 2 }} onClick={handleRphDialogClose} variant="contained">Close</Button>
          </DialogContent>
        </Dialog>
      )}

      <Typography variant="h6">Recommended Upgrade Sequence</Typography>
      {displayUpgrades.length > 0 ? (
        viewMode === 'grid' ? (
          <Stack direction="row" gap={2} flexWrap="wrap">
            {displayUpgrades.map((upgrade) => {
              const hasSequence = upgrade.sequence && upgrade.sequence.length > 1;
              const originalIndex = upgrade.upgradeIndex;
              const resourceTypeKey = getResourceType(upgrade);
              let iconIndex = getUpgradeIconIndex ? getUpgradeIconIndex(upgrade) : upgrade.index;
              return (
                <Card key={originalIndex} sx={{ width: 350 }}>
                  <CardContent>
                    <Stack direction="row" gap={2} sx={{ position: 'relative' }}>
                      <img
                        style={{ width: 32, height: 32 }}
                        src={`${prefix}data/${upgradeImagePrefix}${iconIndex}.png`}
                        alt=""
                      />
                      <Box>
                        <Typography variant="subtitle1">
                          {cleanUnderscore(upgrade.name.replace(/[船般航舞製]/, '')
                            .replace('(Tap_for_more_info)', '')
                            .replace('(#)', ''))} ({upgrade.level} / {upgrade.x4})
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {hasSequence
                            ? `Upgrade Group (#${originalIndex + 1}${upgrade.sequence.length > 1
                              ? ` to #${originalIndex + upgrade.sequence.length}`
                              : ''})`
                            : `Upgrade #${originalIndex + 1}`}
                        </Typography>
                      </Box>
                    </Stack>
                    {hasSequence && upgrade.combinedStatChanges
                      ? renderCombinedStats(upgrade)
                      : (
                        <>
                          <Divider sx={{ my: 1 }} />
                          {category === 'all' ? cleanUnderscore(upgrade.description
                          ) : renderStatChanges(upgrade.statChanges)}
                          <Divider sx={{ my: 1 }} />
                          <Stack direction="row" gap={1} alignItems="center">
                            <img
                              style={{ objectPosition: '0 -6px' }}
                              src={`${prefix}data/${resourceImagePrefix}${resourceTypeKey}_x1.png`}
                              alt=""
                            />
                            <Typography variant="body2">
                              Cost: {notateNumber(upgrade.cost)}
                            </Typography>
                          </Stack>
                        </>
                      )
                    }
                  </CardContent>
                </Card>
              )
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
                  <TableCell>Level</TableCell>
                  <TableCell>Stat Changes</TableCell>
                  <TableCell>Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayUpgrades.map((upgrade, idx) => {
                  const hasSequence = upgrade.sequence && upgrade.sequence.length > 1;
                  const resourceTypeKey = getResourceType(upgrade);
                  let iconIndex = getUpgradeIconIndex ? getUpgradeIconIndex(upgrade) : upgrade.index;
                  return (
                    <TableRow key={upgrade.upgradeIndex}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <img
                          style={{ width: 24, height: 24 }}
                          src={`${prefix}data/${upgradeImagePrefix}${iconIndex}.png`}
                          alt=""
                        />
                      </TableCell>
                      <TableCell>{cleanUnderscore(upgrade.name.replace(/[船般航舞製]/, '').replace('(Tap_for_more_info)', '').replace('(#)', ''))}</TableCell>
                      <TableCell>{upgrade.level} / {upgrade.x4}</TableCell>
                      <TableCell>
                        {hasSequence && upgrade.combinedStatChanges
                          ? (
                            <>
                              <Typography
                                variant="caption">Levels {upgrade.startLevel} → {upgrade.finalLevel}</Typography>
                              {upgrade.combinedStatChanges.map((statChange, i) => (
                                <div key={i}>
                                  {statChange.stat.charAt(0).toUpperCase() + statChange.stat.slice(1)}: {formatChange(statChange.change)} ({formatPercentChange(statChange.percentChange)})
                                </div>
                              ))}
                            </>
                          )
                          : (
                            category === 'all'
                              ? cleanUnderscore(upgrade.description)
                              : upgrade.statChanges.map((statChange, i) => (
                                <div key={i}>
                                  {statChange.stat.charAt(0).toUpperCase() + statChange.stat.slice(1)}: {formatChange(statChange.change)} ({formatPercentChange(statChange.percentChange)})
                                </div>
                              ))
                          )
                        }
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" gap={1} alignItems="center">
                          <img
                            style={{ objectPosition: '0 -6px' }}
                            src={`${prefix}data/${resourceImagePrefix}${resourceTypeKey}_x1.png`}
                            alt=""
                            width={20}
                            height={20}
                          />
                          {hasSequence && upgrade.totalCost
                            ? notateNumber(upgrade.totalCost)
                            : notateNumber(upgrade.cost)}
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
          No viable upgrades found for this category with your current resources.
        </Typography>
      )}
    </Stack>
  );
};

export default GenericUpgradeOptimizer; 
import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';
import useCheckbox from '@components/common/useCheckbox';

/**
 * GenericUpgradeOptimizer
 *
 * Props:
 * - character
 * - account
 * - getOptimizedUpgradesFn: function (character, account, category, maxUpgrades) => upgrades[]
 * - upgradeCategories: object (keyed by category, with { name })
 * - resourceNames: object (maps resource type key to display name)
 * - resourceKey: string (dot-path to resource array in account, e.g. 'compass.dusts')
 * - resourceImagePrefix: string (e.g. 'Dust', 'Bone', 'Tach')
 * - upgradeImagePrefix: string (e.g. 'CompassUpg', 'GrimoireUpg', 'ArcaneUpg')
 * - getResourceType: function (upgrade) => resource type key
 * - getUpgradeIconIndex: function (upgrade) => icon index (optional)
 * - getResourceAmount: function (resource, idx, resourceNames) => value (optional)
 * - tooltipText: string
 */
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
  const [category, setCategory] = useState('damage');
  const [maxUpgrades, setMaxUpgrades] = useState(10);
  const [CheckboxEl, consolidateUpgrades] = useCheckbox('Group by upgrade');
  const [AffordableCheckboxEl, onlyAffordable] = useCheckbox('Only show affordable upgrades');

  const optimizedUpgrades = useMemo(() => {
    if (!character) return [];
    return getOptimizedUpgradesFn(character, account, category, maxUpgrades, { onlyAffordable });
  }, [character, category, maxUpgrades, account, getOptimizedUpgradesFn, onlyAffordable]);

  // Group upgrades by name if consolidation is enabled
  const displayUpgrades = useMemo(() => {
    if (!consolidateUpgrades) {
      return optimizedUpgrades.map((upgrade, index) => ({ ...upgrade, upgradeIndex: index }));
    }
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
          currentGroup.finalLevel = currentGroup.startLevel + currentGroup.sequence.length;
          currentLevels[currentGroup.name] = currentGroup.finalLevel;
          consolidatedUpgrades.push(currentGroup);
        }
        // Start new group
        currentGroup = {
          ...upgrade,
          upgradeIndex: index,
          sequence: [{ ...upgrade, originalIndex: index }],
          startLevel,
        };
      } else {
        currentGroup.sequence.push({ ...upgrade, originalIndex: index });
      }
    });
    // Push the last group
    if (currentGroup) {
      currentGroup.finalLevel = currentGroup.startLevel + currentGroup.sequence.length;
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
  }, [optimizedUpgrades, consolidateUpgrades, getResourceType]);

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
    const resourceTypeKey = Object.keys(resourceNames).find(key => resourceNames[key] === upgrade.resourceType) || upgrade.resourceType;
    return (
      <>
        <Divider sx={{ my: 1 }}/>
        <Typography variant="subtitle2" gutterBottom>
          Total Benefits (Levels {upgrade.startLevel} → {upgrade.finalLevel})
        </Typography>
        {upgrade.combinedStatChanges.map((statChange, index) => (
          <Typography key={index} variant="body2">
            {statChange.stat.charAt(0).toUpperCase() + statChange.stat.slice(1)}: {formatChange(statChange.change)} ({formatPercentChange(statChange.percentChange)})
          </Typography>
        ))}
        <Divider sx={{ my: 1 }}/>
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
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 120 }}>
          <InputLabel>Max Upgrades</InputLabel>
          <Select
            value={maxUpgrades}
            label="Max Upgrades"
            onChange={(e) => setMaxUpgrades(e.target.value)}
          >
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
        <CheckboxEl/>
        <AffordableCheckboxEl/>
        <Tooltip title={tooltipText}>
          <IconInfoCircleFilled/>
        </Tooltip>
        <Divider sx={{ my: 1 }} flexItem orientation={'vertical'}/>
        {resourceUsage.map((resource) => {
          const resourceTypeKey = Object.keys(resourceNames).find(key => resourceNames[key] === resource.name) || resource.name;
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
            </Stack>
          );
        })}
      </Stack>

      <Typography variant="h6">Recommended Upgrade Sequence</Typography>
      {displayUpgrades.length > 0 ? (
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
                        {cleanUnderscore(upgrade.name)} ({upgrade.level} / {upgrade.x4})
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
                        <Divider sx={{ my: 1 }}/>
                        {renderStatChanges(upgrade.statChanges)}
                        <Divider sx={{ my: 1 }}/>
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
        <Typography variant="body1" color="text.secondary">
          No viable upgrades found for this category with your current resources.
        </Typography>
      )}
    </Stack>
  );
};

export default GenericUpgradeOptimizer; 
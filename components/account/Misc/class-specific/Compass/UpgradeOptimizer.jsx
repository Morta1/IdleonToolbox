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
import { dustNames, getOptimizedUpgrades, UPGRADE_CATEGORIES } from '@parsers/compass';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';
import useCheckbox from '@components/common/useCheckbox';

const UpgradeOptimizer = ({ character, account }) => {
  const [category, setCategory] = useState('damage');
  const [maxUpgrades, setMaxUpgrades] = useState(10);
  const [CheckboxEl, consolidateUpgrades] = useCheckbox('Group by upgrade');

  const optimizedUpgrades = useMemo(() => {
    if (!character) return [];
    return getOptimizedUpgrades(character, account, category, maxUpgrades);
  }, [character, category, maxUpgrades, account]);

  // Group upgrades by name if consolidation is enabled
  const displayUpgrades = useMemo(() => {
    if (!consolidateUpgrades) {
      return optimizedUpgrades.map((upgrade, index) => ({ ...upgrade, upgradeIndex: index }));
    }

    // Group upgrades by their base name
    const groupedUpgrades = {};
    optimizedUpgrades.forEach((upgrade, index) => {
      const key = upgrade.name;
      if (!groupedUpgrades[key]) {
        groupedUpgrades[key] = {
          ...upgrade,
          upgradeIndex: index,
          sequence: [{ ...upgrade, originalIndex: index }]
        };
      } else {
        groupedUpgrades[key].sequence.push({ ...upgrade, originalIndex: index });
      }
    });

    // Calculate combined stats for each group
    return Object.values(groupedUpgrades).map(upgrade => {
      if (!upgrade.sequence || upgrade.sequence.length <= 1) {
        return upgrade;
      }

      // Calculate total stats
      const combinedStats = {};
      let totalCost = 0;
      const dustType = dustNames[upgrade.x3];
      const finalLevel = upgrade.sequence[upgrade.sequence.length - 1].level + 1;

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
        dustType,
        startLevel: upgrade.level,
        finalLevel,
        numberOfUpgrades: upgrade.sequence.length
      };
    });
  }, [optimizedUpgrades, consolidateUpgrades]);

  // Calculate total dust costs by type
  const dustUsage = useMemo(() => {
    const usage = {};

    optimizedUpgrades.forEach(upgrade => {
      const dustType = dustNames[upgrade.x3];
      if (!usage[dustType]) {
        usage[dustType] = {
          name: dustType,
          cost: 0,
          currentAmount: 0
        };
      }
      usage[dustType].cost += upgrade.cost;
    });

    // Add current amounts
    account?.compass?.dusts?.forEach(dust => {
      if (usage[dust.name]) {
        usage[dust.name].currentAmount = dust.value;
      }
    });

    return Object.values(usage);
  }, [optimizedUpgrades, account?.compass?.dusts]);

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
            src={`${prefix}data/Dust${upgrade.x3}_x1.png`}
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
            {Object.entries(UPGRADE_CATEGORIES).map(([key, { name }]) => (
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
        <Tooltip
          title="Shows the most efficient upgrade path based on your available resources, in order. Upgrades are ranked by stat improvement per dust cost.">
          <IconInfoCircleFilled/>
        </Tooltip>
        <Divider sx={{ my: 1 }} flexItem orientation={'vertical'}/>
        {dustUsage.map((dust) => (
          <Stack key={dust.name} direction="row" gap={1} alignItems="center">
            <img
              style={{ objectPosition: '0 -6px' }}
              src={`${prefix}data/Dust${Object.keys(dustNames).find(key => dustNames[key] === dust.name)}_x1.png`}
              alt={dust.name}
              width={24}
              height={24}
            />
            <Typography>{notateNumber(dust.cost)}</Typography>
          </Stack>
        ))}
      </Stack>

      <Typography variant="h6">Recommended Upgrade Sequence</Typography>
      {displayUpgrades.length > 0 ? (
        <Stack direction="row" gap={2} flexWrap="wrap">
          {displayUpgrades.map((upgrade) => {
            let iconIndex = upgrade.index;
            if (upgrade.baseIconIndex >= 0) iconIndex = upgrade.baseIconIndex + 106;
            const hasSequence = upgrade.sequence && upgrade.sequence.length > 1;
            const originalIndex = upgrade.upgradeIndex;

            return (
              <Card key={originalIndex} sx={{ width: 350 }}>
                <CardContent>
                  <Stack direction="row" gap={2} sx={{ position: 'relative' }}>
                    <img
                      style={{ width: 32, height: 32, position: 'absolute', left: 0, top: 0 }}
                      src={`${prefix}data/${upgrade.shapeIcon}.png`}
                      alt=""
                    />
                    <img
                      style={{ width: 32, height: 32, zIndex: 1 }}
                      src={`${prefix}data/CompassUpg${iconIndex}.png`}
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
                            src={`${prefix}data/Dust${upgrade.x3}_x1.png`}
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
      )
      }
    </Stack>
  );
};

export default UpgradeOptimizer;
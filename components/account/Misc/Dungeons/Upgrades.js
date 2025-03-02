import { cleanUnderscore, growth } from '../../../../utility/helpers';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import React from 'react';

const insideDungeonUpgradeMaxLevel = 100;
const flurboUpgradeMaxLevel = 50;

const Upgrades = ({ insideUpgrades, upgrades }) => {
  return <>
    <Stack direction="row" flexWrap={'wrap'} gap={4}>
      <UpgradeList upgrades={insideUpgrades}/>
      <UpgradeList isFlurbo upgrades={upgrades}/>
    </Stack>
  </>
};

export default Upgrades;

const UpgradeList = ({ isFlurbo, upgrades = [] }) => {
  const calcBonus = (upgrade) => {
    return growth(upgrade?.func, upgrade?.level, upgrade?.x1, upgrade?.x2);
  };

  const calcCostToMax = (level) => {
    let total = 0;
    for (let i = level; i < (isFlurbo ? 50 : 100); i++) {
      total += calcUpgradeCost(i);
    }
    return total;
  };

  const calcUpgradeCost = (level) => {
    if (isFlurbo) {
      const baseMath = Math.pow(1.7 * level, 1.05);
      const moreMath = 1.027 + ((level - 30) / (level + 30)) * 0.01 * Math.floor((level + 970) / 1000);
      return Math.floor(1 + baseMath * Math.pow(moreMath, level));
    } else {
      const baseMath = Math.pow(1.5 * level, 1.04);
      const moreMath = 1.024 + ((level - 60) / (level + 60)) * 0.01 * Math.floor((level + 940) / 1000);
      return Math.floor(2 + baseMath * Math.pow(moreMath, level));
    }
  };

  return (
    <Stack>
      <Typography my={2} variant="h4">
        {isFlurbo ? 'Flurbo' : 'Dungeon'} Upgrades
      </Typography>
      <Stack gap={1}>
        {upgrades.map((upgrade, index) => {
          const { level, type, effect } = upgrade;
          const isMaxed = level >= (isFlurbo ? flurboUpgradeMaxLevel : insideDungeonUpgradeMaxLevel);
          return (
            <Card key={`${effect}-${index}`} sx={{ width: { md: 450 },
              border: isMaxed ? '1px solid' : '',
              borderColor: isMaxed ? 'success.light' : ''}}>
              <CardContent sx={{
              }}>
                <Stack direction="row" justifyContent="space-between" gap={2}>
                  <Stack>
                    <Typography>
                      +{calcBonus(upgrade)}
                      {type === '%' ? type : ''} {cleanUnderscore(effect)}
                    </Typography>
                    <Typography>{`Lv. ${level} / ${isFlurbo
                      ? flurboUpgradeMaxLevel
                      : insideDungeonUpgradeMaxLevel}`}</Typography>
                  </Stack>
                  <Stack direction="row" gap={3}>
                    <Stack>
                      <Typography color={'text.secondary'}>Cost</Typography>
                      <Typography>{calcUpgradeCost(level)}</Typography>
                    </Stack>
                    <Stack>
                      <Typography color={'text.secondary'}>Cost To Max</Typography>
                      <Typography>{calcCostToMax(level)}</Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Stack>
  );
};


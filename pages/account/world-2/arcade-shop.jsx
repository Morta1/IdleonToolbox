import { Box, Card, CardContent, Checkbox, Divider, FormControlLabel, FormGroup, Stack, Typography } from '@mui/material';
import React, { useContext, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from 'utility/helpers';
import {
  ARCADE_MAX_LEVEL,
  ARCADE_OMEGA_LEVEL,
  ARCADE_SUPER_LEVEL,
  formatArcadeEffect,
  getArcadeCapCost,
  isArcadePlaceholder
} from '@parsers/world-2/arcade';
import styled from '@emotion/styled';
import { getStampBonus } from '@parsers/world-1/stamps';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue } from '@components/common/styles';
import { CardWithBreakdown } from '@components/common/Breakdown/CardWithBreakdown';
import SetGoalButton from '@components/goals/SetGoalButton';
import { goalHostSx } from '@components/goals/goalHost';

// The game's Royal and Omega ball glyphs (font 472) and Super / Omega level banners (font 675)
const ROYAL_BALL_ICON = 'etc/RoyalBall.png';
const OMEGA_BALL_ICON = 'etc/OmegaBall.png';
const ARCADE_SUPER_BANNER = 'etc/ArcadeSuper.png';
const ARCADE_OMEGA_BANNER = 'etc/ArcadeOmega.png';

const ArcadeShop = () => {
  const { state } = useContext(AppContext);
  const { balls, goldBalls, shop, royalBalls, omegaBalls, goldBallMulti } = state?.account?.arcade || {};
  const [hideMaxed, setHideMaxed] = useState(false);
  const [hideSuper, setHideSuper] = useState(false);
  const [hideOmega, setHideOmega] = useState(false);

  const passesFilter = (upgrade) => {
    if (isArcadePlaceholder(upgrade)) return false;
    if (hideMaxed && upgrade.level === ARCADE_MAX_LEVEL) return false;
    if (hideSuper && upgrade.level === ARCADE_SUPER_LEVEL) return false;
    if (hideOmega && upgrade.level >= ARCADE_OMEGA_LEVEL) return false;
    return true;
  };

  // game: "DungeonCalc:ArcadeCost" (gold balls below Lv 100; Royal and Omega balls are getArcadeCapCost)
  const getCost = (level, upgradeIndex) => {
    const arcadeStamp = getStampBonus(state?.account, 'misc', 'StampC5', 0);
    const arcadeStampMath = Math.max(0.6, 1 - arcadeStamp / 100);

    // Different cost formulas based on upgrade index
    if (upgradeIndex === 39) {
      return Math.round(arcadeStampMath * (5 + 3 * level));
    } else if (upgradeIndex === 51 || upgradeIndex === 54 || upgradeIndex === 999) {
      return Math.round(arcadeStampMath * (10 + (5 * level + Math.pow(level, 1.43))));
    } else if (upgradeIndex >= 70) {
      // Checked before the >= 62 tier - the 2 upgrades added in 2.3.525 (indices 70/71) use this curve.
      return Math.round(arcadeStampMath * (20 + (10 * level + Math.pow(level, 1.92))));
    } else if (upgradeIndex >= 62) {
      return Math.round(arcadeStampMath * (20 + (10 * level + Math.pow(level, 1.69))));
    } else if (upgradeIndex >= 55 && upgradeIndex !== 60 && upgradeIndex !== 61) {
      return Math.round(arcadeStampMath * (20 + (10 * level + Math.pow(level, 1.83))));
    } else {
      return Math.round(arcadeStampMath * (5 + (3 * level + Math.pow(level, 1.3))));
    }
  }

  const getCostToMax = (level, upgradeIndex) => {
    let total = 0;
    for (let i = level; i < ARCADE_MAX_LEVEL; i++) {
      total += getCost(i, upgradeIndex);
    }
    return total;
  }

  const activeUpgrades = shop?.filter((u) => u.active && passesFilter(u))?.toSorted((a, b) => a?.rotationIndex - b?.rotationIndex) || [];
  const inactiveUpgrades = shop?.filter((u) => !u.active && passesFilter(u)) || [];

  // Calculate total cost to max for all upgrades
  const totalCostToMax = shop?.filter((upgrade) => !isArcadePlaceholder(upgrade))?.reduce((total, upgrade) => {
    const upgradeIndex = parseInt(upgrade.iconName.replace('PachiShopICON', ''), 10);
    return total + getCostToMax(upgrade.level, upgradeIndex);
  }, 0) || 0;

  const renderUpgradeCard = (upgrade, index) => {
    const { level, effect, iconName, bonus } = upgrade;
    // Extract upgrade index from iconName (format: PachiShopICON{index})
    const upgradeIndex = parseInt(iconName.replace('PachiShopICON', ''), 10);
    const eff = cleanUnderscore(formatArcadeEffect(effect, bonus));
    const cost = getCost(level, upgradeIndex);
    const costToMax = getCostToMax(level, upgradeIndex);
    const capCost = getArcadeCapCost(level);
    const isMaxed = level === ARCADE_MAX_LEVEL;
    const isSuper = level === ARCADE_SUPER_LEVEL;
    const isOmega = level >= ARCADE_OMEGA_LEVEL;
    return (
      <Card key={`${iconName}-${index}`}
            sx={{
              ...goalHostSx,
              position: 'relative',
              outline: isMaxed || isSuper || isOmega ? '1px solid' : '',
              outlineColor: isMaxed ? 'success.light' : isSuper ? 'info.dark' : isOmega ? 'secondary.main' : ''
            }}>
        <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
          <SetGoalButton system="arcade" entryKey={String(upgradeIndex)}/>
        </Box>
        <CardContent sx={{ width: 330 }}>
          <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
            <UpgradeIcon src={`${prefix}data/${iconName}.png`} alt=""/>
            <Stack>
              <Typography variant={'body1'} style={{ fontWeight: 'bold' }}>{eff}</Typography>
              <Divider sx={{ my: .5 }}/>
              {level < ARCADE_MAX_LEVEL ? <>
                <Typography variant={'body2'}>Lv: {level} / {ARCADE_MAX_LEVEL}</Typography>
              </> : isOmega || isSuper ? (
                <LevelBanner src={`${prefix}${isOmega ? ARCADE_OMEGA_BANNER : ARCADE_SUPER_BANNER}`} alt={isOmega ? 'Omega' : 'Super'}/>
              ) : (
                <Typography>Maxed</Typography>
              )}
              {costToMax > 0 ? <>
                <Typography variant={'body2'}>Cost: {commaNotation(cost, 2)}</Typography>
                <Typography variant={'body2'}>Cost To Max: {commaNotation(costToMax, 2)}</Typography>
              </> : null}
              {capCost ? (
                <Stack direction={'row'} alignItems={'center'} gap={.5}>
                  <Typography variant={'body2'}>Cost: {capCost.cost}</Typography>
                  <img width={18} height={18} src={`${prefix}${capCost.currency === 'omega' ? OMEGA_BALL_ICON : ROYAL_BALL_ICON}`}
                       alt={capCost.currency === 'omega' ? 'Omega balls' : 'Royal balls'}/>
                </Stack>
              ) : isOmega ? (
                <Typography variant={'body2'}>Omega Status Achieved!</Typography>
              ) : null}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Stack>
      <NextSeo
        title="Arcade Shop | Idleon Toolbox"
        description="Track your arcade shop upgrades, ball counts, golden balls, and bonus effects in Legends of Idleon"
      />
      <Stack mb={3} direction="row" gap={2} flexWrap={'wrap'}>
        <CardTitleAndValue title="Balls">
          <Stack direction="row" gap={2}>
            <BallIcon src={`${prefix}data/PachiBall0.png`} alt="arcade-silver-balls"/>
            <Typography>{balls}</Typography>
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title="Gold balls">
          <Stack direction="row" gap={2}>
            <BallIcon gold src={`${prefix}data/PachiBall1.png`} alt="arcade-gold-balls"/>
            <Typography>{goldBalls}</Typography>
          </Stack>
        </CardTitleAndValue>
        <CardWithBreakdown title={'Gold ball multi'} value={`${notateNumber(goldBallMulti?.value ?? 1, 'MultiplierInfo')}x`}
                           breakdown={goldBallMulti?.breakdown}/>
        <CardTitleAndValue title="Royal balls">
          <Stack direction="row" gap={2}>
            <BallIcon src={`${prefix}${ROYAL_BALL_ICON}`} alt="arcade-royal-balls"/>
            <Typography>{royalBalls}</Typography>
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title="Omega balls">
          <Stack direction="row" gap={2}>
            <BallIcon src={`${prefix}${OMEGA_BALL_ICON}`} alt="arcade-omega-balls"/>
            <Typography>{commaNotation(omegaBalls ?? 0)}</Typography>
          </Stack>
        </CardTitleAndValue>
        {totalCostToMax > 0 && (
          <CardTitleAndValue title="Total Cost To Max All">
            <Typography>{commaNotation(totalCostToMax, 2)}</Typography>
          </CardTitleAndValue>
        )}
        <CardTitleAndValue title="Filters">
          <FormGroup row>
            <FormControlLabel
              control={<Checkbox size="small" checked={hideMaxed} onChange={(e) => setHideMaxed(e.target.checked)}/>}
              label="Hide Maxed"
            />
            <FormControlLabel
              control={<Checkbox size="small" checked={hideSuper} onChange={(e) => setHideSuper(e.target.checked)}/>}
              label="Hide Super!"
            />
            <FormControlLabel
              control={<Checkbox size="small" checked={hideOmega} onChange={(e) => setHideOmega(e.target.checked)}/>}
              label="Hide Omega!"
            />
          </FormGroup>
        </CardTitleAndValue>
      </Stack>

      <Stack mt={2} direction="row" flexWrap="wrap" gap={2}>
        {activeUpgrades.length > 0 && (
          <>
            <Typography variant="h6" sx={{ width: '100%' }}>
              Current Rotation
            </Typography>
            {activeUpgrades.map(renderUpgradeCard)}
          </>
        )}
        {inactiveUpgrades.length > 0 && (
          <>
            <Typography variant="h6" sx={{ width: '100%', mt: 3 }}>Off rotation</Typography>
            {inactiveUpgrades.map(renderUpgradeCard)}
          </>
        )}
      </Stack>
    </Stack>
  );
};

const UpgradeIcon = styled.img`
  width: 55px;
  height: 55px;
`;

const BallIcon = styled.img`
  width: 24px;
  height: 24px;
  ${({ gold }) => gold ? `filter: hue-rotate(70deg) brightness(2);` : ''}
`;

// The Super / Omega banner the arcade card draws in place of the level
const LevelBanner = styled.img`
  width: auto;
  height: 14px;
  align-self: flex-start;
  margin: 4px 0;
`;

export default ArcadeShop;
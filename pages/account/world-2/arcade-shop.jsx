import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, kFormatter, notateNumber, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import { getStampBonus } from 'parsers/stamps';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue } from '@components/common/styles';

const MAX_LEVEL = 100;

const ArcadeShop = () => {
  const { state } = useContext(AppContext);
  const { balls, goldBalls, shop, royalBalls } = state?.account?.arcade || {};

  const getCost = (level) => {
    const multiplier = (state?.account?.lab?.labBonuses?.find((bonus) => bonus.name === 'Certified_Stamp_Book')?.active)
      ? 2
      : 1;
    const arcadeStamp = getStampBonus(state?.account, 'misc', 'StampC5', 0, multiplier);
    const arcadeStampMath = Math.max(0.6, 1 - arcadeStamp / 100);
    return Math.round(arcadeStampMath * (5 + (3 * level + Math.pow(level, 1.3))));
  }

  const getCostToMax = (level) => {
    let total = 0;
    for (let i = level; i < MAX_LEVEL; i++) {
      total += getCost(i);
    }
    return total;
  }

  const activeUpgrades = shop?.filter((u) => u.active)?.toSorted((a, b) => a?.rotationIndex - b?.rotationIndex) || [];
  const inactiveUpgrades = shop?.filter((u) => !u.active) || [];

  const renderUpgradeCard = (upgrade, index) => {
    const { level, effect, iconName, bonus } = upgrade;
    const eff = cleanUnderscore(effect.replace('{', notateNumber(bonus, 'MultiplierInfo').replace('.00', '')));
    const cost = getCost(level);
    const costToMax = getCostToMax(level);
    const isMaxed = level === MAX_LEVEL;
    const isSuper = level > MAX_LEVEL;
    return (
      <Card key={`${iconName}-${index}`}
            sx={{
              outline: isMaxed || isSuper ? '1px solid' : '',
              outlineColor: isMaxed ? 'success.light' : isSuper ? 'info.dark' : ''
            }}>
        <CardContent sx={{ width: 330 }}>
          <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
            <UpgradeIcon src={`${prefix}data/${iconName}.png`}/>
            <Stack>
              <Typography variant={'body1'} style={{ fontWeight: 'bold' }}>{eff}</Typography>
              <Divider sx={{ my: .5 }}/>
              {level < MAX_LEVEL ? <>
                <Typography variant={'body2'}>Lv: {level} / {MAX_LEVEL}</Typography>
              </> : isSuper ? (
                <Typography>Super!</Typography>
              ) : (
                <Typography>Maxed</Typography>
              )}
              {costToMax > 0 ? <>
                <Typography variant={'body2'}>Cost: {kFormatter(cost, 2)}</Typography>
                <Typography variant={'body2'}>Cost To Max: {kFormatter(costToMax, 2)}</Typography>
              </> : null}
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
        description="Arcade shop upgrades, balls and golden balls"
      />
      <Stack direction="row" gap={2} flexWrap={'wrap'}>
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
        <CardTitleAndValue title="Royal balls">
          <Stack direction="row" gap={2}>
            <BallIcon blue src={`${prefix}data/PachiBall1.png`} alt="arcade-royal-balls"/>
            <Typography>{royalBalls}</Typography>
          </Stack>
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
  ${({ gold, blue }) => blue ? `filter: hue-rotate(230deg) brightness(2);`
          : gold ? `filter: hue-rotate(70deg) brightness(2);` : ''}
`;

export default ArcadeShop;

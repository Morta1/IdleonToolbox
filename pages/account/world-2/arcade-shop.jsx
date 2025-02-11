import { Card, CardContent, Stack, Typography } from '@mui/material';
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
    for (let i = level; i < 100; i++) {
      total += getCost(i);
    }
    return total
  }

  return (
    <Stack>
      <NextSeo
        title="Arcade Shop | Idleon Toolbox"
        description="Arcade shop upgrades, balls and golden balls"
      />
      <Stack direction={'row'} gap={2}>
        <CardTitleAndValue title={'Balls'}>
          <Stack direction={'row'} gap={2}>
            <BallIcon src={`${prefix}data/PachiBall0.png`} alt=""/>
            <Typography>{balls}</Typography>
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Gold balls'}>
          <Stack direction={'row'} gap={2}>
            <BallIcon gold src={`${prefix}data/PachiBall1.png`} alt=""/>
            <Typography>{goldBalls}</Typography>
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Royal balls'}>
          <Stack direction={'row'} gap={2}>
            <BallIcon blue src={`${prefix}data/PachiBall1.png`} alt=""/>
            <Typography>{royalBalls}</Typography>
          </Stack>
        </CardTitleAndValue>
      </Stack>
      <Stack mt={2} direction={'row'} flexWrap={'wrap'} gap={2}>
        {shop?.map((upgrade, index) => {
          const { level, effect, active, iconName, bonus } = upgrade;
          const eff = cleanUnderscore(effect.replace('{', notateNumber(bonus, 'Small')));
          const cost = getCost(level);
          const costToMax = getCostToMax(level);
          return <Card sx={{
            width: { xs: 150, md: 350 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'column', md: 'row' },
            outline: level >= MAX_LEVEL ? '1px solid' : '',
            outlineColor: (theme) => level <= MAX_LEVEL
              ? theme.palette.success.light
              : level > 100 ? theme.palette.info.dark
              : ''
          }} key={`${iconName}-${index}`}>
            <UpgradeIcon style={{
              margin: 16,
              justifySelf: 'center',
              alignSelf: 'center',
              filter: active ? 'unset' : 'grayscale(1)'
            }} src={`${prefix}data/${iconName}.png`}/>
            <CardContent>
              <div style={{ fontWeight: 'bold' }}>Effect: {eff}</div>
              {level < 100 ? <div>Lv: {level} / {MAX_LEVEL}</div> :
                level > 100 ? <div className={'done'}>Super!</div> :
                  <div className={'done'}>Maxed</div>}
              <div>Cost: {kFormatter(cost, 2)}</div>
              <div>Cost To Max: {kFormatter(costToMax, 2)}</div>
            </CardContent>
          </Card>
        })}
      </Stack>
    </Stack>
  );
};

const UpgradeIcon = styled.img`
  width: 62px;
  height: 62px;
`

const BallIcon = styled.img`
  width: 24px;
  height: 24px;
  ${({ gold, blue }) => blue ? `filter: hue-rotate(230deg) brightness(2);` : gold ? `filter: hue-rotate(70deg) brightness(2);` : ''}
`

export default ArcadeShop;

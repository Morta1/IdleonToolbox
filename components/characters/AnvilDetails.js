import { useMemo } from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { getCoinsArray, kFormatter, notateNumber, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import CoinDisplay from '../common/CoinDisplay';
import { calcAnvilExp, getPlayerAnvil } from 'parsers/anvil';

const AnvilDetails = ({ character, account, characters }) => {
  const { stats } = useMemo(() => getPlayerAnvil(character, characters, account), [character, characters, account]);
  const {
    xpPoints,
    speedPoints,
    capPoints,
    anvilSpeed,
    anvilCapacity,
    anvilCost,
    baseAnvilExp
  } = stats;
  return (
    <Stack>
      <Typography variant={'h5'}>
        Anvil Details
      </Typography>
      <Stack>
        <Section title={<PointsTitle {...stats} smithingLevel={character?.skillsInfo?.smithing?.level}/>}>
          <PointsCard title={'Exp'} value={xpPoints}/>
          <PointsCard title={'Speed'} value={speedPoints}/>
          <PointsCard title={'Capacity'} value={capPoints}/>
        </Section>
        <Section title={'Bonus'}>
          <PointsCard title={'Exp'}
                      value={`${notateNumber(calcAnvilExp(character, characters, account, baseAnvilExp, xpPoints), 'Big')}%`}/>
          <PointsCard title={'Speed'} value={notateNumber(anvilSpeed, 'Big')}/>
          <PointsCard title={'Capacity'} value={kFormatter(anvilCapacity)}/>
        </Section>
        <Section title={'Material'}>
          <PointsCard title={'Item'} value={anvilCost?.rawName ?
            <MaterialIcon src={`${prefix}data/${anvilCost?.rawName}.png`} alt={''}/> : <></>}/>
          <PointsCard title={'Upg. cost'} value={kFormatter(anvilCost?.nextMatUpgrade, 2)}/>
          <PointsCard title={'Total Spent'} value={kFormatter(anvilCost?.totalMats)}/>
        </Section>
        <Section title={'Money'}>
          <PointsCard title={'Upg. cost'} money sx={{ pb: 2 }}
                      value={<CoinDisplay title={''} maxCoins={3} money={getCoinsArray(anvilCost?.nextCoinUpgrade)}/>}/>
          <PointsCard title={'Total Spent'} money sx={{ pb: 2 }}
                      value={<CoinDisplay title={''} maxCoins={3} money={getCoinsArray(anvilCost?.totalCoins)}/>}/>
        </Section>
        {anvilCost?.coinsToMax > 0
          ? <PointsCard title={'Coins to max'} money sx={{ pb: 2, my: 2 }}
                        value={<CoinDisplay title={''} maxCoins={3}
                                            money={getCoinsArray(anvilCost?.coinsToMax)}/>}/>
          : null}
      </Stack>
    </Stack>
  );
};

const MaterialIcon = styled.img`
  width: 30px;
  height: 30px;
`;

const PointsTitle = ({ availablePoints, pointsFromCoins, pointsFromMats, smithingLevel = 0 }) => {
  const color = availablePoints === 0 ? '' : availablePoints > 0 ? 'error.light' : 'secondary';
  return (
    <Stack mb={1}>
      <Typography my={1} variant={'h6'}>
        Points (
        <Typography variant={'h6'} component={'span'} color={color}>
          {pointsFromCoins + pointsFromMats - availablePoints + smithingLevel}
        </Typography>{' '}
        / {pointsFromCoins + pointsFromMats + smithingLevel})
      </Typography>
      <Typography variant="caption">Points From Mats: {pointsFromMats}</Typography>
      <Typography variant="caption">Points From Coins: {pointsFromCoins}</Typography>
      <Typography variant="caption">Points Smithing: {smithingLevel}</Typography>
    </Stack>
  );
};

const PointsCard = ({ title, value, money, sx }) => {
  return (
    <Card sx={{ width: '100%', ...sx }}>
      <CardContent sx={{ '&:last-child': { p: '10px' } }}>
        <Typography fontWeight={'bold'}>{title}</Typography>
        {money ? value : <Typography>{value}</Typography>}
      </CardContent>
    </Card>
  );
};

const Section = ({ title, children }) => {
  return (
    <>
      {typeof title === 'object' ? (
        title
      ) : (
        <Typography my={1} variant={'h6'}>
          {title}
        </Typography>
      )}
      <Stack direction={'row'} gap={2}>
        {children}
      </Stack>
    </>
  );
};

export default AnvilDetails;

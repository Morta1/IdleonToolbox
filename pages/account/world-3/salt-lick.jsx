import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, kFormatter, prefix, round } from 'utility/helpers';
import { Card, CardContent, Container, Divider, Stack, Typography } from '@mui/material';
import styled from '@emotion/styled';
import { NextSeo } from 'next-seo';
import AutoGrid from '@components/common/AutoGrid';

const SaltLick = () => {
  const { state } = useContext(AppContext);
  const { saltLick = [] } = state?.account || {};

  const calcBonusCost = (bonus) => {
    return Math.floor(bonus?.baseCost * Math.pow(bonus?.increment, bonus?.level ?? 0));
  }

  const calcCostToMax = (bonus) => {
    let costToMax = 0;
    for (let i = bonus?.level; i < bonus?.maxLevel; i++) {
      costToMax += calcBonusCost({ ...bonus, level: i });
    }
    return costToMax ?? 0;
  }

  const calcBonus = (bonus) => {
    return round(bonus.baseBonus * (bonus.level ?? 0));
  }
  return <>
    <NextSeo
      title="Salt Lick | Idleon Toolbox"
      description="Keep track of your salt lick levels and upgrades"
    />
    <Container>
      <AutoGrid>
        {saltLick?.map((bonus, index) => {
          const { desc, name, level, maxLevel, rawName, totalAmount } = bonus;
          const calculatedBonusCost = calcBonusCost(bonus);
          const costToMax = calcCostToMax(bonus);
          const calculatedBonus = calcBonus(bonus);
          return <Card key={name + ' ' + index} sx={{
            outline: level >= maxLevel ? '1px solid' : '',
            outlineColor: (theme) => level >= maxLevel
              ? theme.palette.success.light
              : ''
          }}>
            <CardContent
              sx={{ '&:last-child': { padding: 2 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Stack mb={2} gap={1} direction={'row'} justifyContent={'space-between'} divider={<Divider/>}>
                <Typography sx={{ maxWidth: 250 }}
                            variant={'body1'}>{cleanUnderscore(desc.replace('{', calculatedBonus))}</Typography>
                <Typography variant={'body2'}>Lv. {level}/{maxLevel}</Typography>
              </Stack>
              <Stack sx={{ mt: 'auto' }} direction={'row'} justifyContent={'space-between'}>
                <Stack justifyContent={'center'} alignItems={'center'}>
                  <ItemIcon src={`${prefix}data/${rawName}.png`} alt="required-item-icon"/>
                  {costToMax > 0 ?
                    <Typography>{kFormatter(totalAmount, 2)} / {kFormatter(calculatedBonusCost, 2)}</Typography> :
                    <Typography sx={{ alignSelf: 'center', color: 'success.main' }}>Maxed</Typography>}
                </Stack>
                {costToMax > 0 ? <Stack justifyContent={'center'} alignItems={'center'}>
                  <ItemIcon src={`${prefix}data/${rawName}.png`} alt="required-item-icon"/>
                  <Typography>{kFormatter(costToMax, 2)}</Typography>
                </Stack> : null}
              </Stack>
            </CardContent>
          </Card>
        })}
      </AutoGrid>
    </Container>
  </>
};

const ItemIcon = styled.img`
  width: 30px;
`;

export default SaltLick;

import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, kFormatter, prefix, round } from 'utility/helpers';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import styled from '@emotion/styled';
import { NextSeo } from 'next-seo';

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
    <Stack gap={3}>
      {saltLick?.map((bonus, index) => {
        const { desc, name, level, maxLevel, rawName, totalAmount } = bonus;
        const calculatedBonusCost = calcBonusCost(bonus);
        const costToMax = calcCostToMax(bonus);
        const calculatedBonus = calcBonus(bonus);
        return <Card key={name + ' ' + index} sx={{ width: { xs: '100%', md: 630 },
          outline: level >= maxLevel ? '1px solid' : '',
          outlineColor: (theme) => level >= maxLevel
            ? theme.palette.success.light
            : '',
        }}>
          <CardContent>
            <Stack sx={{ flexDirection: { xs: 'column', md: 'row' } }} justifyContent={'space-between'}
                   alignItems={'center'} flexWrap={'wrap'}>
              <Stack gap={1} sx={{ width: { md: 350 } }}>
                <Typography>{cleanUnderscore(desc.replace('{', calculatedBonus))}</Typography>
                <Typography>Lv. {level}/{maxLevel}</Typography>
              </Stack>
              <Stack justifyContent={'center'} alignItems={'center'}>
                <ItemIcon src={`${prefix}data/${rawName}.png`} alt=""/>
                {costToMax > 0 ?
                  <Typography>{kFormatter(totalAmount, 2)} / {kFormatter(calculatedBonusCost, 2)}</Typography> :
                  <Typography sx={{ alignSelf: 'center', color: 'success.main' }}>Maxed</Typography>}
              </Stack>
              {costToMax > 0 ? <Stack justifyContent={'center'} alignItems={'center'}>
                <ItemIcon src={`${prefix}data/${rawName}.png`} alt=""/>
                <Typography>{kFormatter(costToMax, 2)}</Typography>
              </Stack> : null}
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

const ItemIcon = styled.img`
  width: 30px;
`;

export default SaltLick;

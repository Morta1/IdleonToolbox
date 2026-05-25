import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import Tabber from '@components/common/Tabber';
import Tooltip from '@components/Tooltip';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';
import Upgrades from '@components/account/clickers/bubba/Upgrades';

const formatMeatsliceRate = (value) => {
  if (value >= 1e6) {
    return notateNumber(value, 'Big');
  }
  if (value >= 100) {
    return commaNotation(value);
  }
  return Math.round(10 * value) / 10;
};

const Bubba = () => {
  const { state } = useContext(AppContext);
  const { bubba } = state?.account || {};

  return <>
    <NextSeo
      title="Bubba | Idleon Toolbox"
      description="Track your Bubba minigame upgrades, candy progress, and bonus effects in Legends of Idleon"
    />

    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Meat Slices'} value={formatMeatsliceRate(bubba?.meatSlices || 0)} icon={'etc/Bubba_0.png'} />
      <CardTitleAndValue title={'Progress'} value={`${formatMeatsliceRate(bubba?.progress)}/${formatMeatsliceRate(bubba?.progressReq)}`} icon={'etc/Bubba_0.png'} />
      <CardTitleAndValue title={'Meat Slices/min'} value={formatMeatsliceRate(bubba?.meatsliceRate || 0)} icon={'etc/Bubba_0.png'} />
    </Stack>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {bubba?.bonuses && Object.values(bubba.bonuses).map(({ name, bonus, percentage, isNegative }, index) => {
        const formattedBonus = isNegative ? '-' + notateNumber(bonus, 'MultiplierInfo').replace('.00', '') + '%' : notateNumber(bonus, 'MultiplierInfo').replace('.00', '') + '%';

        return <CardTitleAndValue
          cardSx={{ my: 1 }}
          key={name}
          title={name}
          value={formattedBonus}
          icon={`etc/Bubba_${index + 1}.png`}
        />
      })}
    </Stack>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {bubba?.megaFlesh?.map(({ description, unlocked, amount, totalBonus }, index) => {
        const formattedDesc = totalBonus !== undefined
          ? description.replace('$', totalBonus)
          : description;
        return <CardTitleAndValue cardSx={{ my: 1 }} value={amount > 0 ? amount : ''}
                                  tooltipTitle={cleanUnderscore(formattedDesc)}
                                  key={'megaflesh' + index} icon={`data/BubbaMF${index}.png`}
                                  imgStyle={{ width: 32, opacity: unlocked ? 1 : .5 }} imgOnly/>
      })}
    </Stack>
    <Upgrades upgrades={bubba?.upgrades} />
  </>
};

export default Bubba;

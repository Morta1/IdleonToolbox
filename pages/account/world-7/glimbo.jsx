import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack } from '@mui/material';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
import { notateNumber } from '@utility/helpers';
import GlimboTrades from '@components/account/Worlds/World7/Glimbo/GlimboTrades';
import { getResearchGridBonus } from '@parsers/world-7/research';

const Glimbo = () => {
  const { state } = useContext(AppContext);
  const minehead = state?.account?.minehead;
  const account = state?.account;

  if (!minehead) return <MissingData name={'glimbo'} />;

  const { glimbo, glimboTotalTrades } = minehead;
  const dropRateBonus = getResearchGridBonus(account, 168, 0) >= 1 ? getResearchGridBonus(account, 168, 2) : 0;

  return <>
    <NextSeo
      title="Glimbo | Idleon Toolbox"
      description="Track your Glimbo's Swap Meet trades and Max LV bonuses"
    />

    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <CardTitleAndValue
        title={'Total Trades'}
        value={glimboTotalTrades ?? 0}
      />
      <CardTitleAndValue
        title={'Drop Rate Bonus'}
        value={`${notateNumber(1 + dropRateBonus / 100, 'MultiplierInfo').replace(/#/g, '')}x`}
      />
    </Stack>

    <GlimboTrades glimbo={glimbo} />
  </>;
};

export default Glimbo;

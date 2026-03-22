import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack } from '@mui/material';
import { MissingData } from '@components/common/styles';
import Upgrades from '@components/account/Worlds/World7/AdviceFish/Upgrades';

const AdviceFish = () => {
  const { state } = useContext(AppContext);
  const { upgrades } = state?.account?.adviceFish || {};

  if (!state?.account?.adviceFish) return <MissingData name={'adviceFish'} />;

  return <>
    <NextSeo
      title="Advice Fish | Idleon Toolbox"
      description="Track your Advice Fish upgrade levels, bonuses, and unlock progression in Legends of Idleon World 7"
    />

    <Upgrades upgrades={upgrades} />
  </>;
};

export default AdviceFish;


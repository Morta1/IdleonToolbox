import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { MissingData } from '@components/common/styles';
import { NextSeo } from 'next-seo';
import General from '@components/account/Worlds/World5/Gaming/General';

const Gaming = () => {
  const { state } = useContext(AppContext);
  if (!state?.account?.gaming) return <MissingData name={'gaming'}/>;
  return <>
    <NextSeo
      title="Gaming | Idleon Toolbox"
      description="Keep track of your gaming upgrades including dirty shovel and autumn squirrel timers"
    />
    <General account={state?.account} characters={state?.characters} lastUpdated={state?.lastUpdated}/>
  </>
};

export default Gaming;

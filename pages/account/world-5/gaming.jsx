import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { MissingData, isSectionFailed } from '@components/common/styles';
import { NextSeo } from 'next-seo';
import General from '@components/account/Worlds/World5/Gaming/General';
import Palette from '@components/account/Worlds/World5/Gaming/Palette';

const Gaming = () => {
  const { state } = useContext(AppContext);
  const gaming = state?.account?.gaming;
  const sectionFailed = isSectionFailed(state?.account, 'gaming');
  if (!gaming || sectionFailed) return <MissingData name={'Gaming'} failed={sectionFailed}/>;
  return <>
    <NextSeo
      title="Gaming | Idleon Toolbox"
      description="Keep track of your gaming upgrades including dirty shovel and autumn squirrel timers"
    />

    <General account={state?.account} characters={state?.characters} lastUpdated={state?.lastUpdated}/>
  </>
};

export default Gaming;

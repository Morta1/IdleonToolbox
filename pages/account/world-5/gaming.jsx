import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { MissingData } from '@components/common/styles';
import { NextSeo } from 'next-seo';
import General from '@components/account/Worlds/World5/Gaming/General';
import Palette from '@components/account/Worlds/World5/Gaming/Palette';

const Gaming = () => {
  const { state } = useContext(AppContext);
  // The parser now returns a populated shape at zero rather than nothing, so the imports, fertilizer
  // upgrades, superbits and mutations are all worth showing whether or not gaming is unlocked.
  const gaming = state?.account?.gaming;
  if (!gaming) return <MissingData name={'gaming'}/>;
  return <>
    <NextSeo
      title="Gaming | Idleon Toolbox"
      description="Keep track of your gaming upgrades including dirty shovel and autumn squirrel timers"
    />

    <General account={state?.account} characters={state?.characters} lastUpdated={state?.lastUpdated}/>
  </>
};

export default Gaming;

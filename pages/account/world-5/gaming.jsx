import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { MissingData, isSectionFailed } from '@components/common/styles';
import { NextSeo } from 'next-seo';
import General from '@components/account/Worlds/World5/Gaming/General';
import Notice from '@components/common/Notice';

const Gaming = () => {
  const { state } = useContext(AppContext);
  // The gaming section's failed default is null (parsers/index.ts): the page reads it as {}
  const gaming = state?.account?.gaming ?? {};
  const sectionFailed = isSectionFailed(state?.account, 'gaming');
  // unlocked also needs the World 7 Spelunk save (gaming.ts), so bits say the account has played Gaming
  const reached = gaming?.unlocked || (gaming?.bits ?? 0) > 0;
  return <>
    <NextSeo
      title="Gaming | Idleon Toolbox"
      description="Keep track of your gaming upgrades including dirty shovel and autumn squirrel timers"
    />
    {sectionFailed ? <MissingData name={'Gaming'} failed/>
      : reached ? null : <Notice tone={'locked'} sx={{ mb: 2 }}>Your account hasn&apos;t reached Gaming yet.</Notice>}
    <General account={state?.account} gaming={gaming} sectionFailed={sectionFailed} characters={state?.characters}
             lastUpdated={state?.lastUpdated}/>
  </>;
};

export default Gaming;

import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { formatGame } from '@utility/gameNotation';
import { MissingData, isSectionFailed } from '@components/common/styles';
import { getHatRack } from '@parsers/world-3/hatRack';
import HatRack from '@components/account/Worlds/World3/HatRack';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';

const HatRackPage = () => {
  const { state } = useContext(AppContext);
  const sectionFailed = isSectionFailed(state?.account, 'hatRack');
  const { bonusMulti, hatBonuses, totalHats, allPremiumHelmets } = state?.account?.hatRack ?? {};
  // A failed section lists the premium helmets at zero (the parser's catalog with no save)
  const helmets = sectionFailed && !allPremiumHelmets?.length ? getHatRack({}, {})?.allPremiumHelmets : allPremiumHelmets;

  return (
    <>
      <NextSeo
        title="Hat Rack | Idleon Toolbox"
        description="Keep track of your hat rack bonuses and premium hats"
      />
      {sectionFailed ? <MissingData name={'Hat Rack'} failed/> : null}
      <PageSummary>
        <StatTile label={'Total hats'} value={sectionFailed ? '-' : totalHats ?? 0} kind={'amount'}/>
        <StatTile label={'Bonus multi'} value={sectionFailed ? '-' : `${formatGame(bonusMulti ?? 1, 'Gallery.HatrackBonusMulti')}x`}/>
      </PageSummary>
      <HatRack hatBonuses={hatBonuses} allPremiumHelmets={helmets} sectionFailed={sectionFailed}/>
    </>
  );
};

export default HatRackPage;

import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { formatGame } from '@utility/gameNotation';
import { MissingData, isSectionFailed } from '@components/common/styles';
import { getHatRack, isHatRackActive } from '@parsers/world-3/hatRack';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import HatRack from '@components/account/Worlds/World3/HatRack';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';

const HatRackPage = () => {
  const { state } = useContext(AppContext);
  const sectionFailed = isSectionFailed(state?.account, 'hatRack');
  const { bonusMulti, bonusMultiBreakdown, hatBonuses, totalHats, allPremiumHelmets } = state?.account?.hatRack ?? {};
  // A failed section lists the premium helmets at zero (the parser's catalog with no save)
  const helmets = sectionFailed && !allPremiumHelmets?.length ? getHatRack({}, {})?.allPremiumHelmets : allPremiumHelmets;
  const multiText = sectionFailed ? '-' : `${formatGame(bonusMulti ?? 1, 'Gallery.HatrackBonusMulti')}x`;
  // game: Gallery("PremHatBonusesSystemON"), a character gets the rack's bonuses only once it has cleared YumYum Grotto
  const withoutRack = (state?.characters ?? []).filter((character) => !isHatRackActive(character));

  return (
    <>
      <NextSeo
        title="Hat Rack | Idleon Toolbox"
        description="Keep track of your hat rack bonuses and premium hats"
      />
      {sectionFailed ? <MissingData name={'Hat Rack'} failed atZero/> : null}
      <PageSummary>
        <StatTile label={'Total hats'} value={sectionFailed ? '-' : `${formatNum(totalHats ?? 0)} / ${formatNum(helmets?.length ?? 0)}`}/>
        <StatTile label={'Bonus multi'} value={multiText} breakdownTitle={'Bonus multi'}
                  breakdown={!sectionFailed && bonusMultiBreakdown ? { ...bonusMultiBreakdown, totalValue: multiText } : undefined}/>
        {!sectionFailed && withoutRack.length ? <StatTile label={'No rack bonuses'} value={formatNum(withoutRack.length)}
                                                          sub={withoutRack.map(({ name }) => cleanUnderscore(name)).join(', ')}
                                                          info={'A character gets the hat rack\'s bonuses once it has cleared YumYum Grotto in World 2.'}/> : null}
      </PageSummary>
      <HatRack bonusMulti={bonusMulti} hatBonuses={hatBonuses} allPremiumHelmets={helmets} sectionFailed={sectionFailed}/>
    </>
  );
};

export default HatRackPage;

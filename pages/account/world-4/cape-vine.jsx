import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { isCapeVineActive } from '@parsers/world-4/capeVine';
import { formatGame } from '@utility/gameNotation';
import { NextSeo } from 'next-seo';
import { MissingData, isParseFailed, isSectionFailed } from '@components/common/styles';
import CapeVine from '@components/account/Worlds/World4/CapeVine';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';

const CapeVinePage = () => {
  const { state } = useContext(AppContext);
  const {
    bonusMulti,
    bonusMultiBreakdown,
    capeBonuses,
    capesUsed,
    allCapes,
    totalCapes,
    totalEligibleCapes,
    goldenVines,
    nextGoldenVineClassLevel
  } = state?.account?.capeVine || {};

  const sectionFailed = isSectionFailed(state?.account, 'capeVine');
  const parseFailed = isParseFailed(state?.account);
  const multiText = `${formatGame(bonusMulti ?? 1, 'Gallery.CapevineBonusMulti')}x`;
  // game: Gallery("CapevineBonusesSystemON"), a character gets the vine's bonuses only once it has cleared Frostbite Towndra
  const withoutVine = sectionFailed || !state?.account?.capeVine?.inSave ? []
    : (state?.characters ?? []).filter((character) => !isCapeVineActive(character, state?.account));

  return (
    <>
      <NextSeo
        title="Cape Vine | Idleon Toolbox"
        description="Keep track of your Cape Vine bonuses, Golden Vines and every cape you still need"
      />
      {!state?.account?.capeVine || sectionFailed ? <MissingData name={'Cape Vine'} failed={sectionFailed} atZero={!parseFailed}/> : null}
      <PageSummary failed={sectionFailed}>
        <StatTile label={'Capes collected'} value={`${formatNum(totalCapes ?? 0)} / ${formatNum(totalEligibleCapes ?? 0)}`}/>
        <StatTile label={'Bonus multi'} value={multiText} breakdownTitle={'Bonus multi'}
                  breakdown={!sectionFailed && bonusMultiBreakdown ? { ...bonusMultiBreakdown, totalValue: multiText } : undefined}
                  info={'Capes past your Golden Vines get a quarter of this.'}/>
        <StatTile label={'Golden Vines'} value={goldenVines ?? 0} kind={'amount'}/>
        <StatTile label={'Next Golden Vine'} value={`Class Lv ${formatNum(nextGoldenVineClassLevel ?? 0)}`}/>
        {withoutVine.length ? <StatTile label={'No vine bonuses'} value={formatNum(withoutVine.length)}
                                        sub={withoutVine.map(({ name }) => cleanUnderscore(name)).join(', ')}
                                        info={"A character gets the Cape Vine's bonuses once it has cleared Frostbite Towndra in World 3."}/> : null}
      </PageSummary>
      {parseFailed ? null : <CapeVine capesUsed={capesUsed} capeBonuses={capeBonuses} allCapes={allCapes} sectionFailed={sectionFailed}/>}
    </>
  );
};

export default CapeVinePage;

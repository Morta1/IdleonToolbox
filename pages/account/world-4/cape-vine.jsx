import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { NextSeo } from 'next-seo';
import { MissingData, isSectionFailed } from '@components/common/styles';
import CapeVine from '@components/account/Worlds/World4/CapeVine';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';

const CapeVinePage = () => {
  const { state } = useContext(AppContext);
  const {
    bonusMulti,
    capeBonuses,
    capesUsed,
    allCapes,
    totalCapes,
    totalEligibleCapes,
    goldenVines,
    nextGoldenVineClassLevel
  } = state?.account?.capeVine || {};

  const sectionFailed = isSectionFailed(state?.account, 'capeVine');

  return (
    <>
      <NextSeo
        title="Cape Vine | Idleon Toolbox"
        description="Keep track of your Cape Vine bonuses, Golden Vines and every cape you still need"
      />
      {!state?.account?.capeVine || sectionFailed ? <MissingData name={'Cape Vine'} failed={sectionFailed}/> : null}
      <PageSummary failed={sectionFailed}>
        <StatTile label={'Capes collected'} value={`${formatNum(totalCapes ?? 0)} / ${formatNum(totalEligibleCapes ?? 0)}`}/>
        <StatTile label={'Bonus multi'} value={`${formatGame(bonusMulti ?? 1, 'Gallery.CapevineBonusMulti')}x`}/>
        <StatTile label={'Golden Vines'} value={goldenVines ?? 0} kind={'amount'}/>
        <StatTile label={'Next Golden Vine'} value={`Class Lv ${formatNum(nextGoldenVineClassLevel ?? 0)}`}/>
      </PageSummary>
      {sectionFailed ? null : <CapeVine capesUsed={capesUsed} capeBonuses={capeBonuses} allCapes={allCapes}/>}
    </>
  );
};

export default CapeVinePage;

import React, { useContext, useMemo } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import ConstellationsComp from 'components/account/Misc/Constellations';
import StarSigns from 'components/account/Misc/StarSigns';
import { NextSeo } from 'next-seo';
import { getShinyBonus } from '../../../parsers/breeding';
import { isRiftBonusUnlocked } from '../../../parsers/world-4/rift';
import Tabber from '../../../components/common/Tabber';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';

const Constellations = () => {
  const { state } = useContext(AppContext);

  const getInfiniteStar = (rift, pets) => {
    if (isRiftBonusUnlocked(rift, 'Infinite_Stars')) {
      return 5 + getShinyBonus(pets, 'Infinite_Star_Signs');
    }
  }

  const sortStarSigns = (starSigns) => {
    const sortAlphaNum = (a, b) => a.indexedStarName.localeCompare(b.indexedStarName, 'en', { numeric: true });
    const sortedSigns = starSigns?.sort(sortAlphaNum);
    const lastItem = sortedSigns?.pop();
    sortedSigns?.splice(21, 0, lastItem);
    return sortedSigns;
  }

  const infiniteStars = useMemo(() => getInfiniteStar(state?.account?.rift, state?.account?.breeding?.pets), [state?.account?.rift,
    state?.account?.breeding?.pets])

  const stars = useMemo(() => sortStarSigns(state?.account?.starSigns), [state?.account?.starSigns])

  return <div>
    <NextSeo
      title="Constellations | Idleon Toolbox"
      description="Constellation and star signs overview"
    />
    <Tabber tabs={getTabs(PAGES.ACCOUNT.misc.categories, 'constellations')} clearOnChange={['nt']}>
      <ConstellationsComp constellations={state?.account?.constellations}/>
      <StarSigns starSigns={stars} infiniteStars={infiniteStars}/>
    </Tabber>
  </div>
};

export default Constellations;

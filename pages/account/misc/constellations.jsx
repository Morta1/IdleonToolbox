import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import ConstellationsComp from 'components/account/Misc/Constellations';
import StarSigns from 'components/account/Misc/StarSigns';
import { NextSeo } from 'next-seo';
import { getShinyBonus } from '@parsers/world-4/breeding';
import { isRiftBonusUnlocked } from '../../../parsers/world-4/rift';
import { parseConstellations, parseStarSigns } from '@parsers/starSigns';
import Tabber from '../../../components/common/Tabber';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';
import { MissingData, isSectionFailed } from '@components/common/styles';

// The game's display order: by its sign number, the last sign shown 22nd. A copy: the parsed account keeps its order
// (the parsers count the Infinite Stars by position)
const byIndexedName = (a, b) => `${a?.indexedStarName ?? ''}`.localeCompare(`${b?.indexedStarName ?? ''}`, 'en', { numeric: true });
const displayOrder = (signs) => {
  const sorted = (signs ?? []).toSorted(byIndexedName);
  return sorted.length ? sorted.slice(0, -1).toSpliced(21, 0, sorted.at(-1)) : sorted;
};

const Constellations = () => {
  const { state } = useContext(AppContext);
  const constellationsFailed = isSectionFailed(state?.account, 'constellations');
  const starSignsFailed = isSectionFailed(state?.account, 'starSigns');
  const failedNames = [constellationsFailed && 'Constellations', starSignsFailed && 'Star signs'].filter(Boolean);

  const getInfiniteStar = (rift, pets) => {
    if (isRiftBonusUnlocked(rift, 'Infinite_Stars')) {
      return 5 + getShinyBonus(pets, 'Infinite_Star_Signs');
    }
  }

  const infiniteStars = starSignsFailed ? 0 : getInfiniteStar(state?.account?.rift, state?.account?.breeding?.pets);
  // A failed section draws the game's catalog at zero: no claim, no sign unlocked
  const constellations = constellationsFailed ? parseConstellations([]) : state?.account?.constellations;
  const stars = displayOrder(starSignsFailed ? parseStarSigns(undefined, {}) : state?.account?.starSigns);

  return <div>
    <NextSeo
      title="Constellations | Idleon Toolbox"
      description="Explore all constellation completions and star sign bonuses for your Legends of Idleon characters"
    />
    {failedNames.length ? <MissingData name={failedNames.join(' and ')} failed/> : null}
    <Tabber tabs={getTabs(PAGES.ACCOUNT.misc.categories, 'constellations')} clearOnChange={['nt']}>
      <ConstellationsComp constellations={constellations ?? []} characters={state?.characters}
                          sectionFailed={constellationsFailed}/>
      <StarSigns starSigns={stars} infiniteStars={infiniteStars}/>
    </Tabber>
  </div>
};

export default Constellations;

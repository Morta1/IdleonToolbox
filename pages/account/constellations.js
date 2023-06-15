import { Tab, Tabs, useMediaQuery } from '@mui/material';
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import ConstellationsComp from 'components/account/Misc/Constellations';
import StarSigns from 'components/account/Misc/StarSigns';
import { NextSeo } from 'next-seo';
import { getShinyBonus } from '../../parsers/breeding';
import { isRiftBonusUnlocked } from '../../parsers/world-4/rift';

const tabs = ['Constellations', 'Star Signs'];

const Constellations = () => {
  const { state } = useContext(AppContext);
  const [selectedTab, setSelectedTab] = useState(0);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });

  const getInfiniteStar = (rift, pets) => {
    if (isRiftBonusUnlocked(rift, 'Infinite_Stars')) {
      return 5 + getShinyBonus(pets, 'Infinite_Star_Signs');
    }
  }

  const sortStarSigns = (starSigns) => {
    const sortAlphaNum = (a, b) => a.indexedStarName.localeCompare(b.indexedStarName, 'en', { numeric: true });
    const sortedSigns = starSigns?.sort(sortAlphaNum);
    const lastItem = sortedSigns?.pop();
    sortedSigns.splice(21, 0, lastItem);
    return sortedSigns;
  }

  const infiniteStars = useMemo(() => getInfiniteStar(state?.account?.rift, state?.account?.breeding?.pets), [state?.account?.rift,
    state?.account?.breeding?.pets])

  const stars = useMemo(() => sortStarSigns(state?.account?.starSigns), [state?.account?.starSigns])

  return <div>
    <NextSeo
      title="Idleon Toolbox | Constellations"
      description="Constellation and star signs overview"
    />
    <Tabs centered
          sx={{ marginBottom: 3 }}
          variant={isMd ? 'fullWidth' : 'standard'}
          value={selectedTab} onChange={(e, selected) => setSelectedTab(selected)}>
      {tabs?.map((tab, index) => {
        return <Tab label={tab} key={`${tab}-${index}`}/>
      })}
    </Tabs>
    {selectedTab === 0 ? <ConstellationsComp constellations={state?.account?.constellations}/> : null}
    {selectedTab === 1 ? <StarSigns starSigns={stars} infiniteStars={infiniteStars}/> : null}
  </div>
};

export default Constellations;

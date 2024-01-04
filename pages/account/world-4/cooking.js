import { Typography } from '@mui/material';
import React, { useContext, useMemo } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import Kitchens from 'components/account/Worlds/World4/Kitchens';
import Meals from 'components/account/Worlds/World4/Meals';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';

const Cooking = () => {
  const { state } = useContext(AppContext);
  const { cooking, achievements, sailing } = state?.account || {};

  const totalMealSpeed = useMemo(() => cooking?.kitchens?.reduce((sum, kitchen) => sum + (kitchen.status === 3 ? 0 : kitchen.mealSpeed), 0), [cooking]);

  return (
    <>
      <NextSeo
        title="Cooking | Idleon Toolbox"
        description="Keep track of your kitchens and meals progression"
      />
      <Typography variant={'h2'} textAlign={'center'} mb={3}>Cooking</Typography>
      <Tabber tabs={['Kitchens', 'Meals']}>
        <Kitchens {...cooking} achievements={achievements} lastUpdated={state?.lastUpdated}
                  totalMealSpeed={totalMealSpeed} lab={state?.account?.lab} equinoxUpgrades={state?.account?.equinox?.upgrades}
        />
        <Meals characters={state?.characters}
               {...cooking}
               lab={state?.account?.lab}
               achievements={achievements}
               totalMealSpeed={totalMealSpeed}
          artifacts={sailing?.artifacts}
          equinoxUpgrades={state?.account?.equinox?.upgrades}
        />
      </Tabber>
    </>
  );
};


export default Cooking;

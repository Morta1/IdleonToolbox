import { Tab, Tabs, Typography, useMediaQuery } from "@mui/material";
import React, { useContext, useMemo, useState } from "react";
import { AppContext } from "components/common/context/AppProvider";
import Kitchens from "components/account/Worlds/World4/Kitchens";
import Meals from "components/account/Worlds/World4/Meals";

const Cooking = () => {
  const { state } = useContext(AppContext);
  const { cooking, achievements, sailing } = state?.account || {};
  const [selectedTab, setSelectedTab] = useState(0);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const handleOnClick = (e, selected) => {
    setSelectedTab(selected);
  }

  const totalMealSpeed = useMemo(() => cooking?.kitchens?.reduce((sum, kitchen) => sum + kitchen.mealSpeed, 0), [cooking]);

  return (
    <>
      <Typography variant={'h2'} textAlign={'center'} mb={3}>Cooking</Typography>
      <Tabs centered
            sx={{ marginBottom: 3 }}
            variant={isMd ? 'fullWidth' : 'standard'}
            value={selectedTab} onChange={handleOnClick}>
        {['Kitchens', 'Meals']?.map((tab, index) => {
          return <Tab label={tab} key={`${tab}-${index}`}/>;
        })}
      </Tabs>

      {selectedTab === 0 ?
        <Kitchens {...cooking} achievements={achievements} lastUpdated={state?.lastUpdated}
                  totalMealSpeed={totalMealSpeed}/> : null}
      {selectedTab === 1 ? <Meals characters={state?.characters}
                                  {...cooking}
                                  achievements={achievements}
                                  totalMealSpeed={totalMealSpeed}
                                  artifacts={sailing?.artifacts}
      /> : null}
    </>
  );
};


export default Cooking;

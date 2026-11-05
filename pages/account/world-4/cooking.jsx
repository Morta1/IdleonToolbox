import { Box, TextField } from '@mui/material';
import React, { useContext, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import Kitchens from 'components/account/Worlds/World4/Kitchens';
import Meals, { MEALS_GEAR, MEALS_SETTINGS, MealsSettings } from '@components/account/Worlds/World4/Meals';
import CookingMastery from '@components/account/Worlds/World4/CookingMastery';
import Ribbons from '@components/account/Worlds/World4/Ribbons';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import { getTabs } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { calcTotalMeals, getTotalMealSpeed, parseKitchens } from '@parsers/world-4/cooking';
import MenuItem from '@mui/material/MenuItem';
import { getPlayerLabChipBonus } from '@parsers/world-4/lab';
import { PAGES } from '@components/constants';
import { MissingData, isParseFailed, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import PageSettings, { joinSettings, usePageSettings } from '@components/common/PageSettings';
import { PageHeaderControl } from '@components/common/NavBar/PageHeader';
import useTabIndex from '@hooks/useTabIndex';

const COOKING_SETTINGS = { forceNano: false };

const hasGordonius = (character) => character?.starSigns?.find(({ starName }) => starName === 'Gordonius_Major');
const gordoniusInfinite = (account) => account?.starSigns?.find(({ starName, isInfiniteStar }) => starName === 'Gordonius_Major'
  && isInfiniteStar);

const Cooking = () => {
  const { state } = useContext(AppContext);
  const tabs = getTabs(PAGES.ACCOUNT['world 4'].categories, 'cooking');
  const [tabIndex] = useTabIndex(tabs);
  const account = state?.account;
  const characters = state?.characters;
  const { achievements, sailing } = account || {};
  const cooking = account?.cooking ?? {};
  const sectionFailed = isSectionFailed(account, 'cooking');
  // The kitchens parse on their own (safeSection('cooking.kitchens')) from the cooking section, so they count as
  // failed with it too
  const kitchensFailed = sectionFailed || isSectionFailed(account, 'cooking.kitchens');
  const [pickedId, setPickedId] = useState(null);
  const selectedCharacter = characters?.find((character) => character?.playerId === pickedId) || characters?.[0];
  const [settings, setSettings] = usePageSettings('cooking', COOKING_SETTINGS);
  // The Meals tab's settings, kept under the tab's own key
  const [mealSettings, setMealSettings] = usePageSettings('cooking-meals', MEALS_SETTINGS);
  // A character with the chip and Gordonius Major counts it whatever the setting
  const characterNano = !!getPlayerLabChipBonus(selectedCharacter, account, 15)
    && (!!hasGordonius(selectedCharacter) || !!gordoniusInfinite(account));
  const enableNanoChip = characterNano || Boolean(settings?.forceNano);
  const kitchens = cooking?.rawKitchens && !kitchensFailed
    ? parseKitchens(cooking.rawKitchens, cooking.rawAtoms, characters, account,
      { characterIndex: selectedCharacter?.playerId, enableNanoChip })
    : cooking?.kitchens;

  const totalMealSpeed = getTotalMealSpeed(kitchens);

  return (
    <>
      <NextSeo
        title="Cooking | Idleon Toolbox"
        description="Track your kitchen meal levels, cooking speed, and recipe bonuses for all meals in Legends of Idleon"
      />
      {characters?.length && !sectionFailed ? <PageHeaderControl>
        <TextField select value={selectedCharacter?.playerId ?? ''} onChange={(event) => setPickedId(event.target.value)}
                   sx={{ minWidth: 180 }}
                   slotProps={{
                     select: {
                       renderValue: (id) => <><Box component={'span'} sx={{ color: 'text.secondary', mr: 0.75 }}>Character</Box>
                         {characters?.find((character) => character?.playerId === id)?.name}</>,
                       SelectDisplayProps: { 'aria-label': 'Cooking character' }
                     }
                   }}>
          {characters?.map((character) => <MenuItem key={character?.playerId}
                                                    value={character?.playerId}>{character?.name}</MenuItem>)}
        </TextField>
      </PageHeaderControl> : null}
      {characters?.length && !sectionFailed ? <PageSettings {...joinSettings({ state: settings, defaults: COOKING_SETTINGS, set: setSettings },
        { state: mealSettings, defaults: MEALS_GEAR, set: setMealSettings })}>
        <PageSettings.Toggle name={'forceNano'} label={'Force nano chip'}
                             help={'Counts the nano chip in meal speed for any character, assuming Gordonius Major is active.'}/>
        <MealsSettings account={account} characters={characters}/>
      </PageSettings> : null}
      {sectionFailed ? <MissingData name={'Cooking'} failed atZero={!isParseFailed(account) && tabs[tabIndex] === 'Meals'}/> : kitchensFailed ? <MissingData name={'Kitchens'} failed/> : null}
      <PageSummary>
        <StatTile label={'Meal speed'} value={kitchensFailed ? '-' : `${formatGame(totalMealSpeed, 'CookingR.CookingSPEED')}/hr`}
                  sub={enableNanoChip && !kitchensFailed ? 'Nano chip counted' : undefined}/>
        <StatTile label={'Meal max level'} value={sectionFailed ? '-' : cooking?.mealMaxLevel ?? 0} kind={'amount'}/>
        <StatTile label={'Total meal levels'} value={sectionFailed ? '-' : calcTotalMeals(cooking?.meals) ?? 0} kind={'amount'}/>
      </PageSummary>
      <Tabber tabs={tabs}>
        <Meals characters={characters}
               {...cooking}
               kitchens={kitchens}
               achievements={achievements}
               totalMealSpeed={totalMealSpeed}
               account={account}
               artifacts={sailing?.artifacts}
               mealMaxLevel={cooking?.mealMaxLevel}
               equinoxUpgrades={account?.equinox?.upgrades}
               kitchensFailed={kitchensFailed}
               sectionFailed={sectionFailed}
        />
        <Kitchens {...cooking}
                  kitchens={kitchens}
                  achievements={achievements}
                  lastUpdated={state?.lastUpdated}
                  characters={characters}
                  totalMealSpeed={totalMealSpeed}
                  lab={account?.lab}
                  equinoxUpgrades={account?.equinox?.upgrades}
                  account={account}
                  sectionFailed={sectionFailed}
                  kitchensFailed={kitchensFailed}
        />
        <Ribbons cookingMastery={cooking?.cookingMastery} account={account} sectionFailed={sectionFailed}/>
        <CookingMastery cookingMastery={cooking?.cookingMastery} account={account} sectionFailed={sectionFailed}/>
      </Tabber>
    </>
  );
};


export default Cooking;

import { Box, TextField } from '@mui/material';
import { NextSeo } from 'next-seo';
import React, { useContext, useState } from 'react';
import Tabber from '@components/common/Tabber';
import Market from '@components/account/Worlds/World6/Farming/Market';
import { AppContext } from '@components/common/context/AppProvider';
import Plot from '@components/account/Worlds/World6/Farming/Plot';
import Crop from '@components/account/Worlds/World6/Farming/Crop';
import { formatNum, getTabs } from '@utility/helpers';
import RankDatabase from '@components/account/Worlds/World6/Farming/RankDatabase';
import LandRankOptimizer from '@components/account/Worlds/World6/Farming/UpgradeOptimizer';
import { PAGES } from '@components/constants';
import ExoticMarket from '@components/account/Worlds/World6/Farming/ExoticMarket';
import ExoticMarketRotation from '@components/account/Worlds/World6/Farming/ExoticMarketRotation';
import Stickers from '@components/account/Worlds/World6/Farming/Stickers';
import { CLASSES, getCharacterByHighestTalent } from '@parsers/talents';
import { getPlayerLabChipBonus } from '@parsers/world-4/lab';
import MenuItem from '@mui/material/MenuItem';
import { getSkillExpMulti } from '@parsers/character';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import { PageHeaderControl } from '@components/common/NavBar/PageHeader';

const FARMING_SETTINGS = { forceNano: false };

const Farming = () => {
  const { state } = useContext(AppContext);
  const farming = state?.account?.farming || {};
  const characters = state?.characters;
  const account = state?.account;
  const {
    market,
    exoticMarket,
    plot,
    crop,
    hasLandRank,
    maxTimes,
    cropDepot = {},
    instaGrow,
    beanTrade,
    ranks,
    totalPoints,
    usedPoints,
    stats
  } = farming;

  const [pickedId, setPickedId] = useState(null);
  // The Death Bringer with the most Mass Irrigation, until the player picks another (the lookup answers 0 for none)
  const selectedCharacter = characters?.find((character) => character?.playerId === pickedId)
    || getCharacterByHighestTalent(characters, CLASSES.Death_Bringer, 'MASS_IRRIGATION') || characters?.[0];
  const [settings, setSettings, resetSettings] = usePageSettings('farming', FARMING_SETTINGS);

  const hasNanoAndGordonius = () => {
    const hasChip = getPlayerLabChipBonus(selectedCharacter, account, 15);
    const hasGordonius = selectedCharacter?.starSigns?.find(({ starName }) => starName === 'Cropiovo_Minor');
    return !!hasChip && !!hasGordonius;
  };
  // A character with the chip and Cropiovo Minor counts it whatever the setting
  const enableNano = hasNanoAndGordonius() || Boolean(settings?.forceNano);

  const farmingExp = getSkillExpMulti('farming', selectedCharacter, characters, account);
  // The parser titles this breakdown with its own partial copy of the game's switch ("515622Mx"): the drawer totals
  // the number instead, so it reads like the tile and every other drawer (×516B)
  const farmingExpBreakdown = farmingExp?.breakdown ? { ...farmingExp.breakdown, totalValue: farmingExp?.value } : undefined;

  return <>
    <NextSeo
      title="Farming | Idleon Toolbox"
      description="Track your farming garden plots, crop progress, OG bonuses, and evolution upgrades in Legends of Idleon"
    />
    {characters?.length ? <PageHeaderControl>
      <TextField select value={selectedCharacter?.playerId ?? ''} onChange={(event) => setPickedId(event.target.value)}
                 sx={{ minWidth: 180 }}
                 slotProps={{
                   select: {
                     renderValue: (id) => <><Box component={'span'} sx={{ color: 'text.secondary', mr: 0.75 }}>Character</Box>
                       {characters?.find((character) => character?.playerId === id)?.name}</>,
                     SelectDisplayProps: { 'aria-label': 'Character' }
                   }
                 }}>
        {characters?.map((character) => <MenuItem key={character?.playerId}
                                                  value={character?.playerId}>{character?.name}</MenuItem>)}
      </TextField>
    </PageHeaderControl> : null}
    {characters?.length ? <PageSettings state={settings} defaults={FARMING_SETTINGS} onChange={setSettings}
                                        onReset={resetSettings}>
      <PageSettings.Toggle name={'forceNano'} label={'Force nano chip'}
                           help={'Counts the nano chip in crop evo for any character, assuming Cropiovo Minor is active.'}/>
    </PageSettings> : null}
    <PageSummary>
      <StatTile label={'Bean Trade'} icon={'data/Quest80_x1.png'} value={formatNum(Math.round(beanTrade ?? 0))}
                breakdown={stats?.magicBean}/>
      <StatTile label={'Insta Grow'} value={instaGrow ?? 0} kind={'amount'}/>
      <StatTile label={'Rank points'} value={`${formatNum(usedPoints ?? 0)} / ${formatNum(totalPoints ?? 0)}`}/>
      <StatTile label={'Crops found'} value={farming?.cropsFound ?? 0} kind={'amount'}/>
      {stats ? <>
        <StatTile label={'Growth Speed'} value={formatNum(stats?.growthSpeed?.totalValue, 'mult')}
                  breakdown={stats?.growthSpeed}/>
        <StatTile label={'OG Chance Multi'} value={formatNum(stats?.ogChance?.totalValue, 'mult')}
                  breakdown={stats?.ogChance}/>
        <StatTile label={'Farming EXP'} value={formatNum(farmingExp?.value, 'mult')} breakdown={farmingExpBreakdown}/>
        <StatTile label={'Land Rank EXP'} value={formatNum(stats?.landRankExp?.totalValue, 'mult')}
                  breakdown={stats?.landRankExp}/>
        <StatTile label={'Crops on Vine'} value={stats?.cropsOnVine?.totalValue} kind={'amount'}
                  breakdown={stats?.cropsOnVine}/>
        <StatTile label={'Crop Value'} value={formatNum(stats?.cropValue?.totalValue, 'mult')}
                  breakdown={stats?.cropValue}/>
      </> : null}
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 6'].categories, 'farming')}>
      <Plot plot={plot} crop={crop} market={market} ranks={ranks} lastUpdated={state?.lastUpdated}
            characters={characters}
            account={account}
            selectedCharacter={selectedCharacter}
            enableNano={enableNano}/>
      <Market market={market} crop={crop}/>
      <ExoticMarket market={exoticMarket} crop={crop}/>
      <ExoticMarketRotation/>
      <RankDatabase ranks={ranks} hasLandRank={hasLandRank}/>
      <LandRankOptimizer/>
      <Crop crop={crop} maxTimes={maxTimes} cropDepot={cropDepot}/>
      <Stickers/>
    </Tabber>
  </>
};

export default Farming;

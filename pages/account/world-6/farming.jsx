import { FormControl, InputLabel, Select, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import React, { useContext, useEffect, useState } from 'react';
import Tabber from '@components/common/Tabber';
import Market from '@components/account/Worlds/World6/Farming/Market';
import { AppContext } from '@components/common/context/AppProvider';
import Plot from '@components/account/Worlds/World6/Farming/Plot';
import Crop from '@components/account/Worlds/World6/Farming/Crop';
import { CardTitleAndValue } from '@components/common/styles';
import { commaNotation, getTabs, notateNumber, prefix } from '@utility/helpers';
import RankDatabase from '@components/account/Worlds/World6/Farming/RankDatabase';
import { PAGES } from '@components/constants';
import ExoticMarket from '@components/account/Worlds/World6/Farming/ExoticMarket';
import ExoticMarketRotation from '@components/account/Worlds/World6/Farming/ExoticMarketRotation';
import Stickers from '@components/account/Worlds/World6/Farming/Stickers';
import { CLASSES, getCharacterByHighestTalent } from '@parsers/talents';
import { getPlayerLabChipBonus } from '@parsers/world-4/lab';
import useCheckbox from '@components/common/useCheckbox';
import MenuItem from '@mui/material/MenuItem';
import { CardWithBreakdown } from '@components/account/Worlds/World5/Hole/commons';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { getSkillExpMulti } from '@parsers/character';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';

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

  const [selectedCharacter, setSelectedCharacter] = useState(characters?.[0]);
  const [NanoCheckboxEl, enableNano, setEnableNano] = useCheckbox('Force nano chip');

  useEffect(() => {
    const highestMassIrrigation = getCharacterByHighestTalent(characters, CLASSES.Death_Bringer, 'MASS_IRRIGATION');
    setSelectedCharacter(highestMassIrrigation);
  }, [characters]);

  const hasNanoAndGordonius = () => {
    const hasChip = getPlayerLabChipBonus(selectedCharacter, account, 15);
    const hasGordonius = selectedCharacter?.starSigns?.find(({ starName }) => starName === 'Cropiovo_Minor');
    return !!hasChip && !!hasGordonius;
  };

  useEffect(() => {
    setEnableNano(hasNanoAndGordonius());
  }, [selectedCharacter]);

  const farmingExp = getSkillExpMulti('farming', selectedCharacter, characters, account);

  return <>
    <NextSeo
      title="Farming | Idleon Toolbox"
      description="Track your farming garden plots, crop progress, OG bonuses, and evolution upgrades in Legends of Idleon"
    />
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Character'} stackProps>
        <FormControl sx={{ width: 170, mt: 1 }}>
          <InputLabel id="farming-selected-character">Character</InputLabel>
          <Select
            size={'small'}
            labelId="farming-selected-character"
            id="farming-selected-character"
            value={selectedCharacter?.playerId ?? ''}
            label="Character"
            onChange={(e) => setSelectedCharacter(characters?.[e.target.value])}
          >
            {characters?.map((character) => <MenuItem key={'option' + character.name}
                                                      value={character?.playerId}>{character.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Stack direction={'row'} alignItems={'center'}>
          <NanoCheckboxEl disabled={hasNanoAndGordonius()}/>
          <Tooltip title={'Enabling nano chip assumes you have Cropiovo minor star sign *active*'}>
            <IconInfoCircleFilled size={18}/>
          </Tooltip>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Bean Trade'}>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <img style={{ objectFit: 'contain', width: 24 }} src={`${prefix}data/Quest80_x1.png`} alt=""/>
          <Typography>{notateNumber(Math.round(beanTrade))}</Typography>
          {stats?.magicBean ? <Breakdown data={stats.magicBean}>
            <Stack alignContent={'center'}>
              <IconInfoCircleFilled size={18}/>
            </Stack>
          </Breakdown> : null}
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Insta Grow'} value={instaGrow}/>
      <CardTitleAndValue title={'Ranks pts'} value={`${usedPoints}/${totalPoints}`}/>
      <CardTitleAndValue title={'Crop found'} value={state?.account?.farming?.cropsFound}/>
      {stats ? <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
        <CardWithBreakdown title={'Growth Speed'}
                           value={`${notateNumber(stats?.growthSpeed?.totalValue, 'MultiplierInfo')}x`}
                           breakdown={stats?.growthSpeed}/>
        <CardWithBreakdown title={'OG Chance Multi'}
                           value={`${notateNumber(stats?.ogChance?.totalValue, 'MultiplierInfo')}x`}
                           breakdown={stats?.ogChance}/>
        <CardWithBreakdown title={'Farming EXP'}
                           value={farmingExp?.formattedValue ? `${farmingExp.formattedValue}x` : ''}
                           breakdown={farmingExp?.breakdown}/>
        <CardWithBreakdown title={'Land Rank EXP'}
                           value={`${notateNumber(stats?.landRankExp?.totalValue, 'MultiplierInfo')}x`}
                           breakdown={stats?.landRankExp}/>
        <CardWithBreakdown title={'Crops on Vine'}
                           value={stats?.cropsOnVine?.totalValue}
                           breakdown={stats?.cropsOnVine}/>
        <CardWithBreakdown title={'Crop Value'}
                           value={`${notateNumber(stats?.cropValue?.totalValue, 'MultiplierInfo')}x`}
                           breakdown={stats?.cropValue}/>
      </Stack> : null}
    </Stack>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mt={1}>
      {Object.entries(cropDepot).map(([stat, { name, value }], index) => {
        const isMulti = stat === 'gamingEvo' || stat === 'cookingSpeed';
        const isBase = stat === 'critters';
        const val = notateNumber(value, 'Big');
        return <CardTitleAndValue key={stat} title={name}
                                  value={`${isBase ? '+' : ''}${val}${isBase ? '' : isMulti ? 'x' : '%'}`}
                                  icon={`etc/Pen_${index}.png`}/>
      })}
    </Stack>
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
      <Crop crop={crop} maxTimes={maxTimes}/>
      <Stickers/>
    </Tabber>
  </>
};

export default Farming;

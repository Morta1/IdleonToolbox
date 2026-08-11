import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import Tabber from '@components/common/Tabber';
import JadeEmporium from '@components/account/Worlds/World6/Sneaking/JadeEmporium';
import { getTabs, notateNumber } from '@utility/helpers';
import { Breakdown, CardTitleAndValue } from '@components/common/styles';
import Charms from '@components/account/Worlds/World6/Sneaking/Charms';
import PlayersInventory from '@components/account/Worlds/World6/Sneaking/PlayersInventory';
import Upgrades from '@components/account/Worlds/World6/Sneaking/Upgrades';
import { NextSeo } from 'next-seo';
import { Stack, Typography } from '@mui/material';
import Mastery from '@components/account/Worlds/World6/Sneaking/Mastery';
import Gemstones from '@components/account/Worlds/World6/Sneaking/Gemstones';
import { PAGES } from '@components/constants';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';

const Sneaking = () => {
  const { state } = useContext(AppContext);
  const {
    jadeEmporium,
    jadeCoins,
    players,
    inventory,
    dropList,
    pristineCharms,
    upgrades,
    doorsCurrentHp,
    gemStones,
    ninjaMasteryBonuses,
    ninjaMastery,
    itemsMaxLevel,
    dailyCharmRollCount,
    remainingPristineRolls,
    remainingSymbolRolls,
    pristineCharmChance
  } = state?.account?.sneaking || {};

  return <>
    <NextSeo
      title="Sneaking | Idleon Toolbox"
      description="Keep track of your ninja and jade upgrades and much more bonuses"
    />
    <Stack mb={3} direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Jade coins'} value={notateNumber(jadeCoins)} icon={`etc/jade_coin.png`}/>
      <CardTitleAndValue title={'Daily charm rolls used'} value={`${dailyCharmRollCount || 0}/120`}/>
      <CardTitleAndValue title={'Remaining pristine rolls'} stackProps>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <Typography component={'div'}>{remainingPristineRolls ?? 0}</Typography>
          <Tooltip title={`Current pristine chance: ${((pristineCharmChance || 0) * 100).toFixed(4)}%`}>
            <IconInfoCircleFilled size={18}/>
          </Tooltip>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Remaining symbol rolls'} value={remainingSymbolRolls ?? 0}/>
      <CardTitleAndValue title={'Items max level'} stackProps>
        <Stack>
          <Tooltip title={<Breakdown breakdown={itemsMaxLevel} skipNotation/>}>
            <IconInfoCircleFilled size={18}/>
          </Tooltip>
        </Stack>
      </CardTitleAndValue>
    </Stack>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 6'].categories, 'sneaking')}>
      <PlayersInventory players={players}
                        dropList={dropList}
                        inventory={inventory}
                        characters={state?.characters}
                        account={state?.account}
                        doorsCurrentHp={doorsCurrentHp}
      />
      <JadeEmporium upgrades={jadeEmporium}/>
      <Upgrades upgrades={upgrades}/>
      <Charms charms={pristineCharms}/>
      <Mastery masteryBonuses={ninjaMasteryBonuses} masteryLevel={ninjaMastery}/>
      <Gemstones gemStones={gemStones}/>
    </Tabber>
  </>
};

export default Sneaking;

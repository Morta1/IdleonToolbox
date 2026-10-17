import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import Tabber from '@components/common/Tabber';
import JadeEmporium from '@components/account/Worlds/World6/Sneaking/JadeEmporium';
import { getTabs, notateNumber } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import { CardWithBreakdown } from '@components/common/Breakdown/CardWithBreakdown';
import Charms from '@components/account/Worlds/World6/Sneaking/Charms';
import PlayersInventory from '@components/account/Worlds/World6/Sneaking/PlayersInventory';
import Upgrades from '@components/account/Worlds/World6/Sneaking/Upgrades';
import { NextSeo } from 'next-seo';
import { Stack, Typography } from '@mui/material';
import Mastery from '@components/account/Worlds/World6/Sneaking/Mastery';
import Gemstones from '@components/account/Worlds/World6/Sneaking/Gemstones';
import Detection from '@components/account/Worlds/World6/Sneaking/Detection';
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
    itemsMaxLevelBreakdown,
    dailyCharmRollCount,
    remainingPristineRolls,
    remainingSymbolRolls,
    pristineCharmChance,
    detection
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
      <CardWithBreakdown title={'Items max level'} breakdown={itemsMaxLevelBreakdown}/>
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
      <Upgrades upgrades={upgrades} omnijade={state?.account?.menagerie?.doublers?.omnijade}/>
      <Charms charms={pristineCharms}/>
      <Mastery masteryBonuses={ninjaMasteryBonuses} masteryLevel={ninjaMastery}/>
      <Gemstones gemStones={gemStones}/>
      <Detection detection={detection} characters={state?.characters} ninjaMastery={ninjaMastery}/>
    </Tabber>
  </>
};

export default Sneaking;

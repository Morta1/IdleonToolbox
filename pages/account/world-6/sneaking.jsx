import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import Tabber from '@components/common/Tabber';
import JadeEmporium from '@components/account/Worlds/World6/Sneaking/JadeEmporium';
import { formatNum, getTabs } from '@utility/helpers';
import Charms from '@components/account/Worlds/World6/Sneaking/Charms';
import PlayersInventory from '@components/account/Worlds/World6/Sneaking/PlayersInventory';
import Upgrades from '@components/account/Worlds/World6/Sneaking/Upgrades';
import { NextSeo } from 'next-seo';
import Mastery from '@components/account/Worlds/World6/Sneaking/Mastery';
import Gemstones from '@components/account/Worlds/World6/Sneaking/Gemstones';
import Detection from '@components/account/Worlds/World6/Sneaking/Detection';
import { PAGES } from '@components/constants';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';

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
    <PageSummary>
      {/* The save keeps the coins as text past 1e21 ("5.385403851749856e+79") */}
      <StatTile label={'Jade coins'} icon={'etc/jade_coin.png'} value={Number(jadeCoins ?? 0)} kind={'amount'}/>
      <StatTile label={'Daily charm rolls used'} value={`${formatNum(dailyCharmRollCount ?? 0)} / 120`}/>
      <StatTile label={'Remaining pristine rolls'} value={remainingPristineRolls ?? 0} kind={'amount'}
                info={`Current pristine chance: ${formatNum(pristineCharmChance, 'odds')}.`}/>
      <StatTile label={'Remaining symbol rolls'} value={remainingSymbolRolls ?? 0} kind={'amount'}/>
      <StatTile label={'Items max level'} breakdown={itemsMaxLevelBreakdown}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 6'].categories, 'sneaking')}>
      <PlayersInventory players={players}
                        dropList={dropList}
                        inventory={inventory}
                        characters={state?.characters}
                        account={state?.account}
                        doorsCurrentHp={doorsCurrentHp}
                        emptyAccount={state?.emptyAccount}
      />
      <JadeEmporium upgrades={jadeEmporium} jadeCoins={jadeCoins}/>
      <Upgrades upgrades={upgrades} omnijade={state?.account?.menagerie?.doublers?.omnijade}/>
      <Charms charms={pristineCharms}/>
      <Mastery masteryBonuses={ninjaMasteryBonuses} masteryLevel={ninjaMastery}/>
      <Gemstones gemStones={gemStones}/>
      <Detection detection={detection} characters={state?.characters} ninjaMastery={ninjaMastery}
                 emptyAccount={state?.emptyAccount}/>
    </Tabber>
  </>
};

export default Sneaking;

import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import Tabber from '@components/common/Tabber';
import JadeEmporium from '@components/account/Worlds/World6/sneaking/JadeEmporium';
import { cleanUnderscore, getTabs, notateNumber } from '@utility/helpers';
import { Breakdown, CardTitleAndValue } from '@components/common/styles';
import Charms from '@components/account/Worlds/World6/sneaking/Charms';
import PlayersInventory from '@components/account/Worlds/World6/sneaking/PlayersInventory';
import Upgrades from '@components/account/Worlds/World6/sneaking/Upgrades';
import { NextSeo } from 'next-seo';
import { Stack } from '@mui/material';
import Mastery from '@components/account/Worlds/World6/sneaking/Mastery';
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
    itemsMaxLevel
  } = state?.account?.sneaking || {};

  return <>
    <NextSeo
      title="Sneaking | Idleon Toolbox"
      description="Keep track of your ninja and jade upgrades and much more bonuses"
    />
    <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Jade coins'} value={notateNumber(jadeCoins)} icon={`etc/jade_coin.png`}/>
      <CardTitleAndValue title={'Items max level'} stackProps>
        <Stack>
          <Tooltip title={<Breakdown breakdown={itemsMaxLevel} skipNotation/>}>
            <IconInfoCircleFilled size={18}/>
          </Tooltip>
        </Stack>
      </CardTitleAndValue>
      {gemStones?.map(({ notatedBonus, rawName, name, description }, index) => <CardTitleAndValue key={'gemstone-' + index}
                                                                                     title={name}
                                                                                     value={`${index === 7
                                                                                       ? '+'
                                                                                       : ''}${notatedBonus}${index !== 7
                                                                                       ? '%'
                                                                                       : ''}`}
                                                                                     tooltipTitle={cleanUnderscore(description)}
                                                                                     imgStyle={{
                                                                                       width: 19,
                                                                                       height: 19
                                                                                     }}
                                                                                     icon={`data/${rawName}.png`}/>)}
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
    </Tabber>
  </>
};

export default Sneaking;

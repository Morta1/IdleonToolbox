import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';
import { getAmberIndex, getAmberDenominator } from '@parsers/world-7/spelunking';
import { CardTitleAndValue } from '@components/common/styles';
import { Stack, Typography } from '@mui/material';
import { commaNotation, notateNumber, prefix } from '@utility/helpers';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Worlds/World7/spelunking/Upgrades';
import Lore from '@components/account/Worlds/World7/spelunking/Lore';
import Elixirs from '@components/account/Worlds/World7/spelunking/Elixirs';
import UpgradeOptimizer from '@components/account/Worlds/World7/spelunking/UpgradeOptimizer';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';
import { Breakdown } from '@components/common/Breakdown/Breakdown';

const Spelunking = () => {
  const { state } = useContext(AppContext);
  const { upgrades,
    chapters,
    currentAmber,
    bestCaveLevels,
    amberGain,
    maxDailyPageReads,
    staminaRegenRate,
    discoveriesCount,
    maxDiscoveries,
    loreBosses,
    elixirs,
    ownedElixirs,
    ownedSlots,
    maxElixirDuplicates,
    power,
    totalGrandDiscoveries,
    overstimRate,
    charactersAtMaxStamina
  } = state?.account?.spelunking || {};
  const denominator = getAmberDenominator(state?.account);
  const amberFoundValue = currentAmber < 1e9 ? commaNotation(currentAmber / denominator) : notateNumber(currentAmber / denominator, "Big");

  return <>
    <NextSeo
      title="Spelunking | Idleon Toolbox"
      description="Keep track of your spelunking levels, upgrades and stats"
    />

    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Power'} >
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <img style={{ width: 27, height: 27 }} src={`${prefix}data/CaveShopUpg17.png`} alt="" />
          <Typography>{notateNumber(power.value, "Big")}</Typography>
          <Breakdown data={power.breakdown}>
            <Stack alignContent={'center'}>
              <IconInfoCircleFilled size={18} />
            </Stack>
          </Breakdown>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Amber Found'}
        value={amberFoundValue} icon={`data/CaveAmber${getAmberIndex(state?.account)}.png`} />
      <CardTitleAndValue title={'Amber Gain'}>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <img src={`${prefix}data/CaveAmber${getAmberIndex(state?.account)}.png`} alt="" />
          <Typography>{notateNumber(amberGain.value, "Big")}</Typography>
          <Breakdown data={amberGain.breakdown}>
            <Stack alignContent={'center'}>
              <IconInfoCircleFilled size={18} />
            </Stack>
          </Breakdown>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Daily Page Reads'} value={`${state?.account?.accountOptions?.[410]} / ${maxDailyPageReads}`} />
      <CardTitleAndValue title={'Stamina Regen Rate'} >
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <img style={{ width: 27, height: 27 }} src={`${prefix}data/CaveShopUpg4.png`} alt="" />
          <Typography>{notateNumber(staminaRegenRate.value, "MultiplierInfo")}</Typography>
          <Breakdown data={staminaRegenRate.breakdown}>
            <Stack alignContent={'center'}>
              <IconInfoCircleFilled size={18} />
            </Stack>
          </Breakdown>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Overstim Rate'}>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <img style={{ width: 27, height: 27 }} src={`${prefix}data/CaveShopUpg6.png`} alt="" />
          <Typography>{notateNumber(overstimRate, "Big")}</Typography>
          <Tooltip title={`${charactersAtMaxStamina ?? 0} character${(charactersAtMaxStamina ?? 0) === 1 ? '' : 's'} at max stamina contributing to overstim rate`}>
            <IconInfoCircleFilled size={18} />
          </Tooltip>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Discoveries'} value={`${discoveriesCount} / ${maxDiscoveries}`} />
      <CardTitleAndValue title={'Grand Discoveries'} value={`${totalGrandDiscoveries}`} />

    </Stack>

    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'spelunking')}>
      <Upgrades upgrades={upgrades} currentAmber={amberFoundValue} denominator={denominator} amberIndex={getAmberIndex(state?.account)} />
      <Lore
        chapters={chapters}
        loreBosses={loreBosses}
        bestCaveLevels={bestCaveLevels}
        account={state?.account}
      />
      <Elixirs elixirs={elixirs} ownedElixirs={ownedElixirs} ownedSlots={ownedSlots} maxElixirDuplicates={maxElixirDuplicates} />
      <UpgradeOptimizer character={state?.characters?.[0]} account={state?.account} />
    </Tabber>
  </>
}

export default Spelunking;
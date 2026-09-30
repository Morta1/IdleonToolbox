import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack } from '@mui/material';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { CardTitleAndValue } from '@components/common/styles';
import { commaNotation, getTabs, notateNumber } from '@utility/helpers';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import Obstructions from '@components/account/Worlds/World7/JellyOperator/Obstructions';
import Upgrades from '@components/account/Worlds/World7/JellyOperator/Upgrades';
import Cells from '@components/account/Worlds/World7/JellyOperator/Cells';
import Layout from '@components/account/Worlds/World7/JellyOperator/Layout';
import UpgradeOptimizer from '@components/account/Worlds/World7/JellyOperator/UpgradeOptimizer';

const JellyOperator = () => {
  const { state } = useContext(AppContext);
  const {
    obstructionsDefeated,
    operationsLeft,
    dailyOperations,
    bloodcells,
    bloodcellMulti,
    bloodcellMultiSources,
    slotsOwned,
    slotPurchasesLeft,
    unitsOwned,
    cellLevelTotal,
    obstructions,
    upgrades,
    cells,
    layout
  } = state?.account?.jellyOperator || {};

  const bloodcellBreakdown = {
    statName: 'Bloodcell Multi',
    totalValue: `${notateNumber(bloodcellMulti ?? 1, 'MultiplierInfo')}x`,
    categories: [{
      name: 'Multipliers',
      sources: bloodcellMultiSources?.map(({ name, value }) => ({
        name,
        value,
        formatted: `${notateNumber(value, 'MultiplierInfo')}x`
      })) ?? []
    }]
  };

  return <>
    <NextSeo
      title="Jelly Operator | Idleon Toolbox"
      description="Track your Jelly Operator obstructions, cell upgrades, bloodcells and bonuses in Legends of Idleon World 7 Research"
    />

    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <CardTitleAndValue title={'Obstructions removed'} value={`${obstructionsDefeated ?? 0} / ${obstructions?.filter(({ placeholder }) => !placeholder)?.length ?? 0}`}/>
      <CardTitleAndValue title={'Operations left'} value={`${operationsLeft ?? 0} (${dailyOperations ?? 2}/day)`}/>
      <CardTitleAndValue title={'Bloodcells'} icon={'etc/Bloodcell.png'} imgStyle={{ width: 22, height: 22 }}
                         value={notateNumber(Math.floor(bloodcells ?? 0), 'Big')}/>
      <CardTitleAndValue title={'Bloodcell Multi'}>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          {bloodcellBreakdown.totalValue}
          <Breakdown data={bloodcellBreakdown} skipNotation>
            <IconInfoCircleFilled size={18} style={{ cursor: 'pointer', display: 'block' }}/>
          </Breakdown>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Cell types unlocked'} value={`${unitsOwned ?? 0} / ${cells?.length ?? 0}`}/>
      <CardTitleAndValue title={'Total Cell LV'} value={commaNotation(cellLevelTotal ?? 0)}/>
      <CardTitleAndValue title={'Jelly Slots'}
                         value={slotPurchasesLeft > 0 ? `${slotsOwned ?? 0} (+${slotPurchasesLeft} to buy)` : `${slotsOwned ?? 0}`}/>
    </Stack>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'jellyOperator')}>
      <Layout layout={layout} cells={cells}/>
      <Obstructions obstructions={obstructions}/>
      <Upgrades upgrades={upgrades} characters={state?.characters}/>
      <UpgradeOptimizer account={state?.account} characters={state?.characters}/>
      <Cells cells={cells}/>
    </Tabber>
  </>;
};

export default JellyOperator;

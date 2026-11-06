import React from 'react';
import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum, getTabs } from '@utility/helpers';
import { bitsIcon, formatBits, formatGame } from '@utility/gameNotation';
import Tabber from '@components/common/Tabber';
import Imports from './Imports';
import Mutations from './Mutations';
import LogBook from '@components/account/Worlds/World5/Gaming/LogBook';
import Superbits from '@components/account/Worlds/World5/Gaming/Superbits';
import { PAGES } from '@components/constants';
import { getBitsMulti } from '@parsers/world-5/gaming';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import Palette from './Palette';

const General = ({ account, gaming, sectionFailed, characters, lastUpdated }) => {
  const {
    bits,
    availableSprouts,
    availableDrops,
    sproutsCapacity,
    fertilizerUpgrades,
    envelopes,
    superbitsUpgrades,
    logBook,
    ratTokens
  } = gaming ?? {};
  // The bit multi re-reads the gaming section, which a failed parse leaves empty
  const bitMulti = sectionFailed ? null : getBitsMulti(account, characters);
  const bitMultiText = `${formatGame(bitMulti?.value ?? 1, 'GamingStatType.SproutValueNonPlantMulti')}x`;

  return <>
    <PageSummary failed={sectionFailed}>
      {/* The notation divides by 1e18 per tier, so the balance carries its tier's sprite, as the costs do: at every size */}
      <StatTile label={'Bits'} value={<Stack component={'span'} direction={'row'} gap={0.5} alignItems={'center'}>
        {formatBits(bits ?? 0)}<GameIcon src={bitsIcon(bits)} size={16} alt={''}/>
      </Stack>}/>
      <StatTile label={'Bit multi'} value={bitMultiText} breakdownTitle={'Bit multi'}
                breakdown={bitMulti?.breakdown ? { ...bitMulti.breakdown, totalValue: bitMultiText } : undefined}/>
      <StatTile label={'Sprouts'} icon={'etc/Sprouts.png'}
                value={`${formatNum(availableSprouts ?? 0)} / ${formatNum(sproutsCapacity ?? 0)}`}/>
      <StatTile label={'Drops'} icon={'etc/GamingDrop.png'} value={availableDrops ?? 0} kind={'whole'}/>
      <StatTile label={'Envelopes'} icon={'etc/GamingEnvelope.png'} value={formatGame(Math.floor(envelopes ?? 0), 'Save.Envelopes', { whole: true })}/>
      <StatTile label={'Rat tokens'} icon={'data/GamingRatCrown.png'} value={formatGame(Math.floor(ratTokens ?? 0), 'Save.RatTokens', { whole: true })}/>
    </PageSummary>
    <CardGrid size={'m'} sx={{ mb: 3 }}>
      {fertilizerUpgrades?.map(({ name, level, description, cost }) => <ItemCard key={name} title={cleanUnderscore(name)}
                                                                                  level={{ value: level ?? 0 }}
                                                                                  footer={<ItemCard.Cost
                                                                                    icon={bitsIcon}
                                                                                    iconAlt={'Bits'} need={cost ?? 0}
                                                                                    have={bits ?? 0}
                                                                                    game={'GamingStatType.FertilizerUpgCosts'}/>}>
        {description ? <ItemCard.Desc text={description}/> : null}
      </ItemCard>)}
    </CardGrid>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 5'].categories, 'gaming')}>
      <Imports account={account} gaming={gaming} lastUpdated={lastUpdated}/>
      <Superbits superbits={superbitsUpgrades} bits={bits}/>
      <Mutations account={account} gaming={gaming} lastUpdated={lastUpdated}/>
      <LogBook logBook={logBook} crowns={gaming?.ratKing?.crownsCount ?? 0}/>
      <Palette account={account} gaming={gaming}/>
    </Tabber>
  </>;
};

export default General;

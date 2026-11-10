import React from 'react';
import { Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { DoubledPreview, DoublerTag } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';
import { UpgradeCostAhead } from '@components/common/LevelsAhead';

export const MINE_CURRENCY_ICON = 'etc/MineCurrency.png';

const Upgrades = ({ upgrades, mineCurrency, doublersOwned = 0, levelsAhead = 1 }) => <CardGrid size={'m'}>
  {upgrades?.map((upgrade, position) => {
    const { index, name, level, maxLevel, isMaxed, researchLvReq, isLocked, cost, costExponent, description, doubled, doublerEligible, doubledDescription } = upgrade ?? {};
    return <ItemCard key={index ?? position} icon={`data/MineUpg${index}.png`} title={cleanUnderscore(name)}
                     level={{ value: level ?? 0, max: maxLevel ?? null }} status={isMaxed ? 'maxed' : undefined}
                     dimmed={isLocked}
                     aside={<DoublerTag kind={'minehead'} doubled={doubled} eligible={doublerEligible} owned={doublersOwned}/>}
                     footer={<>
                       <ItemCard.Cost icon={MINE_CURRENCY_ICON} iconAlt={'Mine currency'} need={cost ?? 0} have={mineCurrency}
                                      game={'Minehead.UpgCost'}/>
                       {/* 999 marks an endless upgrade */}
                       <UpgradeCostAhead cost={cost} costExponent={costExponent} level={level ?? 0}
                                         maxLevel={maxLevel < 999 ? maxLevel : Infinity} levelsAhead={levelsAhead}
                                         owned={mineCurrency} game={'Minehead.UpgCost'}/>
                       {isLocked
                         ? <Typography variant={'body2'} color={'text.secondary'}>
                           {`Needs Research LV ${formatNum(researchLvReq ?? 0)}`}
                         </Typography>
                         : null}
                     </>}>
      {description ? <ItemCard.Desc text={description}/> : null}
      <DoubledPreview description={description} doubledDescription={doubledDescription} owned={doublersOwned}/>
    </ItemCard>;
  })}
</CardGrid>;

export default Upgrades;

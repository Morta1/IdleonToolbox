import React from 'react';
import { Box, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { DoubledPreview, DoublerTag } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';
import { UpgradeCostAhead } from '@components/common/LevelsAhead';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

export const MINE_CURRENCY_ICON = 'etc/MineCurrency.png';

const UPGRADES_TOOLBAR = { search: '', hideMaxed: false };

const Upgrades = ({ upgrades, mineCurrency, doublersOwned = 0, levelsAhead = 1 }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('minehead-upgrades', UPGRADES_TOOLBAR);
  const list = upgrades ?? [];
  const search = (toolbar?.search ?? '').trim().toLowerCase();
  const shown = list.filter((upgrade) => (!search
      || cleanUnderscore(`${upgrade?.name ?? ''} ${upgrade?.description ?? ''}`).toLowerCase().includes(search))
    && !(toolbar?.hideMaxed && upgrade?.isMaxed));
  return <Box>
    <Toolbar state={toolbar} defaults={UPGRADES_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={list.length} shown={shown.length} noun={'upgrades'}>
      <Toolbar.Search placeholder={'Search upgrades'}/>
      <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
    </Toolbar>
    <CardGrid size={'m'}>
  {shown.map((upgrade, position) => {
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
    </CardGrid>
  </Box>;
};

export default Upgrades;

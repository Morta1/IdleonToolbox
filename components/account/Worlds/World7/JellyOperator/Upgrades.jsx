import React from 'react';
import { Box, Typography } from '@mui/material';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { DoubledPreview, DoublerTag } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';
import { UpgradeCostAhead } from '@components/common/LevelsAhead';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const UPGRADES_TOOLBAR = { search: '', hideMaxed: false };
const isMaxedUpgrade = ({ level, maxLevel }) => maxLevel !== null && level >= maxLevel;

const Upgrades = ({ upgrades, characters, bloodcells, doublersOwned = 0, levelsAhead = 1 }) => {
  const maxResearchLevel = Math.max(0, ...(characters || []).map((c) => c?.skillsInfo?.research?.level ?? 0));
  // A save can keep a large amount as text
  const owned = Number(bloodcells ?? 0);
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('jelly-upgrades', UPGRADES_TOOLBAR);
  const list = upgrades ?? [];
  const search = (toolbar?.search ?? '').trim().toLowerCase();
  const shown = list.filter((upgrade) => (!search || `${upgrade?.name ?? ''} ${upgrade?.description ?? ''}`.toLowerCase().includes(search))
    && !(toolbar?.hideMaxed && isMaxedUpgrade(upgrade)));

  return <Box>
    <Toolbar state={toolbar} defaults={UPGRADES_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={list.length} shown={shown.length} noun={'upgrades'}>
      <Toolbar.Search placeholder={'Search upgrades'}/>
      <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
    </Toolbar>
    <CardGrid size={'m'}>
    {shown.map(({ id, name, description, level, maxLevel, cost, costExponent, lvReq, unlocked, doubled, doublerEligible, doubledDescription }) => {
      const isMaxed = maxLevel !== null && level >= maxLevel;
      const meetsLvReq = maxResearchLevel >= lvReq;
      // An endless upgrade reads "Lv N"; the cost "owned / cost" with its "need X more", as the game draws it
      return <ItemCard key={id} icon={`data/JellyUpg${id}.png`} title={name}
                       level={{ value: level ?? 0, max: maxLevel ?? null }} status={isMaxed ? 'maxed' : undefined}
                       dimmed={!(meetsLvReq && unlocked)}
                       aside={<DoublerTag kind={'jellyOperator'} doubled={doubled} eligible={doublerEligible} owned={doublersOwned}/>}
                       footer={<>
                         {/* The first upgrade costs nothing: "0 / 0" read like missing data */}
                         {cost > 0 || level > 0
                           ? <ItemCard.Cost icon={'etc/Bloodcell.png'} iconAlt={'Bloodcells'} need={cost} have={owned}
                                            game={'JellyOperation.UpgCost'}/>
                           : <Typography variant={'body2'} color={'text.success'}>Free</Typography>}
                         <UpgradeCostAhead cost={cost} costExponent={costExponent} level={level ?? 0} maxLevel={maxLevel ?? Infinity}
                                           levelsAhead={levelsAhead} owned={owned} game={'JellyOperation.UpgCost'}/>
                         {meetsLvReq ? null : <Typography variant={'body2'} color={'text.secondary'}>Needs Research Lv {lvReq}</Typography>}
                         {unlocked ? null : <Typography variant={'body2'} color={'text.secondary'}>Needs the previous upgrade</Typography>}
                       </>}>
        {description ? <ItemCard.Desc text={description.replace(/\n/g, '@')}/> : null}
        <DoubledPreview description={description} doubledDescription={doubledDescription} owned={doublersOwned}/>
      </ItemCard>;
    })}
    </CardGrid>
  </Box>;
};

export default Upgrades;

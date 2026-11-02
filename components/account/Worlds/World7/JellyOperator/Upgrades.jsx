import React from 'react';
import { Typography } from '@mui/material';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { DoubledPreview, DoublerTag } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

const Upgrades = ({ upgrades, characters, bloodcells, doublersOwned = 0 }) => {
  const maxResearchLevel = Math.max(0, ...(characters || []).map((c) => c?.skillsInfo?.research?.level ?? 0));
  // A save can keep a large amount as text
  const owned = Number(bloodcells ?? 0);

  return <CardGrid size={'m'}>
    {upgrades?.map(({ id, name, description, level, maxLevel, cost, lvReq, unlocked, doubled, doublerEligible, doubledDescription }) => {
      const isMaxed = maxLevel !== null && level >= maxLevel;
      const meetsLvReq = maxResearchLevel >= lvReq;
      // An endless upgrade reads "Lv N"; the cost "owned / cost" with its "need X more", as the game draws it
      return <ItemCard key={id} icon={`data/JellyUpg${id}.png`} title={name}
                       level={{ value: level ?? 0, max: maxLevel ?? null }} status={isMaxed ? 'maxed' : undefined}
                       dimmed={!(meetsLvReq && unlocked)}
                       aside={<DoublerTag kind={'jellyOperator'} doubled={doubled} eligible={doublerEligible} owned={doublersOwned}/>}
                       footer={<>
                         <ItemCard.Cost icon={'etc/Bloodcell.png'} iconAlt={'Bloodcells'} need={cost} have={owned}
                                        game={'JellyOperation.UpgCost'}/>
                         {meetsLvReq ? null : <Typography variant={'body2'} color={'text.secondary'}>Needs Research Lv {lvReq}</Typography>}
                         {unlocked ? null : <Typography variant={'body2'} color={'text.secondary'}>Needs the previous upgrade</Typography>}
                       </>}>
        {description ? <ItemCard.Desc text={description.replace(/\n/g, '@')}/> : null}
        <DoubledPreview description={description} doubledDescription={doubledDescription} owned={doublersOwned}/>
      </ItemCard>;
    })}
  </CardGrid>;
};

export default Upgrades;

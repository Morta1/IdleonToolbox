import React from 'react';
import { Stack, Typography } from '@mui/material';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { DoubledPreview, DoublerTag } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

const Upgrades = ({ upgrades, totalUpgradeLevels, characters, bucks, doublersOwned = 0 }) => {
  const maxResearchLevel = Math.max(0, ...(characters || []).map(c => c?.skillsInfo?.research?.level ?? 0));
  // A save can keep a large amount as text
  const owned = Number(bucks ?? 0);

  return (
    <Stack gap={3}>
      {/* Decision 3: the tab's total stays at its top */}
      <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
        <StatTile label={'Total upgrade LV'} value={totalUpgradeLevels ?? 0} kind={'amount'}/>
      </Stack>
      <CardGrid size={'m'}>
        {upgrades?.map((upgrade, i) => {
          const { name, description, level, maxLevel, cost, lvReq, visualIndex, doubled, doublerEligible, doubledDescription } = upgrade;
          const isMaxed = maxLevel !== Infinity && level >= maxLevel;
          const meetsLvReq = maxResearchLevel >= lvReq;
          // The cost as the game draws it, "owned / cost" in TinyE; a maxed card drops it, a locked one says why
          return <ItemCard key={visualIndex ?? i} icon={`data/SushiUpg${upgrade.upgradeIndex}.png`} title={name}
                           level={{ value: level ?? 0, max: Number.isFinite(maxLevel) ? maxLevel : null }}
                           status={isMaxed ? 'maxed' : undefined} dimmed={!meetsLvReq}
                           aside={<DoublerTag kind={'sushi'} doubled={doubled} eligible={doublerEligible} owned={doublersOwned}/>}
                           footer={<>
                             <ItemCard.Cost icon={'etc/Bucks.png'} iconAlt={'Bucks'} need={cost} have={owned} game={'SushiStuff.UpgCost'}/>
                             {meetsLvReq ? null : <Typography variant={'body2'} color={'text.secondary'}>Needs Research Lv {lvReq}</Typography>}
                           </>}>
            {description ? <ItemCard.Desc text={description}/> : null}
            <DoubledPreview description={description} doubledDescription={doubledDescription} owned={doublersOwned}/>
          </ItemCard>;
        })}
      </CardGrid>
    </Stack>
  );
};

export default Upgrades;

import React from 'react';
import { Stack } from '@mui/material';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

const Bonuses = ({ rogBonuses, uniqueSushi, knowledge, totalKnowledgeLevels, totalPerfectos }) => (
  <Stack gap={3}>
    {/* Decision 3: the tab's totals stay at its top */}
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      <StatTile label={'Total knowledge LV'} value={totalKnowledgeLevels ?? 0} kind={'amount'}/>
      <StatTile label={'Perfectos'} value={totalPerfectos ?? 0} kind={'amount'}/>
      <StatTile label={'Unlocked'} value={`${formatNum(uniqueSushi ?? 0)} / ${formatNum(rogBonuses?.length ?? 0)}`}/>
    </Stack>
    <CardGrid size={'m'}>
      {rogBonuses?.map(({ index, name, description, unlocked }) => {
        const kn = knowledge?.[index];
        const xpPct = kn?.xpReq > 0 ? Math.min(100, (kn.xp / kn.xpReq) * 100) : 0;
        return <ItemCard key={index} icon={`data/Sushi${index}.png`} title={name || `Sushi ${index}`} dimmed={!unlocked}
                         aside={kn?.perfecto ? <GameIcon src={'etc/SushiPerfectoStar.png'} size={24} alt={'Perfecto'}/> : null}>
          <ItemCard.Desc text={description?.replace(/\n/g, '@')}/>
          {kn ? <ItemCard.Section label={'Knowledge'}>
            {/* The game switches the "xp/req" line on the requirement (SushiStuff.KnowledgeXP_req), both sides */}
            <ItemCard.Progress label={`Lv ${formatNum(kn.level ?? 0)}`} percent={xpPct}
                               value={formatGame(kn.xp ?? 0, 'SushiStuff.KnowledgeXP_req', kn.xpReq ?? 0)}
                               max={formatGame(kn.xpReq ?? 0, 'SushiStuff.KnowledgeXP_req')}/>
            {kn.bonusDescription ? <ItemCard.Desc text={kn.bonusDescription}/> : null}
            {/* Decision 8: a chance past 100% is a certain Perfecto */}
            {!kn.perfecto && kn.perfectOdds != null
              ? <ItemCard.Facts rows={[['Perfecto chance', formatNum(Math.min(100, kn.perfectOdds * 100), 'pct')]]}/> : null}
          </ItemCard.Section> : null}
        </ItemCard>;
      })}
    </CardGrid>
  </Stack>
);

export default Bonuses;

import React from 'react';
import { Box, Stack } from '@mui/material';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const BONUSES_TOOLBAR = { details: false };

const Bonuses = ({ rogBonuses, uniqueSushi, knowledge, totalKnowledgeLevels, totalPerfectos }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('sushi-bonuses', BONUSES_TOOLBAR);
  return <Stack gap={3}>
    {/* Decision 3: the tab's totals stay at its top */}
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      <StatTile label={'Total knowledge LV'} value={totalKnowledgeLevels ?? 0} kind={'amount'}/>
      <StatTile label={'Perfectos'} value={totalPerfectos ?? 0} kind={'amount'}/>
      <StatTile label={'Unlocked'} value={`${formatNum(uniqueSushi ?? 0)} / ${formatNum(rogBonuses?.length ?? 0)}`}/>
    </Stack>
    <Box>
      <Toolbar state={toolbar} defaults={BONUSES_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
               total={rogBonuses?.length ?? 0} shown={rogBonuses?.length ?? 0} noun={'bonuses'}>
        <Toolbar.Filter name={'details'} label={'Details'} display/>
      </Toolbar>
      {/* A card keeps its bonus and its knowledge level. What the knowledge gives (the Sushi Bonuses tab adds those up)
          and the Perfecto chance show with the Details pill. */}
      <CardGrid size={'m'} details={toolbar?.details}>
        {rogBonuses?.map(({ index, name, description, unlocked }) => {
          const kn = knowledge?.[index];
          const xpPct = kn?.xpReq > 0 ? Math.min(100, (kn.xp / kn.xpReq) * 100) : 0;
          // Decision 8: a chance past 100% is a certain Perfecto
          const perfectoChance = !kn?.perfecto && kn?.perfectOdds != null ? Math.min(100, kn.perfectOdds * 100) : null;
          return <ItemCard key={index} icon={`data/Sushi${index}.png`} title={name || `Sushi ${index}`} dimmed={!unlocked}
                           aside={kn?.perfecto ? <GameIcon src={'etc/SushiPerfectoStar.png'} size={24} alt={'Perfecto'}/> : null}
                           more={kn?.bonusDescription || perfectoChance !== null ? <>
                             {kn?.bonusDescription ? <ItemCard.Desc text={kn.bonusDescription}/> : null}
                             {perfectoChance !== null ? <ItemCard.Facts rows={[['Perfecto chance', formatNum(perfectoChance, 'pct')]]}/> : null}
                           </> : null}>
            <ItemCard.Desc text={description?.replace(/\n/g, '@')}/>
            {/* The game switches the "xp/req" line on the requirement (SushiStuff.KnowledgeXP_req), both sides */}
            {kn ? <ItemCard.Progress label={`Knowledge Lv ${formatNum(kn.level ?? 0)}`} percent={xpPct}
                                     value={formatGame(kn.xp ?? 0, 'SushiStuff.KnowledgeXP_req', { ruleValue: kn.xpReq ?? 0, whole: true })}
                                     max={formatGame(kn.xpReq ?? 0, 'SushiStuff.KnowledgeXP_req', { whole: true })}/> : null}
          </ItemCard>;
        })}
      </CardGrid>
    </Box>
  </Stack>;
};

export default Bonuses;

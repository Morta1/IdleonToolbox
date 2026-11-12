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
  const waitingLevels = (knowledge ?? []).reduce((sum, kn) => sum + (kn?.pendingLevels ?? 0), 0);
  return <Stack gap={3}>
    {/* Decision 3: the tab's totals stay at its top */}
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      <StatTile label={'Total knowledge LV'} value={totalKnowledgeLevels ?? 0} kind={'amount'}
                sub={waitingLevels > 0 ? `+${formatNum(waitingLevels)} waiting` : undefined}
                info={waitingLevels > 0 ? 'Knowledge EXP turns into levels only while the Knowledge tab in the game is open. Open it to collect them.' : undefined}/>
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
          // Banked EXP turns into levels only while the game's Knowledge tab is open: the card shows where it lands
          const waiting = kn?.pendingLevels > 0;
          const shownLevel = waiting ? kn.openLevel : kn?.level;
          const shownXp = waiting ? kn.openXp : kn?.xp;
          const shownReq = waiting ? kn.openXpReq : kn?.xpReq;
          const xpPct = shownReq > 0 ? Math.min(100, (shownXp / shownReq) * 100) : 0;
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
            {kn ? <ItemCard.Progress label={`Knowledge Lv ${formatNum(shownLevel ?? 0)}${waiting ? ` (+${formatNum(kn.pendingLevels)} waiting)` : ''}`}
                                     percent={xpPct}
                                     value={formatGame(shownXp ?? 0, 'SushiStuff.KnowledgeXP_req', { ruleValue: shownReq ?? 0, whole: true })}
                                     max={formatGame(shownReq ?? 0, 'SushiStuff.KnowledgeXP_req', { whole: true })}/> : null}
          </ItemCard>;
        })}
      </CardGrid>
    </Box>
  </Stack>;
};

export default Bonuses;

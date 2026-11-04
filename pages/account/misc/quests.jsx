import React, { useContext } from 'react';
import { Box } from '@mui/material';
import WorldQuest, { shapeQuests } from 'components/account/Misc/WorldQuest';
import { formatNum } from 'utility/helpers';
import { AppContext } from 'components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import Toolbar from '@components/common/Toolbar';
import InfoButton from '@components/common/InfoButton';
import useToolbarState from '@hooks/useToolbarState';
import { MissingData, isSectionFailed } from '@components/common/styles';

const WORLDS = ['Blunder_Hills', 'Yum_Yum_Desert', 'Frostbite_Tundra', 'Hyperion_Nebula', 'Smolderin\'_Plateau',
  'Spirited_Valley', 'Shimmerfin_Deep'];

const QUESTS_TOOLBAR = { show: '0', hideCompleted: false, doneByAny: false, missable: false };

const Quests = () => {
  const { state } = useContext(AppContext);
  const questsFailed = isSectionFailed(state?.account, 'quests');
  const totalFailed = isSectionFailed(state?.account, 'totalQuestsCompleted');
  const [view, setView, resetView] = useToolbarState('quests', QUESTS_TOOLBAR);
  const characters = state?.characters ?? [];
  const picked = Number(view.show);
  // No character (a guest): nobody to finish a quest, so nothing is done and nothing is at risk
  const selected = !characters.length ? [] : view.show === 'all' ? characters.map((_, index) => index)
    : [Number.isInteger(picked) && picked >= 0 && picked < characters.length ? picked : 0];
  const worlds = questsFailed ? {} : shapeQuests(state?.account?.quests ?? {}, selected, view.doneByAny,
    new Set(state?.account?.looty?.greenStacks ?? []));
  const shownOf = (world) => (worlds?.[world] ?? []).filter((npc) => (!view.hideCompleted || npc?.status !== 1)
    && (!view.missable || npc?.missablePending));
  const npcCount = WORLDS.reduce((sum, world) => sum + (worlds?.[world]?.length ?? 0), 0);
  const shownCount = WORLDS.reduce((sum, world) => sum + shownOf(world).length, 0);

  return (
    <>
      <NextSeo
        title="Quests | Idleon Toolbox"
        description="Track quest completion progress across all NPCs and characters in Legends of Idleon"
      />
      {questsFailed ? <MissingData name={'Quests'} failed/> : null}
      <PageSummary>
        <StatTile label={'Unique quests completed'}
                  value={totalFailed ? '-' : formatNum(state?.account?.totalQuestsCompleted ?? 0)}
                  info={'Every quest counts once, however many characters finished it. The QUEST KAPOW! and QUEST CHUNGUS star talents scale with it.'}/>
      </PageSummary>
      {questsFailed ? null : <Box>
        <Toolbar state={view} defaults={QUESTS_TOOLBAR} onChange={setView} onReset={resetView}
                 total={npcCount} shown={shownCount} noun={'NPCs'}>
          <Toolbar.Lead>
            <InfoButton label={'these filters'}>
              {'Done by any counts a quest once any picked character finished it, so All characters with it finds the quests no one has done. Missable greenstacks keeps the NPCs with a quest whose item drops stop once it is finished and whose item is not greenstacked yet: keep one character on that quest until it is.'}
            </InfoButton>
          </Toolbar.Lead>
          {characters.length ? <Toolbar.Show options={[['all', 'All characters'],
            ...characters.map((character, index) => [`${index}`, character?.name])]}/> : null}
          <Toolbar.Filter name={'hideCompleted'} label={'Hide completed'}/>
          <Toolbar.Filter name={'doneByAny'} label={'Done by any'}/>
          <Toolbar.Filter name={'missable'} label={'Missable greenstacks'}/>
        </Toolbar>
        <CardGrid size={'l'} sx={{ alignItems: 'start' }}>
          {WORLDS.map((world) => <WorldQuest key={world} worldName={world} npcs={shownOf(world)} characters={characters}/>)}
        </CardGrid>
      </Box>}
    </>
  );
};

export default Quests;

import React, { useContext, useDeferredValue } from 'react';
import { Box } from '@mui/material';
import WorldQuest, { rewardName, shapeQuests } from 'components/account/Misc/WorldQuest';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import { CharacterSelect } from '@components/characters/CharactersList';
import { AppContext } from 'components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import Toolbar from '@components/common/Toolbar';
import InfoButton from '@components/common/InfoButton';
import useToolbarState from '@hooks/useToolbarState';
import { MissingData, isParseFailed, isSectionFailed, joinNames } from '@components/common/styles';

const WORLDS = ['Blunder_Hills', 'Yum_Yum_Desert', 'Frostbite_Tundra', 'Hyperion_Nebula', 'Smolderin\'_Plateau',
  'Spirited_Valley', 'Shimmerfin_Deep'];

// show: the picked characters, "all" or their indices joined by commas (one index before the switcher took several)
const QUESTS_TOOLBAR = { search: '', show: '0', hideCompleted: false, doneByAny: false, missable: false };
const pickedOf = (show, count) => {
  if (show === 'all') return [...Array(count).keys()];
  const picked = [...new Set(`${show}`.split(',').map(Number))].filter((index) => Number.isInteger(index) && index >= 0 && index < count);
  return picked.length ? picked : [0];
};

// The sections Quests reads, by the name its one note gives them; a whole-parse failure names the page
const SECTIONS = [['quests', 'Quests'], ['totalQuestsCompleted', 'Unique quests completed'], ['looty', 'the Slab']];

const Quests = () => {
  const { state } = useContext(AppContext);
  const parseFailed = isParseFailed(state?.account);
  const questsFailed = isSectionFailed(state?.account, 'quests');
  const totalFailed = isSectionFailed(state?.account, 'totalQuestsCompleted');
  // A failed looty section has no greenstack list: no drop is called missable and the filter goes
  const lootyFailed = isSectionFailed(state?.account, 'looty');
  const failedNames = state?.account?.failedSections?.includes('*') ? 'Quests'
    : joinNames(SECTIONS.filter(([key]) => state?.account?.failedSections?.includes(key)).map(([, name]) => name));
  const [liveView, setView, resetView] = useToolbarState('quests', QUESTS_TOOLBAR);
  // The toolbar answers at once; the 76 NPCs follow a beat later instead of holding up the click or the typing
  const view = useDeferredValue(liveView);
  const characters = state?.characters ?? [];
  // No character (a guest): nobody to finish a quest, so nothing is done and nothing is at risk
  const selected = !characters.length || questsFailed ? [] : pickedOf(view.show, characters.length);
  const pick = (indices) => setView({ show: indices.length === characters.length ? 'all' : indices.join(',') });
  const worlds = parseFailed ? {} : shapeQuests(state?.account?.quests ?? {}, selected, view.doneByAny,
    lootyFailed ? null : new Set(state?.account?.looty?.greenStacks ?? []));
  // Search matches the NPC, or any of its quests by name or reward
  const search = (view?.search ?? '').trim().toLowerCase();
  const questText = (quest) => [quest?.QuestName ?? quest?.Name, ...(quest?.rewards ?? []).map(rewardName)];
  const matches = (npc) => !search || cleanUnderscore([npc?.name, ...[...(npc?.npcQuests ?? []), ...(npc?.laterQuests ?? [])].flatMap(questText)]
    .filter(Boolean).join(' ')).toLowerCase().includes(search);
  const shownOf = (world) => (worlds?.[world] ?? []).filter((npc) => (!view.hideCompleted || npc?.status !== 1)
    && (!view.missable || lootyFailed || npc?.missablePending) && matches(npc));
  const npcCount = WORLDS.reduce((sum, world) => sum + (worlds?.[world]?.length ?? 0), 0);
  const shownCount = WORLDS.reduce((sum, world) => sum + shownOf(world).length, 0);

  return (
    <>
      <NextSeo
        title="Quests | Idleon Toolbox"
        description="Track quest completion progress across all NPCs and characters in Legends of Idleon"
      />
      {failedNames ? <MissingData name={failedNames} failed atZero={questsFailed && !parseFailed}/> : null}
      <PageSummary>
        <StatTile label={'Unique quests completed'}
                  value={totalFailed ? '-' : formatNum(state?.account?.totalQuestsCompleted ?? 0)}
                  info={'Every quest counts once, however many characters finished it. The QUEST KAPOW! and QUEST CHUNGUS star talents scale with it.'}/>
      </PageSummary>
      {parseFailed ? null : <Box>
        <Toolbar state={liveView} defaults={QUESTS_TOOLBAR} onChange={setView} onReset={resetView}
                 total={npcCount} shown={shownCount} noun={'NPCs'}>
          {/* The Characters page's switcher, on this page's own pick (#91) */}
          {/* The character comes first: the search narrows that character's quests */}
          {selected.length ? <Toolbar.Lead beforeSearch>
            <CharacterSelect characters={characters} selected={selected} onChange={pick}/>
          </Toolbar.Lead> : null}
          <Toolbar.Lead>
            <InfoButton label={'these filters'}>
              {'Done by any counts a quest once any picked character finished it, so All characters with it finds the quests no one has done. Missable greenstacks keeps the NPCs with a quest whose item drops stop once it is finished and whose item is not greenstacked yet: keep one character on that quest until it is.'}
            </InfoButton>
          </Toolbar.Lead>
          <Toolbar.Search placeholder={'Search NPCs, quests or rewards'}/>
          <Toolbar.Filter name={'hideCompleted'} label={'Hide completed'}/>
          <Toolbar.Filter name={'doneByAny'} label={'Done by any'}/>
          {lootyFailed ? null : <Toolbar.Filter name={'missable'} label={'Missable greenstacks'}/>}
        </Toolbar>
        <CardGrid size={'l'} sx={{ alignItems: 'start' }}>
          {WORLDS.map((world) => <WorldQuest key={world} worldName={world} npcs={shownOf(world)} characters={characters}
                                              showCharacters={selected.length > 1}/>)}
        </CardGrid>
      </Box>}
    </>
  );
};

export default Quests;

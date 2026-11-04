import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import CoinDisplay from 'components/common/CoinDisplay';
import { cleanUnderscore, formatNum, getCoinsArray } from 'utility/helpers';
import { npcSprite } from '@utility/spriteImages';
import { items } from '@website-data';
import Panel from '@components/common/cards/Panel';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import StatusText from '@components/common/StatusText';

// Two npcs' lines end before their lists do (N.js): Picnic Stowaway's quests after Live-Action Entertainment are his
// "repeatable Daily Questline" that starts over every 24 hours, and Scripticus' Can't somebody else do it? is a side
// quest one dialogue branch offers. The named quest is the npc's last; the ones after it sit under their own label,
// outside the npc's count and state.
const FINAL_QUEST = {
  Picnic_Stowaway: { name: 'Live-Action_Entertainment', after: 'Daily questline' },
  Scripticus: { name: 'Champion_of_the_Grasslands', after: 'Side quest' }
};

// A quest's state for the picked characters: done (by all of them, or any with Done by any), in progress (someone
// finished it or stands on it), or nothing. No picked character (a guest): nothing is done and nothing is at risk.
// A pure function of the parsed quests, so the parsed account is never changed.
export const shapeQuests = (quests, selected, doneByAny, greenStacks) => {
  const picked = new Set(selected);
  const ofPicked = (list) => (list ?? []).filter(({ charIndex }) => picked.has(charIndex));
  const isDone = (completed) => selected.length > 0
    && (doneByAny ? completed.length > 0 : completed.length === selected.length);
  return Object.fromEntries(Object.entries(quests ?? {}).map(([world, npcs]) => [world, (npcs ?? []).map((npc) => {
    const npcQuests = (npc?.npcQuests ?? []).map((quest) => {
      const completed = ofPicked(quest?.completed);
      const progress = ofPicked(quest?.progress);
      // A quest-only drop is still at risk while it isn't greenstacked and a picked character can still finish the
      // quest (and lose the drop)
      // No greenstack list (a failed looty section): which drops are stacked isn't known, so nothing is at risk
      const missableDrops = (quest?.missableDrops ?? []).map((rawName) => ({ rawName, greenStacked: greenStacks?.has(rawName) }));
      const done = isDone(completed);
      return {
        ...quest,
        completed,
        progress,
        missableDrops,
        done,
        inProgress: !done && (completed.length > 0 || progress.some(({ status }) => status === 0)),
        missablePending: !!greenStacks && selected.length > 0 && completed.length < selected.length
          && missableDrops.some(({ greenStacked }) => !greenStacked)
      };
    });
    const final = FINAL_QUEST[npc?.name];
    const finalAt = final ? npcQuests.findIndex(({ Name }) => Name === final.name) : -1;
    // The quests the npc's count and state both read: up to its last one (the named quest, or the list's end)
    const counted = finalAt === -1 ? npcQuests : npcQuests.slice(0, finalAt + 1);
    const completedQuests = counted.reduce((sum, { completed, done }) => sum + (done ? 1 : completed.length > 0 ? 0.5 : 0), 0);
    const inProgressQuests = counted.filter(({ progress }) => progress.some(({ status }) => status !== -1)).length;
    // Every picked character finished the final quest, so there's nothing left to do here even if an earlier quest
    // went unfinished: some are unreachable once you've moved past them, and would hold the npc at in progress forever
    const charactersAtTheEnd = (npcQuests.at(-1)?.progress ?? []).filter(({ status }) => status === 1).map(({ charIndex }) => charIndex);
    const everyoneFinished = !doneByAny && selected.length > 0 && selected.every((index) => charactersAtTheEnd.includes(index));
    // A finished last quest finishes the npc: the quests left unfinished before it are unreachable, so they leave the
    // count too, and "N / N done" always sits beside Done
    const finished = finalAt === -1 ? everyoneFinished : !!counted.at(-1)?.done;
    const done = counted.filter((quest) => quest.done).length;
    return {
      ...npc,
      npcQuests: counted,
      laterQuests: npcQuests.slice(counted.length),
      laterLabel: final?.after,
      done,
      total: finished ? done : counted.length,
      status: finished ? 1 : completedQuests === 0 ? (inProgressQuests > 0 ? 0 : -1)
        : completedQuests === counted.length ? 1 : 0,
      missablePending: npcQuests.some(({ missablePending }) => missablePending)
    };
  })]));
};

const EXP_TYPES = ['Class', 'Mining', 'Smithing', 'Choppin', 'Fishing', 'Alchemy', 'Catching', 'Trapping', 'Construction', 'Worship'];

const spriteLabel = (src, text) => <Stack direction={'row'} alignItems={'center'} gap={1} component={'span'}>
  <GameIcon src={src} size={24} alt={''}/>
  {text}
</Stack>;

const rewardRow = ({ name, rawName = '', amount }) => {
  if (rawName === 'COIN') return [spriteLabel('data/Coins1.png', 'Coins'), <CoinDisplay key={'coins'} dense money={getCoinsArray(amount)}/>];
  if (rawName.includes('Experience')) {
    return [spriteLabel('data/XP.png', `${EXP_TYPES[parseInt(rawName.replace('Experience', ''))] ?? ''} EXP`.trim()), formatNum(amount ?? 0)];
  }
  const sprite = rawName.includes('Talent') ? 'TalentBook1' : rawName.includes('Recipes') ? `SmithingRecipes${rawName.at(-1)}` : rawName;
  return [spriteLabel(`data/${sprite}.png`, cleanUnderscore(name || rawName)), formatNum(amount ?? 0)];
};

const NoteGroup = ({ label, rows }) => <Stack gap={0.5}>
  <Typography variant={'groupLabel'} color={'text.secondary'}>{label}</Typography>
  <ItemCard.Facts rows={rows}/>
</Stack>;

// A quest's requirements and rewards, on the quest name's i
const questNote = ({ Name, customArray, itemReq, rewards }) => <Stack gap={1.5}>
  <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(Name)}</Typography>
  {customArray?.length ? <NoteGroup label={'Requirements'} rows={customArray.map(({ desc, value }) => [
    cleanUnderscore(`${desc ?? ''}`).replace(/:\s*$/, ''), Number.isFinite(Number(value)) ? formatNum(Number(value)) : value])}/> : null}
  {itemReq?.length ? <NoteGroup label={'Items'} rows={itemReq.map(({ name, rawName, amount }) => [
    spriteLabel(`data/${rawName}.png`, cleanUnderscore(name || items?.[rawName]?.displayName || rawName)), formatNum(amount ?? 0)])}/> : null}
  {rewards?.length ? <NoteGroup label={'Rewards'} rows={rewards.map(rewardRow)}/> : null}
</Stack>;

const questSub = (quest, characters) => {
  const working = quest?.inProgress ? quest.progress.filter(({ status }) => status === 0)
    .map(({ charIndex }) => characters?.[charIndex]?.name).filter(Boolean) : [];
  if (!working.length && !quest?.missableDrops?.length) return undefined;
  return <Stack gap={0.5} component={'span'}>
    {working.length ? <span>{`In progress for ${working.join(', ')}`}</span> : null}
    {quest?.missableDrops?.length ? <Stack direction={'row'} flexWrap={'wrap'} columnGap={1.5} rowGap={0.5} component={'span'}>
      {quest.missableDrops.map(({ rawName, greenStacked }) => <Box key={rawName} component={'span'}
                                                                   sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <GameIcon src={`data/${rawName}.png`} size={16} alt={''}/>
        {`${cleanUnderscore(items?.[rawName]?.displayName || rawName)}${greenStacked ? ' (greenstacked)' : ''}`}
      </Box>)}
    </Stack> : null}
  </Stack>;
};

// The name's last word and its i on one line, so the i never wraps alone
const questName = (quest) => {
  const name = cleanUnderscore(quest?.Name);
  const lastWordAt = name.lastIndexOf(' ') + 1;
  return <>
    {name.slice(0, lastWordAt)}
    <Box component={'span'} sx={{ whiteSpace: 'nowrap' }}>
      {name.slice(lastWordAt)}
      <InfoButton label={name} sx={{ ml: 0.5 }}>{questNote(quest)}</InfoButton>
    </Box>
  </>;
};

const questState = (quest) => (quest?.done ? <StatusText status={'done'}>Done</StatusText>
  : quest?.inProgress ? <StatusText status={'active'}>In progress</StatusText> : undefined);

// One world: its name over its npcs, each a collapsible Panel of its quests. A world with no npc shown draws nothing.
const questRow = (quest, index, characters) => <Panel.Row key={quest?.QuestName ?? `${quest?.Name}-${index}`}
                                                          name={questName(quest)}
                                                          sub={questSub(quest, characters)}
                                                          value={questState(quest)}/>;

const WorldQuest = ({ worldName, npcs, characters }) => {
  if (!npcs?.length) return null;
  return <Stack gap={1.5}>
    <Typography variant={'sectionTitle'} component={'h2'}>{cleanUnderscore(worldName)}</Typography>
    {npcs.map((npc) => <Panel key={npc?.name} collapsible defaultOpen={false} icon={npcSprite(npc?.name)}
                              title={cleanUnderscore(npc?.name)}
                              meta={<>
                                {`${formatNum(npc?.done ?? 0)} / ${formatNum(npc?.total ?? 0)} done`}
                                {npc?.status === 0 ? <> · <StatusText status={'active'}>In progress</StatusText></>
                                  : npc?.status === 1 ? <> · <StatusText status={'done'}>Done</StatusText></> : null}
                                {npc?.missablePending ? <> · <StatusText status={'needs'}>Missable drop</StatusText></> : null}
                              </>}>
      {npc?.npcQuests?.map((quest, index) => questRow(quest, index, characters))}
      {npc?.laterQuests?.length ? <Panel.Group label={npc?.laterLabel}>
        {npc.laterQuests.map((quest, index) => questRow(quest, index, characters))}
      </Panel.Group> : null}
    </Panel>)}
  </Stack>;
};

export default WorldQuest;

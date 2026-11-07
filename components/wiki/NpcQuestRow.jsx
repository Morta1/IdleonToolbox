import React from 'react';
import { Link, Stack, Typography } from '@mui/material';
import InfoButton, { NoteTrigger } from '@components/common/InfoButton';
import Panel from '@components/common/cards/Panel';
import TagLine from '@components/common/TagLine';
import EntityIcon from './EntityIcon';
import CoinAmount, { isCoin } from './CoinAmount';
import { itemTooltip } from './ItemTooltip';
import { navigateOnPlainClick } from './links';
import { entityName } from '@utility/wiki/names.mjs';
import { formatNum } from '@utility/helpers';

// An NPC's quest chain, as a block per quest rather than a line per quest.
//
// The generic relation row could only give a name, a #order and a row of unlabelled reward icons,
// which is how Toadstall's page came to read "x10" with no word saying ten of what. Everything here
// is already in the graph and was going unread: every one of the 348 quests carries a difficulty,
// and 217 carry objectives that the quest's own page shows and the NPC's page did not.
// Quest difficulty is out of 10. Not extracted: the game writes no such maximum anywhere (no literal in N.js).
const DIFFICULTY_MAX = 10;

const Reward = ({ item, amount, onNavigate, hrefFor, id }) => {
  const href = hrefFor?.(id);
  const label = entityName(item);
  const count = amount > 1 ? `${formatNum(amount, 'whole')} ` : '';
  return <Stack direction={'row'} gap={0.5} alignItems={'center'}>
    {isCoin(item)
      ? <CoinAmount amount={amount}/>
      : <>
        <NoteTrigger note={itemTooltip(item) || label} label={label}><EntityIcon node={item} size={24}/></NoteTrigger>
        {item.navigable === false
          ? <Typography variant={'caption'} color={'text.secondary'}>{count}{label}</Typography>
          : <Link
            href={href}
            variant={'caption'}
           
            color={'text.secondary'}
            onClick={navigateOnPlainClick(onNavigate, id, Boolean(href))}
          >
            {count}{label}
          </Link>}
      </>}
  </Stack>;
};

// A quest's items, one relation at a time. Both directions are the quest's own outgoing edges.
const questItems = (index, questId, rel) => (index.edgesFrom.get(questId) || [])
  .filter((itemEdge) => itemEdge.rel === rel)
  .map((itemEdge) => ({ edge: itemEdge, item: index.byId[itemEdge.to] }))
  .filter((entry) => entry.item);

const ItemLine = ({ title, entries, onNavigate, hrefFor }) => {
  if (entries.length === 0) return null;
  return <Stack direction={'row'} gap={1.5} alignItems={'center'} flexWrap={'wrap'}>
    <Typography variant={'groupLabel'} component={'div'} color={'text.muted'}>
      {title}
    </Typography>
    {entries.map((entry, entryIndex) => <Reward
      key={`${entry.edge.to}-${entryIndex}`}
      id={entry.edge.to}
      item={entry.item}
      amount={entry.edge.meta?.amount}
      onNavigate={onNavigate}
      hrefFor={hrefFor}
    />)}
  </Stack>;
};

const NpcQuestRow = ({ index, edge, other: quest, otherId, onNavigate, hrefFor }) => {
  const rewards = questItems(index, otherId, 'rewards');
  const requires = questItems(index, otherId, 'requires');
  const objectives = quest.objectives || [];
  const href = hrefFor?.(otherId);

  // The chain is ordered and the steps are read in sequence, so they are separated rather than boxed: a border per quest
  // would put six frames on Cowbo Jones' page. The step number leads: it is the one thing that orders the chain.
  return <Panel.Row
    sx={{ px: 0, py: 1.5, alignItems: 'flex-start', '&:not(:first-of-type)': { borderTop: 1, borderColor: 'divider' } }}
    icon={<Typography variant={'caption'} color={'text.secondary'} sx={{ width: 24, flexShrink: 0, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
      {edge.meta?.order ?? '?'}
    </Typography>}
    name={<Stack direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'}>
      <Link href={href} variant={'body2'} sx={{ fontWeight: 'fontWeightMedium' }} onClick={navigateOnPlainClick(onNavigate, otherId, Boolean(href))}>
        {entityName(quest)}
      </Link>
      {quest.difficulty ? <Stack direction={'row'} gap={0.5} alignItems={'center'}>
        <TagLine variant={'body2'} tags={[`Difficulty ${quest.difficulty} / ${DIFFICULTY_MAX}`]}/>
        <InfoButton label={'difficulty'}>The game's own difficulty rating for this quest.</InfoButton>
      </Stack> : null}
    </Stack>}
    sub={<Stack gap={0.75} sx={{ mt: 0.5 }}>
      {quest.description ? <Typography variant={'caption'} color={'text.secondary'}>
        {quest.description}
      </Typography> : null}

      {objectives.length > 0 ? <Stack direction={'row'} gap={0.75} alignItems={'baseline'} flexWrap={'wrap'}>
        <Typography variant={'groupLabel'} component={'div'} color={'text.muted'}>
          Objectives
        </Typography>
        {/* A count of one is the game's way of writing a flag, and "Create a Party 1" reads worse than "Create a Party".
            Only a real count is printed. */}
        <TagLine variant={'caption'} tags={objectives.map((objective) =>
          `${objective.desc}${objective.value > 1 ? ` ${formatNum(objective.value, 'whole')}` : ''}`)}/>
      </Stack> : null}

      <ItemLine title={'Requires'} entries={requires} onNavigate={onNavigate} hrefFor={hrefFor}/>
      <ItemLine title={'Rewards'} entries={rewards} onNavigate={onNavigate} hrefFor={hrefFor}/>
    </Stack>}
  />;
};

export default NpcQuestRow;

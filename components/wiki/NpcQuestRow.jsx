import React from 'react';
import { Box, Chip, Link, Stack, Typography } from '@mui/material';
import Tooltip from '@components/Tooltip';
import { EntityIcon } from './EntityPanel';
import CoinAmount, { isCoin } from './CoinAmount';
import { itemTooltip } from './ItemTooltip';
import { entityName } from '@utility/wiki/names';
import { numberWithCommas } from '@utility/helpers';

// An NPC's quest chain, as a block per quest rather than a line per quest.
//
// The generic relation row could only give a name, a #order and a row of unlabelled reward icons,
// which is how Toadstall's page came to read "x10" with no word saying ten of what. Everything here
// is already in the graph and was going unread: every one of the 348 quests carries a difficulty,
// and 217 carry objectives that the quest's own page shows and the NPC's page did not.
const DIFFICULTY_MAX = 10;

const Reward = ({ item, amount, onNavigate, hrefFor, id }) => {
  const href = hrefFor?.(id);
  const label = entityName(item);
  const count = amount > 1 ? `${numberWithCommas(amount)} ` : '';
  return <Stack direction={'row'} gap={0.5} alignItems={'center'}>
    {isCoin(item)
      ? <CoinAmount amount={amount} size={18}/>
      : <>
        <Tooltip title={itemTooltip(item) || label}>
          <span style={{ display: 'inline-flex' }}><EntityIcon node={item} size={20}/></span>
        </Tooltip>
        {item.navigable === false
          ? <Typography variant={'caption'} color={'text.secondary'}>{count}{label}</Typography>
          : <Link
            href={href}
            variant={'caption'}
            underline={'hover'}
            color={'text.secondary'}
            onClick={(event) => {
              if (!onNavigate) return;
              event.preventDefault();
              onNavigate(id);
            }}
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
    <Typography variant={'caption'} color={'text.disabled'} textTransform={'uppercase'} letterSpacing={0.5}>
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

  return <Box sx={{
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    columnGap: 1.5,
    rowGap: 0.5,
    py: 1.5,
    // The chain is ordered and the steps are read in sequence, so they are separated rather than
    // boxed: a border per quest would put six frames on Cowbo Jones' page.
    '&:not(:first-of-type)': { borderTop: '1px solid', borderColor: 'divider' }
  }}>
    {/* The step number, not a caption saying "#3": it is the one thing that orders the chain. */}
    <Box sx={{
      gridRow: '1 / span 1',
      width: 26,
      height: 26,
      borderRadius: '50%',
      border: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'text.secondary',
      fontSize: 13,
      fontVariantNumeric: 'tabular-nums'
    }}>
      {edge.meta?.order ?? '?'}
    </Box>

    <Stack direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'}>
      <Link
        href={href}
        variant={'body2'}
        fontWeight={600}
        underline={'hover'}
        onClick={(event) => {
          if (!onNavigate) return;
          event.preventDefault();
          onNavigate(otherId);
        }}
      >
        {entityName(quest)}
      </Link>
      {quest.difficulty ? <Tooltip title={'The game\'s own difficulty rating for this quest'}>
        <Chip
          size={'small'}
          variant={'outlined'}
          label={`Difficulty ${quest.difficulty}/${DIFFICULTY_MAX}`}
          sx={{ cursor: 'help' }}
        />
      </Tooltip> : null}
    </Stack>

    {/* Everything below the title lines up under it, past the number. */}
    <Stack gap={0.75} sx={{ gridColumn: 2 }}>
      {quest.description ? <Typography variant={'caption'} color={'text.secondary'}>
        {quest.description}
      </Typography> : null}

      {objectives.length > 0 ? <Stack direction={'row'} gap={0.75} alignItems={'baseline'} flexWrap={'wrap'}>
        <Typography variant={'caption'} color={'text.disabled'} textTransform={'uppercase'} letterSpacing={0.5}>
          Objectives
        </Typography>
        {objectives.map((objective, objectiveIndex) => <Chip
          key={`${objective.desc}-${objectiveIndex}`}
          size={'small'}
          variant={'outlined'}
          // A count of one is the game's way of writing a flag, and "Create a Party: 1" reads worse
          // than "Create a Party". Only a real count is printed.
          label={`${objective.desc}${objective.value > 1 ? `: ${numberWithCommas(objective.value)}` : ''}`}
        />)}
      </Stack> : null}

      <ItemLine title={'Requires'} entries={requires} onNavigate={onNavigate} hrefFor={hrefFor}/>
      <ItemLine title={'Rewards'} entries={rewards} onNavigate={onNavigate} hrefFor={hrefFor}/>
    </Stack>
  </Box>;
};

export default NpcQuestRow;

import React from 'react';
import { Stack } from '@mui/material';
import { obols as obolSlots } from '@website-data';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import { getObolStatMulti } from '@parsers/world-7/menagerie';
import ItemDisplay from 'components/common/ItemDisplay';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import StatusText from '@components/common/StatusText';
import Notice from '@components/common/Notice';

const shapes = {
  'Circle': '1',
  'Square': '2',
  'Hexagon': '3',
  'Sparkle': '4'
};

// The game's board rows: the family board 5, 5, 4, 5, 5; a character's 5, 4, 3, 4, 7
const ROWS = { account: [5, 5, 4, 5, 5], character: [5, 4, 3, 4, 7] };
const rowsOf = (slots, sizes) => sizes.map((size, row) => {
  const start = sizes.slice(0, row).reduce((sum, count) => sum + count, 0);
  return slots.slice(start, start + size);
}).filter((row) => row.length);

// A guest has no save list: the family board's slots are game data, each locked behind its level requirement
const guestBoard = () => Object.values(obolSlots?.family ?? {})
  .map(({ shape, levelReq }) => (levelReq > 0 ? { rawName: 'Locked', shape, levelReq } : { rawName: 'Blank', shape }));

const isLocked = (item) => item?.levelReq > 0 && item?.rawName?.includes('Locked');
const isEmpty = (item) => !item?.displayName || item?.rawName?.includes('Blank');

const obolTile = (item, index, type, totalLevels) => {
  const key = `${item?.rawName}-${index}`;
  if (isLocked(item)) {
    return <IconTile key={key} icon={`data/ObolLocked${shapes[item?.shape]}.png`} alt={'Locked slot'}
                     // "Lv N" is one unit (Num never wraps); "Lv 1,250" can't fit a family tile (49 px), so from
                     // four digits the level reads as its amount alone, beside the lock
                     value={item.levelReq} kind={item.levelReq >= 1e3 ? 'amount' : 'level'}
                     details={type === 'account'
                       ? `Unlocks at ${formatNum(item.levelReq)} total character levels (you have ${formatNum(totalLevels ?? 0)}).`
                       : `Unlocks at character level ${formatNum(item.levelReq)}.`}/>;
  }
  // An empty socket has nothing more to say than its sprite: not a button
  if (isEmpty(item)) return <IconTile key={key} icon={`etc/ObolEmpty${shapes[item?.shape]}.png`} alt={'Empty slot'}/>;
  return <IconTile key={key} icon={`data/${item?.rawName}.png`} alt={cleanUnderscore(item?.displayName)}
                   details={item?.displayName === 'ERROR' ? undefined : <Stack gap={1}>
                     <ItemDisplay {...item} allowNegativeValues={false}/>
                     {item?.rerolled ? <StatusText status={'info'}>Rerolled stats</StatusText> : null}
                   </Stack>}/>;
};

const ObolsView = ({ obols, type = 'character', obolStats, characters, account }) => {
  const totalLevels = characters?.reduce((res, { level }) => res + (level || 0), 0);
  if (!obols) return null;
  if (obolStats) {
    const stats = Object.entries(obols?.stats ?? {});
    return <Panel title={'Obol stats'}>
      {stats.length
        ? stats.map(([stat, value], index) => {
          const multi = getObolStatMulti(account, stat);
          const personal = (value?.personalBonus ?? 0) * multi;
          const family = (value?.familyBonus ?? 0) * multi;
          return <Panel.KV key={`${stat}-${index}`} label={cleanUnderscore(stat)}
                           value={`${formatNum(personal + family)} (personal ${formatNum(personal)}, family ${formatNum(family)})`}/>;
        })
        : <Notice sx={{ m: 2 }}>No stats from obols yet.</Notice>}
    </Panel>;
  }
  const slots = obols?.list?.length ? obols.list : type === 'account' ? guestBoard() : [];
  const board = <Stack gap={1} sx={{ p: 1.5 }}>
    {rowsOf(slots, ROWS[type] ?? ROWS.character).map((row, rowIndex) => <CardGrid key={rowIndex} size={'icon'}
                                                                                     columns={row.length}
                                                                                     sx={{ justifyContent: 'center' }}>
      {row.map((item, index) => obolTile(item, index, type, totalLevels))}
    </CardGrid>)}
  </Stack>;
  if (type === 'account') return board;
  return <Panel title={'Obols'}>{board}</Panel>;
};

export default ObolsView;
